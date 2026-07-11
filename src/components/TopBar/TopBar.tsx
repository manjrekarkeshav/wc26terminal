import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const SECTIONS = [
  { id: 'live', label: 'Live' },
  { id: 'title-odds', label: 'Title Odds' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Recent Results' },
  { id: 'scorers', label: 'Golden Boot' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'groups', label: 'Groups' },
];

export function TopBar({ isLive }: { isLive: boolean }) {
  const { theme, setTheme } = useTheme();
  const [activeId, setActiveId] = useState('live');
  // Mirror of activeId readable synchronously inside the scroll handler.
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  const select = (id: string) => {
    activeRef.current = id;
    setActiveId(id);
  };

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY + 140;
      // The winning band is the greatest offsetTop still above the fold line.
      let best = -Infinity;
      SECTIONS.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= y) best = Math.max(best, el.offsetTop);
      });
      // Sections sharing that band (e.g. Live + Title Odds sit side by side at the top).
      const tied = SECTIONS.filter((s) => {
        const el = document.getElementById(s.id);
        return el && el.offsetTop === best;
      });
      if (tied.length === 0) return;
      // Keep the user's current pick if it's in the band; otherwise take the earliest.
      const keep = tied.find((s) => s.id === activeRef.current) ?? tied[0];
      setActiveId(keep.id);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
            onClick={() => select(s.id)}
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
        <span className="theme-ctrl">
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
