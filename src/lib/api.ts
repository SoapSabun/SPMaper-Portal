import { supabase } from './supabase/client'

export type Subject = {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export type Paper = {
  id: string;
  subject_id: string;
  title: string;
  year: number;
  file_path: string;
  created_at: string;
}

export async function getSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
  return data as Subject[];
}

export async function getPapersBySubject(subjectId: string) {
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('subject_id', subjectId)
    .order('year', { ascending: false });
  
  if (error) {
    console.error('Error fetching papers:', error);
    return [];
  }
  return data as Paper[];
}

export function getPublicUrlForPaper(filePath: string) {
  const { data } = supabase
    .storage
    .from('exam-papers')
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}
