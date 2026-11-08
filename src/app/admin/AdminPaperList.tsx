'use client';

import { createClient } from '@/lib/supabase/browser';
import { getPublicUrlForPaper } from '@/lib/api';
import { useState } from 'react';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';

export type AdminPaper = {
  id: string;
  title: string;
  year: number;
  file_path: string;
  negeri?: string;
  paper_type?: string;
  subjects: {
    name: string;
  } | {
    name: string;
  }[] | null;
};

export default function AdminPaperList({ papers }: { papers: AdminPaper[] }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    
    setIsDeleting(id);
    const supabase = createClient();
    
    // 1. Delete from storage only if it's an internal file
    if (!filePath.startsWith('http://') && !filePath.startsWith('https://')) {
      const { error: storageError } = await supabase.storage.from('exam-papers').remove([filePath]);
      if (storageError) {
        console.warn(`Storage delete notice: ${storageError.message}`);
      }
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase.from('papers').delete().eq('id', id);
    if (dbError) {
      alert(`Error deleting record: ${dbError.message}`);
    } else {
      router.refresh(); // Refresh the page to get updated list
    }
    
    setIsDeleting(null);
  };

  if (!papers || papers.length === 0) return null;

  const totalPages = Math.ceil(papers.length / itemsPerPage);
  const paginatedPapers = papers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.paperListContainer}>
      <h2>Uploaded Papers</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Year</th>
              <th>Negeri</th>
              <th>Jenis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPapers.map((paper) => (
              <tr key={paper.id}>
                <td>
                  <a 
                    href={getPublicUrlForPaper(paper.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', color: 'var(--brand-primary)', fontWeight: 600 }}
                  >
                    {paper.title}
                  </a>
                  {paper.file_path.startsWith('http') && (
                    <span className={styles.linkBadge}>
                      {paper.file_path.includes('drive.google.com') ? 'Google Drive' : 'External Link'}
                    </span>
                  )}
                </td>
                <td>{Array.isArray(paper.subjects) ? paper.subjects[0]?.name : paper.subjects?.name || 'Unknown'}</td>
                <td>{paper.year}</td>
                <td>{paper.negeri || '-'}</td>
                <td>{paper.paper_type || '-'}</td>
                <td>
                  <button 
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(paper.id, paper.file_path)}
                    disabled={isDeleting === paper.id}
                  >
                    {isDeleting === paper.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
