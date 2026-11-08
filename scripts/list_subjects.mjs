import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

async function listSubjects() {
  const { data, error } = await supabase.from('subjects').select('id, name');
  if (error) {
    console.error('Error fetching subjects:', error);
    process.exit(1);
  }
  console.log('Subjects:', data);
}

listSubjects();

