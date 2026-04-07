'use client'
import { useSession, signIn } from 'next-auth/react'
import Dashboard from './components/Dashboard'
import styles from './page.module.css'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading Mission Control...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.login}>
        <div className={styles.loginCard}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>MC</div>
          </div>
          <h1 className={styles.title}>Mission Control</h1>
          <p className={styles.subtitle}>The Art of Broth — B2B Command Center</p>
          <button className={styles.signInBtn} onClick={() => signIn('google')}>
            Sign in with Google
          </button>
          <p className={styles.hint}>
            Connect your Gmail to manage pipeline and approve outreach
          </p>
        </div>
      </div>
    )
  }

  return <Dashboard />
}
