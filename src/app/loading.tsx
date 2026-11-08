export default function RootLoading() {
  return (
    <main className="container" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div
          className="skeleton"
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
      </div>
      <div
        className="skeleton"
        style={{ width: '220px', height: '40px', margin: '0 auto 1rem' }}
      />
      <div
        className="skeleton"
        style={{ width: '280px', height: '20px', margin: '0 auto 2.5rem' }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '1rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: '84px', borderRadius: 'var(--radius-lg)' }}
          />
        ))}
      </div>
    </main>
  );
}

