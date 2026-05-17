'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Subject } from '@/lib/api';
import styles from './page.module.css';

export default function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  const [searchQuery, setSearchQuery] = useState('');

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
        <input 
          type="text" 
          placeholder="Search for a subject by name or code..." 
          className={styles.input}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.grid}>
        {filteredSubjects.map((subject) => (
          <Link key={subject.id} href={`/subjects/${subject.id}`} className="card">
            <div className={styles.subjectCard}>
              <div className={styles.subjectIcon}>
                {subject.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{subject.name}</h2>
                {subject.code && <span className={styles.codeBadge}>{subject.code}</span>}
              </div>
            </div>
          </Link>
        ))}
        
        {filteredSubjects.length === 0 && (
          <div className={styles.emptyState}>
            {subjects.length === 0 
              ? "No subjects found. Add some in the admin panel." 
              : "No subjects match your search."}
          </div>
        )}
      </div>
    </section>
  );
}
