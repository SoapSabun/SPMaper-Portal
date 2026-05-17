import { getSubjects } from '@/lib/api';
import SubjectGrid from './SubjectGrid';
import styles from './page.module.css';
import Image from 'next/image';

export default async function Home() {
  const subjects = await getSubjects();

  return (
    <main className="container">
      <header className={styles.header}>
        <div className={styles.logoTitleWrapper}>
          <Image src="/logo.png" alt="Batch Logo" width={120} height={120} className={styles.logo} priority />
          <h1>SPMaper</h1>
        </div>
        <p>SPM past papers, all in one place.</p>
      </header>

      <SubjectGrid subjects={subjects} />
    </main>
  );
}
