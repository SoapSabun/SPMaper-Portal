import styles from './subject.module.css';

export default function SubjectLoading() {
  return (
    <main className="container">
      {/* 1. Back link skeleton */}
      <div className={styles.navigation}>
        <div className="skeleton" style={{ width: '180px', height: '22px' }} />
      </div>

      {/* 2. Header skeleton */}
      <header className={styles.header}>
        <div
          className="skeleton"
          style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
          <div className="skeleton" style={{ width: '75%', height: '32px' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '999px' }} />
            <div className="skeleton" style={{ width: '90px', height: '20px', borderRadius: '999px' }} />
          </div>
        </div>
      </header>

      {/* 3. Filter Bar skeleton */}
      <section className={styles.filterBar}>
        <div className={styles.searchRow}>
          <div className="skeleton" style={{ flex: 1, height: '42px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '170px', height: '42px', borderRadius: 'var(--radius-md)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          <div className="skeleton" style={{ width: '50px', height: '16px' }} />
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: '68px', height: '30px', borderRadius: '999px', flexShrink: 0 }}
            />
          ))}
        </div>

        <div className={styles.subFilterRow}>
          <div className="skeleton" style={{ width: '220px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '180px', height: '20px' }} />
        </div>
      </section>

      {/* 4. Pack Cards skeleton */}
      <section className={styles.packsGrid}>
        {[1, 2, 3, 4].map((n) => (
          <article key={n} className={styles.packCard} style={{ opacity: 0.9 }}>
            <header className={styles.packHeader}>
              <div className={styles.packHeaderLeft}>
                <div
                  className="skeleton"
                  style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div className="skeleton" style={{ width: '110px', height: '20px' }} />
                  <div className="skeleton" style={{ width: '150px', height: '14px' }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: '50px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
            </header>

            <div className={styles.packBody}>
              <div className={styles.slotBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <div className="skeleton" style={{ width: '70px', height: '16px' }} />
                  <div className="skeleton" style={{ width: '90px', height: '12px' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '72px', height: '34px', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton" style={{ width: '72px', height: '34px', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>

              <div className={styles.slotBox}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                  <div className="skeleton" style={{ width: '70px', height: '16px' }} />
                  <div className="skeleton" style={{ width: '90px', height: '12px' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="skeleton" style={{ width: '72px', height: '34px', borderRadius: 'var(--radius-sm)' }} />
                  <div className="skeleton" style={{ width: '72px', height: '34px', borderRadius: 'var(--radius-sm)' }} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

