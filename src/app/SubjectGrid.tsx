'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Subject } from '@/lib/api';
import styles from './page.module.css';

export default function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSubjectId, setLoadingSubjectId] = useState<string | null>(null);

  const filteredSubjects = subjects.filter((subject) => {
    const query = searchQuery.toLowerCase();
    return (
      subject.name.toLowerCase().includes(query) ||
      (subject.code && subject.code.toLowerCase().includes(query))
    );
  });

  return (
    <section className={styles.subjectsSection}>
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input 
          type="text" 
          placeholder="Cari subjek mengikut nama atau kod..." 
          className={styles.input}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={styles.clearSearchBtn}
            aria-label="Padam carian"
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {filteredSubjects.map((subject) => {
          const isLoading = loadingSubjectId === subject.id;
          return (
            <Link 
              key={subject.id} 
              href={`/subjects/${subject.id}`} 
              className={`card ${styles.cardLink} ${isLoading ? styles.cardLoading : ''}`}
              onClick={() => setLoadingSubjectId(subject.id)}
            >
              <div className={styles.subjectCard}>
                <div className={`${styles.subjectIcon} ${isLoading ? styles.subjectIconLoading : ''}`}>
                  {isLoading ? (
                    <svg className="spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                  ) : (
                    subject.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className={styles.subjectTextWrapper}>
                  <h2>{subject.name}</h2>
                  <div className={styles.metaRow}>
                    {subject.code && <span className={styles.codeBadge}>{subject.code}</span>}
                    {isLoading && (
                      <span className={styles.loadingTag}>
                        <span className={styles.loadingDot} /> Memuatkan...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        
        {filteredSubjects.length === 0 && (
          <div className={styles.emptyState}>
            {subjects.length === 0 
              ? "Tiada subjek dijumpai. Tambah di panel admin." 
              : "Tiada subjek yang sepadan dengan carian anda."}
          </div>
        )}
      </div>
    </section>
  );
}
