import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useViewMode } from '../../context/ViewModeContext';
import { Tooltip } from '../Tooltip/Tooltip';

const LIVE_SECTIONS = [
  { id: 'live', label: 'Live' },
  { id: 'title-odds', label: 'Title Odds' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Recent Results' },
  { id: 'scorers', label: 'Golden Boot' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'groups', label: 'Groups' },
];

const ARCHIVE_SECTIONS = [
  { id: 'champion', label: 'Champion' },
  { id: 'podium', label: 'Standings' },
  { id: 'recap', label: 'Recap' },
  { id: 'results', label: 'Results' },
  { id: 'scorers', label: 'Golden Boot' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'groups', label: 'Groups' },
];

export function TopBar({
  isLive,
  archive = false,
  canToggle = false,
}: {
  isLive: boolean;
  archive?: boolean;
  canToggle?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const { mode, setMode } = useViewMode();
  const sections = useMemo(() => (archive ? ARCHIVE_SECTIONS : LIVE_SECTIONS), [archive]);

  const [activeId, setActiveId] = useState(sections[0].id);
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
      sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= y) best = Math.max(best, el.offsetTop);
      });
      // Sections sharing that band (e.g. Champion + Standings sit side by side at the top).
      const tied = sections.filter((s) => {
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
  }, [sections]);

  // Switching modes swaps the section list — re-anchor so no stale link stays active.
  useEffect(() => {
    if (!sections.some((s) => s.id === activeRef.current)) select(sections[0].id);
  }, [sections]);

  return (
    <header className="topbar">
      <div className="brand">
        WC26<span className="bar">▮</span>TERMINAL
      </div>
      <nav className="nav" aria-label="Sections">
        {sections.map((s) => (
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
        {canToggle && (
          <Tooltip
            align="right"
            className="tip-mode"
            lines={[
              <><b>Summary</b> — how WC26 finished: champion, final standings and recap.</>,
              <><b>Match day</b> — the dashboard exactly as it looked while WC26 was on.</>,
            ]}
          >
            <button
              type="button"
              className={`sc-toggle mode-toggle${mode === 'archive' ? ' on' : ''}`}
              onClick={() => setMode(mode === 'archive' ? 'live' : 'archive')}
              role="switch"
              aria-checked={mode === 'archive'}
              aria-label={mode === 'archive' ? 'Summary view' : 'Match day view'}
            >
              <span className="sc-toggle-label">
                {mode === 'archive' ? 'Summary' : 'Match day'}
              </span>
              <span className="sc-switch" aria-hidden="true"><span className="knob" /></span>
            </button>
          </Tooltip>
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
