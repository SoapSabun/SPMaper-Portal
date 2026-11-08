import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ADDMATHS_ID = '5385f218-f767-43ef-92de-da63d50708ec';

function scoreTitle(paper) {
  let score = 0;
  const title = paper.title || '';

  // 1. Prefer titles starting with 4-digit year (e.g. "2024 Kedah...")
  if (/^\d{4}\b/.test(title)) score += 30;

  // 2. Prefer clean casing over ALL CAPS (e.g. "Matematik Tambahan" > "MATEMATIK TAMBAHAN")
  const upperCount = (title.match(/[A-Z]/g) || []).length;
  const lowerCount = (title.match(/[a-z]/g) || []).length;
  if (lowerCount > upperCount) score += 20;

  // 3. Penalize messy prefixes like "SKEMA-" or "Trial K1 ... - ..."
  if (title.startsWith('SKEMA-') || title.startsWith('SKEMA_')) score -= 5;
  if (title.includes('Trial K1') || title.includes('Trial K2')) score -= 5;

  // 4. Prefer known premier states over generic "Percubaan"
  if (paper.negeri && paper.negeri !== 'Percubaan') score += 10;
  if (title.includes('SBP') && paper.negeri === 'SBP') score += 15;
  if (title.includes('MRSM') && paper.negeri === 'MRSM') score += 15;

  // 5. Prefer shorter, cleaner titles if other criteria equal
  score -= Math.min(title.length / 10, 5);

  return score;
}

async function deduplicate() {
  console.log(`Fetching all papers for Add Maths (ID: ${ADDMATHS_ID})...`);
  const { data: papers, error } = await supabase
    .from('papers')
    .select('*')
    .eq('subject_id', ADDMATHS_ID);

  if (error) {
    console.error('Error fetching papers:', error.message);
    return;
  }

  console.log(`Total papers in DB before deduplication: ${papers.length}`);

  // Fetch content-length for each paper with concurrency limit
  console.log(`Checking file sizes via HTTP HEAD requests...`);
  const CONCURRENCY = 15;
  const paperDetails = [];

  for (let i = 0; i < papers.length; i += CONCURRENCY) {
    const batch = papers.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (p) => {
      try {
        const res = await axios.head(p.file_path, { timeout: 12000 });
        const size = res.headers['content-length'];
        return { ...p, size: size ? parseInt(size, 10) : null };
      } catch (err) {
        return { ...p, size: null, fetchError: err.message };
      }
    });

    const results = await Promise.all(promises);
    paperDetails.push(...results);
    process.stdout.write(`  Processed ${paperDetails.length}/${papers.length} files...\r`);
  }
  console.log(`\nFinished fetching file sizes!`);

  // Group papers by Year + File Size
  const sizeGroups = new Map();
  const duplicateIdsToDelete = [];

  for (const paper of paperDetails) {
    if (!paper.size) continue; // Keep if size couldn't be determined

    const groupKey = `${paper.year}_${paper.size}`;
    if (!sizeGroups.has(groupKey)) {
      sizeGroups.set(groupKey, []);
    }
    sizeGroups.get(groupKey).push(paper);
  }

  // Also check exact title duplicates regardless of size (e.g. cross-folder copies)
  const titleGroups = new Map();
  for (const paper of paperDetails) {
    const titleKey = `${paper.year}_${paper.title.toLowerCase().trim()}`;
    if (!titleGroups.has(titleKey)) {
      titleGroups.set(titleKey, []);
    }
    titleGroups.get(titleKey).push(paper);
  }

  const alreadyMarked = new Set();

  // Process size-based duplicates (identical files uploaded under different names)
  for (const [key, group] of sizeGroups.entries()) {
    if (group.length > 1) {
      // Sort to find the best candidate to KEEP
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      const keep = group[0];
      const duplicates = group.slice(1);

      for (const dup of duplicates) {
        if (!alreadyMarked.has(dup.id)) {
          alreadyMarked.add(dup.id);
          duplicateIdsToDelete.push({
            id: dup.id,
            title: dup.title,
            keptTitle: keep.title,
            year: dup.year,
            size: dup.size
          });
        }
      }
    }
  }

  // Process exact title duplicates (same title in multiple folders)
  for (const [key, group] of titleGroups.entries()) {
    if (group.length > 1) {
      group.sort((a, b) => scoreTitle(b) - scoreTitle(a));
      const keep = group[0];
      const duplicates = group.slice(1);

      for (const dup of duplicates) {
        if (!alreadyMarked.has(dup.id)) {
          alreadyMarked.add(dup.id);
          duplicateIdsToDelete.push({
            id: dup.id,
            title: dup.title,
            keptTitle: keep.title,
            year: dup.year,
            size: dup.size || 'title-match'
          });
        }
      }
    }
  }

  console.log(`\nIdentified ${duplicateIdsToDelete.length} redundant duplicate papers to delete.`);
  console.log('Sample duplicates being removed:');
  duplicateIdsToDelete.slice(0, 15).forEach((d) => {
    console.log(`  ❌ [${d.year}] "${d.title}" -> Kept: "${d.keptTitle}"`);
  });

  // Delete from Supabase in batches of 50
  if (duplicateIdsToDelete.length > 0) {
    console.log(`\nDeleting ${duplicateIdsToDelete.length} duplicate rows from Supabase...`);
    const ids = duplicateIdsToDelete.map(d => d.id);
    const BATCH_SIZE = 50;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const slice = ids.slice(i, i + BATCH_SIZE);
      const { error: delErr } = await supabase.from('papers').delete().in('id', slice);
      if (delErr) {
        console.error(`Error deleting batch ${i / BATCH_SIZE + 1}:`, delErr.message);
      } else {
        console.log(`  🗑️ Deleted batch ${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length}`);
      }
    }
  }

  // Final verification
  const { data: finalPapers } = await supabase
    .from('papers')
    .select('id, year, negeri')
    .eq('subject_id', ADDMATHS_ID);

  console.log(`\n==========================================`);
  console.log(`🎉 Deduplication Complete!`);
  console.log(`Initial paper count: ${papers.length}`);
  console.log(`Duplicates deleted: ${duplicateIdsToDelete.length}`);
  console.log(`Remaining clean unique papers: ${finalPapers?.length || 0}`);

  const byYear = {};
  for (const p of finalPapers || []) {
    byYear[p.year] = (byYear[p.year] || 0) + 1;
  }
  console.log('Final Breakdown by Year:', byYear);
}

deduplicate().catch(console.error);

