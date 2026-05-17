import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPapersBySubject } from '@/lib/api';
import styles from './subject.module.css';
import { supabase } from '@/lib/supabase/client';
import SubjectDetailClient from './SubjectDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { data } = await supabase.from('subjects').select('*').eq('id', resolvedParams.id).single();
  return {
    title: data ? `${data.name} Papers - Catalogue` : 'Subject Not Found',
  };
}

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { data: subject } = await supabase.from('subjects').select('*').eq('id', resolvedParams.id).single();
  
  if (!subject) {
    notFound();
  }

  const papers = await getPapersBySubject(resolvedParams.id);
  
  const papersWithUrl = papers.map(paper => ({
    ...paper,
    publicUrl: supabase.storage.from('exam-papers').getPublicUrl(paper.file_path).data.publicUrl
  }));

  return (
    <main className="container">
      <SubjectDetailClient subject={subject} papers={papersWithUrl} />
    </main>
  );
}
