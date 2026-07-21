export default function StoreScopeLoading() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.16)',
          background: 'rgba(15, 23, 42, 0.72)',
          padding: 24,
          boxShadow: '0 18px 48px rgba(15, 23, 42, 0.32)',
        }}
      >
        <div
          style={{
            width: 140,
            height: 20,
            borderRadius: 999,
            background: 'rgba(148, 163, 184, 0.16)',
            marginBottom: 16,
          }}
        />
        <div
          style={{
            width: '100%',
            height: 12,
            borderRadius: 999,
            background: 'rgba(148, 163, 184, 0.12)',
            marginBottom: 10,
          }}
        />
        <div
          style={{
            width: '72%',
            height: 12,
            borderRadius: 999,
            background: 'rgba(148, 163, 184, 0.12)',
            marginBottom: 24,
          }}
        />
        <div
          style={{
            width: '100%',
            height: 180,
            borderRadius: 12,
            background: 'rgba(30, 41, 59, 0.88)',
          }}
        />
      </div>
    </main>
  );
}
