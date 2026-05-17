import { login } from './actions'
import styles from './login.module.css'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const resolvedParams = await searchParams;
  
  return (
    <main className="container">
      <div className={styles.loginWrapper}>
        <div className={`card ${styles.loginCard}`}>
          <h2>Admin Login</h2>
          <p className={styles.subtitle}>Sign in to upload papers</p>
          
          {resolvedParams?.error && (
            <div className={styles.errorMessage}>{resolvedParams.error}</div>
          )}
          
          <form className={styles.form} action={login}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className={styles.input} placeholder="admin@example.com" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className={styles.input} />
            </div>
            <button type="submit" className={styles.submitBtn}>Log In</button>
          </form>
        </div>
      </div>
    </main>
  )
}
