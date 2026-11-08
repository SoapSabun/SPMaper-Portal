import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

// Use service role client to bypass RLS
const supabase = createClient(supabaseUrl, serviceKey);

async function ensureSubject() {
  const { data: existing, error } = await supabase.from('subjects').select('id').limit(1);
  if (error) {
    console.error('Error fetching subjects:', error);
    process.exit(1);
  }
  if (existing && existing.length > 0) {
    return existing[0].id;
  }
  const { data: newSubj, error: insertErr } = await supabase
    .from('subjects')
    .insert({ name: 'Sample Subject', code: 'SS', created_at: new Date().toISOString() })
    .single();
  if (insertErr) {
    console.error('Error creating subject:', insertErr);
    process.exit(1);
  }
  console.log('Created new subject', newSubj.id);
  return newSubj.id;
}

async function main() {
  const subjectId = await ensureSubject();

  const samplePapers = [
    {
      subject_id: subjectId,
      title: 'Sample Paper 2023 K1',
      year: 2023,
      file_path: 'https://drive.google.com/file/d/1samplepdf/view?usp=sharing',
      created_at: new Date().toISOString(),
      negeri: 'K1',
      paper_type: 'Soalan',
    },
    {
      subject_id: subjectId,
      title: 'Sample Paper 2023 K1 Skema',
      year: 2023,
      file_path: 'https://drive.google.com/file/d/2samplepdf/view?usp=sharing',
      created_at: new Date().toISOString(),
      negeri: 'K1',
      paper_type: 'Skema',
    },
    {
      subject_id: subjectId,
      title: 'Local PDF Example',
      year: 2022,
      file_path: 'local-pdfs/sample2022.pdf',
      created_at: new Date().toISOString(),
      negeri: 'K2',
      paper_type: 'Soalan',
    },
    {
      subject_id: subjectId,
      title: 'Local PDF Example Skema',
      year: 2022,
      file_path: 'local-pdfs/sample2022_skema.pdf',
      created_at: new Date().toISOString(),
      negeri: 'K2',
      paper_type: 'Skema',
    },
  ];

  const { data, error } = await supabase.from('papers').insert(samplePapers).select();
  if (error) {
    console.error('Error inserting papers:', error);
    process.exit(1);
  }
  if (data) {
    console.log('Inserted', data.length, 'sample papers');
  } else {
    console.log('Inserted papers (no return data)');
  }
  // Verify insertion
  const { data: fetched, error: fetchErr } = await supabase.from('papers').select('*').eq('subject_id', subjectId);
  if (fetchErr) {
    console.error('Error fetching after insert:', fetchErr);
  } else {
    console.log('Fetched papers count after insert:', fetched.length);
  }
}

main();
