import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, serviceKey);

async function main(){
  const { data: subjects, error: err } = await supabase.from('subjects').select('id').limit(1);
  if (err) { console.error('fetch subjects err', err); return; }
  const subjectId = subjects[0].id;
  const { data: papers, error } = await supabase.from('papers').select('*').eq('subject_id', subjectId);
  if (error) { console.error('fetch papers err', error); return; }
  console.log('Papers count:', papers.length);
  console.log(papers.map(p=>({title:p.title, url:p.file_path})));
}
main();

