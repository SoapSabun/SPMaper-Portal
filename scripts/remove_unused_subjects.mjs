import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function removeUnusedSubjects() {
  const codesToRemove = ['EE', 'MEKI', 'LK'];
  
  for (const code of codesToRemove) {
    // Check if any papers exist first to be 100% safe
    const { data: subject } = await supabase.from('subjects').select('id, name, code').eq('code', code).single();
    if (!subject) {
      console.log(`Subject code ${code} not found in DB.`);
      continue;
    }

    const { count } = await supabase.from('papers').select('*', { count: 'exact', head: true }).eq('subject_id', subject.id);
    console.log(`Subject "${subject.name}" (${subject.code}) has ${count} papers.`);

    if (count === 0) {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) {
        console.error(`Error deleting ${subject.name}:`, error.message);
      } else {
        console.log(`✅ Successfully removed "${subject.name}" (${subject.code}) from database.`);
      }
    } else {
      console.warn(`⚠️ Skipped deleting ${subject.name} because it has ${count} papers!`);
    }
  }
}

removeUnusedSubjects();

