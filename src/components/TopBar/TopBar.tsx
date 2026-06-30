import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const SECTIONS = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Recent Results' },
  { id: 'scorers', label: 'Golden Boot' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'groups', label: 'Groups' },
];

export function TopBar({ isLive, lastUpdated }: { isLive: boolean; lastUpdated: number | null }) {
  const { theme, setTheme } = useTheme();
  const [activeId, setActiveId] = useState('live');

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY + 140;
      let idx = 0;
      SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= y) idx = i;
      });
      setActiveId(SECTIONS[idx].id);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const updatedAgo = lastUpdated
    ? Math.round((Date.now() - lastUpdated) / 1000)
    : null;

  return (
    <header className="topbar">
      <div className="brand">
        WC26<span className="bar">▮</span>TERMINAL
      </div>
      <nav className="nav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={activeId === s.id ? 'active' : ''}
          >
            {s.label}
          </a>
        ))}
      </nav>
      <div className="status">
        {isLive && (
          <span className="livecount">
            <span className="dot" aria-hidden="true" style={{ background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <b style={{ color: 'var(--green)' }}>LIVE</b>
          </span>
        )}
        {updatedAgo !== null && (
          <span className="upd">upd {updatedAgo}s ago</span>
        )}
        <span className="theme-ctrl">
          🎨
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            aria-label="Theme"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </span>
      </div>
    </header>
  );
}
