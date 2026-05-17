'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './subject.module.css';

export default function SubjectDetailClient({ subject, papers }: { subject: any, papers: any[] }) {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedNegeri, setSelectedNegeri] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Extract unique values
  const years = ['All', ...Array.from(new Set(papers.map(p => p.year?.toString() || ''))).filter(Boolean)].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return parseInt(b) - parseInt(a);
  });
  
  const negeris = ['All', ...Array.from(new Set(papers.map(p => p.negeri || ''))).filter(Boolean)].sort();
  const types = ['All', ...Array.from(new Set(papers.map(p => p.paper_type || ''))).filter(Boolean)].sort();
  
  const filteredPapers = papers.filter(p => {
    const matchYear = selectedYear === 'All' || p.year?.toString() === selectedYear;
    const matchNegeri = selectedNegeri === 'All' || p.negeri === selectedNegeri;
    const matchType = selectedType === 'All' || p.paper_type === selectedType;
    return matchYear && matchNegeri && matchType;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedNegeri, selectedType]);

  const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);
  const paginatedPapers = filteredPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Back to subjects
        </Link>
      </div>

      <header className={styles.header}>
        <div className={styles.subjectIconLarge}>
          {subject.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.titleWrapper}>
          <h1>{subject.name}</h1>
          <span className={styles.codeBadge}>{subject.code}</span>
        </div>
      </header>

      <section className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tahun:</span>
          <div className={styles.yearTabs}>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`${styles.yearTab} ${selectedYear === year ? styles.yearTabActive : ''}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {negeris.length > 1 && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Negeri:</span>
            <div className={styles.yearTabs}>
              {negeris.map(neg => (
                <button
                  key={neg}
                  onClick={() => setSelectedNegeri(neg)}
                  className={`${styles.yearTab} ${selectedNegeri === neg ? styles.yearTabActive : ''}`}
                >
                  {neg}
                </button>
              ))}
            </div>
          </div>
        )}

        {types.length > 1 && (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Jenis:</span>
            <div className={styles.yearTabs}>
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`${styles.yearTab} ${selectedType === type ? styles.yearTabActive : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={styles.papersList}>
        {paginatedPapers.length > 0 ? (
          paginatedPapers.map((paper) => (
            <div key={paper.id} className={`card ${styles.paperRow}`}>
              <div className={styles.paperInfo}>
                <div className={styles.yearBadge}>{paper.year}</div>
                <div className={styles.paperDetails}>
                  <h2>{paper.title}</h2>
                  <div className={styles.tagWrapper}>
                    <span className={styles.typeTag}>{paper.negeri || 'General'}</span>
                    <span className={styles.typeTag}>{paper.paper_type || 'Past Paper'}</span>
                  </div>
                </div>
              </div>
              <div className={styles.actions}>
                <a href={paper.publicUrl} target="_blank" rel="noopener noreferrer" className={styles.btnView}>
                  View
                </a>
                <a href={`${paper.publicUrl}?download=`} className={styles.btnDownload}>
                  Download
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            No papers available for this year yet.
          </div>
        )}

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
      </section>
    </>
  );
}
