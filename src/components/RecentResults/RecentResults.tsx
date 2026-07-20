import { useState } from 'react';
import type { Match } from '../../lib/types';
import { useFilter } from '../../context/FilterContext';
import { ResultRow } from './ResultRow';

function matchesFilter(match: Match, team: string, location: string): boolean {
  if (team && match.homeTeam.name !== team && match.awayTeam.name !== team) return false;
  if (location && match.venue !== location) return false;
  return true;
}

const INITIAL_LIMIT = 6;

export function RecentResults({ matches, archive = false }: { matches: Match[]; archive?: boolean }) {
  const { team, location } = useFilter();
  const [showAll, setShowAll] = useState(false);

  const results = matches
    .filter((m) => m.status === 'post')
    .filter((m) => matchesFilter(m, team, location))
    .sort((a, b) => new Date(b.kickoffUtc).getTime() - new Date(a.kickoffUtc).getTime());

  const visible = showAll ? results : results.slice(0, INITIAL_LIMIT);

  return (
    <>
      <div className="section-head" id="results">
        <h2>{archive ? 'Results' : 'Recent results'}</h2>
        <span className="sub">
          {archive ? `all ${results.length} matches · final` : 'final'}
        </span>
      </div>
      <div className="stack">
        <div className="results-grid">
          {visible.length > 0 ? (
            visible.map((m) => <ResultRow key={m.id} match={m} />)
          ) : (
            <div className="res-empty">
              {team || location ? 'No results for this filter.' : 'No results yet.'}
            </div>
          )}
        </div>
        {results.length > INITIAL_LIMIT && (
          <button className="show-all" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show fewer' : `Show all ${results.length} results`}
          </button>
        )}
      </div>
    </>
  );
}
