import type { Match } from '../../lib/types';
import { useFilter } from '../../context/FilterContext';

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function FilterBar({ matches }: { matches: Match[] }) {
  const { team, location, setTeam, setLocation, clear } = useFilter();

  const teams = unique(
    matches.flatMap((m) => [m.homeTeam.name, m.awayTeam.name])
  ).sort();

  const locations = unique(
    matches.map((m) => m.venue).filter(Boolean)
  ).sort();

  return (
    <div className="stack">
      <div className="filterbar">
        <label className="fbar-sel">
          Team
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            aria-label="Filter by team"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="fbar-sel">
          Location
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Filter by location"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <button className="fbar-clear" type="button" onClick={clear}>
          Clear filter ✕
        </button>
      </div>
    </div>
  );
}
