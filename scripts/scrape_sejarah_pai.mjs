import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEJARAH_ID = 'f20c754c-48f3-4d13-a0ec-31a95f27154a';
const PAI_ID = '6cddab4b-c8f0-4c2b-9766-d1ba882bc1c9';

const SUBJECTS_CONFIG = [
  {
    name: 'Sejarah',
    id: SEJARAH_ID,
    tasks: [
      { dir: '2025/Sejarah', year: 2025 },
      { dir: '2024/Sejarah', year: 2024 },
      { dir: '2023/Sejarah', year: 2023 },
      { dir: '2022/Sejarah', year: 2022 },
      { dir: '2021/Sejarah', year: 2021 },
      { dir: '2020/Sejarah', year: 2020 },
      { dir: '2019/Sejarah', year: 2019 },
      { dir: '2018/Sejarah', year: 2018 },
    ]
  },
  {
    name: 'Pendidikan Agama Islam',
    id: PAI_ID,
    tasks: [
      { dir: '2025/Pendidikan Islam', year: 2025 },
      { dir: '2025/Pendidkan Islam', year: 2025 },
      { dir: '2024/Pendidikan Islam', year: 2024 },
      { dir: '2022/Pendidikan Islam', year: 2022 },
      { dir: '2021/Pendidikan Islam', year: 2021 },
      { dir: '2020/Pendidikan Islam', year: 2020 },
      { dir: '2019/Pendidikan Islam', year: 2019 },
      { dir: '2018/Pendidikan Islam', year: 2018 },
    ]
  }
];

function detectNegeri(folderPath, filename) {
  const combined = `${folderPath} ${filename}`.toLowerCase();

  if (combined.includes('sbp')) return 'SBP';
  if (combined.includes('mrsm')) return 'MRSM';

  if (combined.includes('johor') || combined.includes('batu pahat') || combined.includes('johor bahru') || combined.includes('kulai') || combined.includes('muar') || combined.includes('kluang') || combined.includes('pasir gudang') || combined.includes('segamat') || combined.includes('tangkak')) return 'Johor';
  if (combined.includes('kedah') || combined.includes('langkawi') || combined.includes('kubang pasu') || combined.includes('kota setar')) return 'Kedah';
  if (combined.includes('kelantan') || combined.includes('yik') || combined.includes('kota bharu') || combined.includes('pasir mas')) return 'Kelantan';
  if (combined.includes('melaka') || combined.includes('malacca')) return 'Melaka';
  if (combined.includes('negeri sembilan') || combined.includes(' n9') || combined.includes('_n9') || combined.includes('-n9') || combined.includes('/n9') || combined.includes('seremban')) return 'Negeri Sembilan';
  if (combined.includes('pahang') || combined.includes('kuantan') || combined.includes('temerloh') || combined.includes('jerantut')) return 'Pahang';
  if (combined.includes('perak') || combined.includes('ipoh') || combined.includes('taiping') || combined.includes('kinta')) return 'Perak';
  if (combined.includes('perlis') || combined.includes('kangar')) return 'Perlis';
  if (combined.includes('pulau pinang') || combined.includes('penang')) return 'Pulau Pinang';
  if (combined.includes('sabah') || combined.includes('kota kinabalu') || combined.includes('sandakan')) return 'Sabah';
  if (combined.includes('sarawak') || combined.includes('kuching') || combined.includes('miri') || combined.includes('sibu')) return 'Sarawak';
  if (combined.includes('selangor')) return 'Selangor';
  if (combined.includes('terengganu') || combined.includes('trg') || combined.includes('kuala terengganu')) return 'Terengganu';
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
    lower.includes('penskoran') ||
    lower.includes('ms ') ||
    lower.includes('ms_') ||
    lower.includes('-ms');

  const isSoalan = 
    lower.includes('soalan') || 
    lower.includes('question') ||
    lower.includes('kertas') ||
    lower.includes('paper');

  const hasBoth = 
    (lower.includes('+') && isSkema) ||
    (lower.includes('&') && isSkema) ||
    (isSoalan && isSkema);

  const isK1 = lower.includes('k1') || lower.includes('kertas 1') || lower.includes('p1') || lower.includes('paper 1');
  const isK2 = lower.includes('k2') || lower.includes('kertas 2') || lower.includes('p2') || lower.includes('paper 2');
  const isK3 = lower.includes('k3') || lower.includes('kertas 3') || lower.includes('p3') || lower.includes('paper 3');

  if (hasBoth) {
    if (isK1 && !isK2 && !isK3) return 'Kertas 1 & Skema';
    if (isK2 && !isK1 && !isK3) return 'Kertas 2 & Skema';
    if (isK3 && !isK1 && !isK2) return 'Kertas 3 & Skema';
    return 'Soalan & Skema';
  }

  if (isSkema) {
    if (isK1 && !isK2 && !isK3) return 'Skema Kertas 1';
    if (isK2 && !isK1 && !isK3) return 'Skema Kertas 2';
    if (isK3 && !isK1 && !isK2) return 'Skema Kertas 3';
    return 'Skema';
  } else {
    if (isK1 && !isK2 && !isK3) return 'Kertas 1';
    if (isK2 && !isK1 && !isK3) return 'Kertas 2';
    if (isK3 && !isK1 && !isK2) return 'Kertas 3';
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
  if (title.includes('+') || title.includes('&') || title.toLowerCase().includes('soalan')) score += 25;
  if (title.startsWith('SKEMA-') || title.startsWith('SKEMA_')) score -= 5;
  if (title.includes('Trial K1') || title.includes('Trial K2')) score -= 5;
  if (paper.negeri && paper.negeri !== 'Percubaan') score += 10;
  if (title.includes('SBP') && paper.negeri === 'SBP') score += 15;
  if (title.includes('MRSM') && paper.negeri === 'MRSM') score += 15;
  score -= Math.min(title.length / 10, 5);
  return score;
}

async function deduplicateBatch(papers) {
  if (papers.length <= 1) return papers;
  console.log(`  🔍 Checking ${papers.length} links for duplicate uploads via HTTP HEAD...`);
  
  const CONCURRENCY = 20;
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

  // Group strictly by state: state + size, and state + title
  const bySize = new Map();
  const byTitle = new Map();

  for (const p of paperDetails) {
    if (p.size) {
      const sKey = `${p.negeri}__${p.size}`;
      if (!bySize.has(sKey)) bySize.set(sKey, []);
      bySize.get(sKey).push(p);
    }
    const tKey = `${p.negeri}__${p.title.toLowerCase().trim()}`;
    if (!byTitle.has(tKey)) byTitle.set(tKey, []);
    byTitle.get(tKey).push(p);
  }

  const discardedUrls = new Set();

  for (const group of bySize.values()) {
    if (group.length > 1) {
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      for (const dup of group.slice(1)) {
        discardedUrls.add(dup.file_path);
      }
    }
  }

  for (const group of byTitle.values()) {
    if (group.length > 1) {
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      for (const dup of group.slice(1)) {
        discardedUrls.add(dup.file_path);
      }
    }
  }

  const clean = papers.filter(p => !discardedUrls.has(p.file_path));
  console.log(`  ✨ Filtered out ${papers.length - clean.length} redundant duplicate uploads. Kept ${clean.length} unique papers.`);
  return clean;
}

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
      const res = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 15000 
      });
      const $ = cheerio.load(res.data);

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href) return;

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

async function run() {
  console.log('🚀 Starting Scraper for Sejarah & Pendidikan Agama Islam...');

  for (const subject of SUBJECTS_CONFIG) {
    console.log(`\n======================================================`);
    console.log(`📚 SUBJECT: ${subject.name} (ID: ${subject.id})`);
    console.log(`======================================================`);

    const { data: existingRows } = await supabase
      .from('papers')
      .select('file_path')
      .eq('subject_id', subject.id);

    const existingUrlSet = new Set((existingRows || []).map(r => r.file_path));
    console.log(`Found ${existingUrlSet.size} already existing papers in database.`);

    let subjectTotalAdded = 0;

    for (const task of subject.tasks) {
      console.log(`\n--- Crawling ${subject.name} Year ${task.year} ("${task.dir}") ---`);
      try {
        const pdfs = await crawlFolder(task.dir);
        console.log(`Found ${pdfs.length} PDF links for Year ${task.year}. Processing...`);

        const papersToInsert = [];
        for (const item of pdfs) {
          if (existingUrlSet.has(item.url)) continue;

          const title = cleanTitle(item.name);
          const negeri = detectNegeri(item.folder, title);
          const paperType = detectPaperType(title);

          papersToInsert.push({
            subject_id: subject.id,
            title: title,
            year: task.year,
            file_path: item.url,
            negeri: negeri,
            paper_type: paperType
          });

          existingUrlSet.add(item.url);
        }

        const cleanPapers = await deduplicateBatch(papersToInsert);

        const BATCH_SIZE = 50;
        let inserted = 0;

        for (let i = 0; i < cleanPapers.length; i += BATCH_SIZE) {
          const batch = cleanPapers.slice(i, i + BATCH_SIZE);
          const { error: insErr } = await supabase.from('papers').insert(batch);
          if (insErr) {
            console.error(`  ❌ Insert error on batch ${i / BATCH_SIZE + 1}:`, insErr.message);
          } else {
            inserted += batch.length;
          }
        }

        subjectTotalAdded += inserted;
        console.log(`✅ Year ${task.year} done: inserted ${inserted} unique papers.`);
      } catch (err) {
        console.error(`Error on task ${task.dir}:`, err.message);
      }
    }

    console.log(`\n🎉 Finished ${subject.name}! Total papers inserted: ${subjectTotalAdded}`);
  }

  console.log(`\n🏁 All scraping finished successfully!`);
}

run();

