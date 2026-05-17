import { getSubjects } from '@/lib/api';
import AdminForm from './AdminForm';
import AdminPaperList from './AdminPaperList';
import styles from './admin.module.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signout } from '../login/actions';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const subjects = await getSubjects();

  const { data: papers } = await supabase
    .from('papers')
    .select('id, title, year, file_path, subjects(name)')
    .order('created_at', { ascending: false });

  return (
    <main className="container">
      <div className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Back to Homepage
        </Link>
        <form action={signout} style={{marginLeft: 'auto'}}>
          <button type="submit" className={styles.signOutBtn}>Sign Out</button>
        </form>
      </div>

      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Logged in as {user.email}. Upload new past papers to the catalogue.</p>
      </header>

      <section className={styles.formSection}>
        <AdminForm subjects={subjects} />
      </section>

      <section className={styles.listSection}>
        <AdminPaperList papers={papers || []} />
      </section>
    </main>
  );
}
