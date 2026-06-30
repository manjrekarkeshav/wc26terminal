export function StaleBanner() {
  return (
    <div
      style={{
        background: 'rgba(229,84,75,0.12)',
        border: '1px solid var(--elim)',
        borderRadius: '4px',
        color: 'var(--elim)',
        fontSize: '.76rem',
        letterSpacing: '.08em',
        padding: '.55rem 1rem',
        margin: '0 1rem .5rem',
        textAlign: 'center',
      }}
    >
      ⚠ Live updates paused — showing bundled schedule. Will retry automatically.
    </div>
  );
}
