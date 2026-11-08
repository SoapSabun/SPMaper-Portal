import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the service role key to bypass RLS, otherwise fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CONFIGURATION: AddMaths / Matematik Tambahan
// Subject ID: 5385f218-f767-43ef-92de-da63d50708ec
// ==========================================
const ADDMATHS_ID = '5385f218-f767-43ef-92de-da63d50708ec';

export const TASKS = [
  { url: 'https://trial.spmpaper.me/?dir=2025%2FMatematik%20Tambahan%20(Add%20Maths)', subjectId: ADDMATHS_ID, year: 2025 },
  { url: 'https://trial.spmpaper.me/?dir=2024%2FMatematik%20Tambahan%20(Add%20Maths)', subjectId: ADDMATHS_ID, year: 2024 },
  { url: 'https://trial.spmpaper.me/?dir=2023%2FMatematik%20Tambahan%20(Add%20Maths)', subjectId: ADDMATHS_ID, year: 2023 },
  { url: 'https://trial.spmpaper.me/?dir=2022%2FMatematik%20Tambahan%20(Add%20Maths)', subjectId: ADDMATHS_ID, year: 2022 },
  { url: 'https://trial.spmpaper.me/?dir=2021%2FMatematik%20Tambahan%20(Add%20Math)', subjectId: ADDMATHS_ID, year: 2021 },
  { url: 'https://trial.spmpaper.me/?dir=2020%2FMatematik%20Tambahan%20(Addmath)', subjectId: ADDMATHS_ID, year: 2020 },
  { url: 'https://trial.spmpaper.me/?dir=2019%2FAddMath', subjectId: ADDMATHS_ID, year: 2019 },
  { url: 'https://trial.spmpaper.me/?dir=2018%2FAddMath', subjectId: ADDMATHS_ID, year: 2018 },
];

function detectNegeri(folderPath, filename) {
  const combined = `${folderPath} ${filename}`.toLowerCase();

  // National / Special bodies
  if (combined.includes('sbp')) return 'SBP';
  if (combined.includes('mrsm')) return 'MRSM';

  // Specific Malaysian States
  if (combined.includes('johor') || combined.includes('batu pahat') || combined.includes('johor bahru') || combined.includes('kulai') || combined.includes('muar') || combined.includes('kluang')) return 'Johor';
  if (combined.includes('kedah') || combined.includes('langkawi') || combined.includes('kubang pasu')) return 'Kedah';
  if (combined.includes('kelantan') || combined.includes('yik') || combined.includes('kota bharu')) return 'Kelantan';
  if (combined.includes('melaka') || combined.includes('malacca')) return 'Melaka';
  if (combined.includes('negeri sembilan') || combined.includes(' n9') || combined.includes('_n9') || combined.includes('-n9') || combined.includes('/n9')) return 'Negeri Sembilan';
  if (combined.includes('pahang') || combined.includes('kuantan')) return 'Pahang';
  if (combined.includes('perak') || combined.includes('ipoh') || combined.includes('taiping')) return 'Perak';
  if (combined.includes('perlis') || combined.includes('kangar')) return 'Perlis';
  if (combined.includes('pulau pinang') || combined.includes('penang')) return 'Pulau Pinang';
  if (combined.includes('sabah')) return 'Sabah';
  if (combined.includes('sarawak')) return 'Sarawak';
  if (combined.includes('selangor')) return 'Selangor';
  if (combined.includes('terengganu') || combined.includes('trg')) return 'Terengganu';
  if (combined.includes('kuala lumpur') || combined.includes('wp kl') || combined.includes('wpkl')) return 'W.P. Kuala Lumpur';
  if (combined.includes('putrajaya')) return 'W.P. Putrajaya';
  if (combined.includes('labuan')) return 'W.P. Labuan';

  return 'Percubaan';
}

function detectPaperType(filename) {
  const lower = filename.toLowerCase();

  const isSkema = 
    lower.includes('skema') || 
    lower.includes('jawapan') || 
    lower.includes('answer') || 
    lower.includes('scheme') || 
    lower.includes('marking') ||
    lower.includes('ms ') ||
    lower.includes('ms_') ||
    lower.includes('-ms');

  const isK1 = lower.includes('k1') || lower.includes('kertas 1') || lower.includes('p1') || lower.includes('paper 1');
  const isK2 = lower.includes('k2') || lower.includes('kertas 2') || lower.includes('p2') || lower.includes('paper 2');
  const isK3 = lower.includes('k3') || lower.includes('kertas 3') || lower.includes('p3') || lower.includes('paper 3');

  if (isSkema) {
    if (isK1 && !isK2) return 'Skema Kertas 1';
    if (isK2 && !isK1) return 'Skema Kertas 2';
    if (isK3) return 'Skema Kertas 3';
    return 'Skema';
  } else {
    if (isK1 && !isK2) return 'Kertas 1';
    if (isK2 && !isK1) return 'Kertas 2';
    if (isK3) return 'Kertas 3';
    return 'Kertas 1';
  }
}

function cleanTitle(rawName) {
  let name = decodeURIComponent(rawName);
  if (name.toLowerCase().endsWith('.pdf')) {
    name = name.slice(0, -4).trim();
  }
  return name.replace(/\s+/g, ' ').trim();
}

function scoreTitle(paper) {
  let score = 0;
  const title = paper.title || '';
  if (/^\d{4}\b/.test(title)) score += 30;
  const upperCount = (title.match(/[A-Z]/g) || []).length;
  const lowerCount = (title.match(/[a-z]/g) || []).length;
  if (lowerCount > upperCount) score += 20;
  if (title.startsWith('SKEMA-') || title.startsWith('SKEMA_')) score -= 5;
  if (title.includes('Trial K1') || title.includes('Trial K2')) score -= 5;
  if (paper.negeri && paper.negeri !== 'Percubaan') score += 10;
  if (title.includes('SBP') && paper.negeri === 'SBP') score += 15;
  if (title.includes('MRSM') && paper.negeri === 'MRSM') score += 15;
  score -= Math.min(title.length / 10, 5);
  return score;
}

/**
 * Deduplicate papers in memory using HTTP HEAD content-length
 */
async function deduplicateBatch(papers) {
  if (papers.length <= 1) return papers;
  console.log(`  🔍 Checking ${papers.length} links for duplicate uploads via file sizes...`);
  
  const CONCURRENCY = 15;
  const paperDetails = [];

  for (let i = 0; i < papers.length; i += CONCURRENCY) {
    const batch = papers.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (p) => {
      try {
        const res = await axios.head(p.file_path, { timeout: 10000 });
        const size = res.headers['content-length'];
        return { ...p, size: size ? parseInt(size, 10) : null };
      } catch (err) {
        return { ...p, size: null };
      }
    });
    const results = await Promise.all(promises);
    paperDetails.push(...results);
  }

  const bySize = new Map();
  const byTitle = new Map();

  for (const p of paperDetails) {
    if (p.size) {
      if (!bySize.has(p.size)) bySize.set(p.size, []);
      bySize.get(p.size).push(p);
    }
    const tKey = p.title.toLowerCase().trim();
    if (!byTitle.has(tKey)) byTitle.set(tKey, []);
    byTitle.get(tKey).push(p);
  }

  const discardedIds = new Set();

  for (const group of bySize.values()) {
    if (group.length > 1) {
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      for (const dup of group.slice(1)) {
        discardedIds.add(dup.file_path);
      }
    }
  }

  for (const group of byTitle.values()) {
    if (group.length > 1) {
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      for (const dup of group.slice(1)) {
        discardedIds.add(dup.file_path);
      }
    }
  }

  const clean = papers.filter(p => !discardedIds.has(p.file_path));
  console.log(`  ✨ Filtered out ${papers.length - clean.length} redundant duplicate uploads. Kept ${clean.length} unique papers.`);
  return clean;
}

/**
 * Recursively crawl directories on trial.spmpaper.me starting from rootDir
 */
async function crawlFolder(startDir) {
  const visited = new Set();
  const queue = [startDir];
  const pdfLinks = [];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    if (visited.has(currentDir)) continue;
    visited.add(currentDir);

    const url = `https://trial.spmpaper.me/?dir=${encodeURIComponent(currentDir)}`;
    try {
      const res = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(res.data);

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href) return;

        // Check for subdirectories to enqueue
        if (href.includes('?dir=')) {
          try {
            const u = new URL(href, 'https://trial.spmpaper.me');
            const d = u.searchParams.get('dir');
            if (d && d.startsWith(startDir) && !visited.has(d) && !queue.includes(d)) {
              if (!u.searchParams.has('order')) {
                queue.push(d);
              }
            }
          } catch (e) {}
        }

        // Check for PDF files
        if (href.toLowerCase().includes('.pdf')) {
          let fullPdfUrl = href;
          if (!fullPdfUrl.startsWith('http')) {
            fullPdfUrl = `https://trial.spmpaper.me${fullPdfUrl.startsWith('/') ? '' : '/'}${fullPdfUrl}`;
          }
          pdfLinks.push({
            name: text || href.split('/').pop(),
            url: fullPdfUrl,
            folder: currentDir
          });
        }
      });
    } catch (err) {
      console.error(`  ⚠️ Error fetching directory "${currentDir}":`, err.message);
    }
  }

  return pdfLinks;
}

async function runScraper() {
  if (TASKS.length === 0) {
    console.log("No tasks defined in the TASKS array. Please add some targets first!");
    return;
  }

  // Pre-fetch all existing paper URLs for this subject to prevent duplicates fast
  console.log(`Checking existing papers in database for subject ${ADDMATHS_ID}...`);
  const { data: existingRows, error: fetchErr } = await supabase
    .from('papers')
    .select('file_path')
    .eq('subject_id', ADDMATHS_ID);

  if (fetchErr) {
    console.error('Error fetching existing papers:', fetchErr.message);
  }

  const existingUrlSet = new Set((existingRows || []).map(r => r.file_path));
  console.log(`Found ${existingUrlSet.size} already existing papers in database.`);

  let grandTotalAdded = 0;

  for (const task of TASKS) {
    const { url: TARGET_URL, subjectId: SUBJECT_ID, year: YEAR } = task;
    console.log(`\n==========================================`);
    console.log(`Starting scrape of Year ${YEAR}: ${TARGET_URL}`);

    try {
      const u = new URL(TARGET_URL);
      const startDir = u.searchParams.get('dir');
      if (!startDir) {
        console.warn(`No '?dir=' param found in ${TARGET_URL}, skipping.`);
        continue;
      }

      console.log(`Crawling folder tree recursively for "${startDir}"...`);
      const pdfs = await crawlFolder(startDir);
      console.log(`Found ${pdfs.length} PDF links in Year ${YEAR}! Preparing papers...`);

      const papersToInsert = [];

      for (const item of pdfs) {
        if (existingUrlSet.has(item.url)) {
          continue;
        }

        const title = cleanTitle(item.name);
        const negeri = detectNegeri(item.folder, title);
        const paperType = detectPaperType(title);

        papersToInsert.push({
          subject_id: SUBJECT_ID,
          title: title,
          year: YEAR,
          file_path: item.url,
          negeri: negeri,
          paper_type: paperType
        });

        // Mark as seen in our local set to avoid duplicate entries within same scrape
        existingUrlSet.add(item.url);
      }

      // In-memory deduplication by checking content length and titles
      const cleanPapersToInsert = await deduplicateBatch(papersToInsert);

      console.log(`Inserting ${cleanPapersToInsert.length} clean papers for Year ${YEAR}...`);

      // Insert in batches of 50 to optimize Supabase network requests
      const BATCH_SIZE = 50;
      let insertedCount = 0;

      for (let i = 0; i < cleanPapersToInsert.length; i += BATCH_SIZE) {
        const batch = cleanPapersToInsert.slice(i, i + BATCH_SIZE);
        const { error: insertErr } = await supabase.from('papers').insert(batch);
        if (insertErr) {
          console.error(`  ❌ Failed inserting batch ${i / BATCH_SIZE + 1}:`, insertErr.message);
        } else {
          insertedCount += batch.length;
          console.log(`  ✅ Inserted batch: ${insertedCount}/${cleanPapersToInsert.length} papers`);
        }
      }

      grandTotalAdded += insertedCount;
      console.log(`🎉 Finished Year ${YEAR}. Added ${insertedCount} papers.`);

    } catch (err) {
      console.error(`Error processing task ${TARGET_URL}:`, err.message);
    }
  }

  console.log(`\n🚀 All tasks completed! Total new papers added to database: ${grandTotalAdded}`);
}

// Run the scraper
runScraper();
