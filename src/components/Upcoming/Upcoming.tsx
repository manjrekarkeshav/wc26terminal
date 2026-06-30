import { useState } from 'react';
import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { useFilter } from '../../context/FilterContext';
import { FixtureRow } from './FixtureRow';

function matchesFilter(match: Match, team: string, location: string): boolean {
  if (team && match.homeTeam.name !== team && match.awayTeam.name !== team) return false;
  if (location && match.venue !== location) return false;
  return true;
}

/** Group label for a kickoff date: "Today", "Tomorrow", or "Tuesday, Jun 30". */
function dayHeading(utc: string): string {
  const d = new Date(utc);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

const INITIAL_LIMIT = 8;

export function Upcoming({ matches, pm }: { matches: Match[]; pm: WinProbMap | null }) {
  const { team, location } = useFilter();
  const [showAll, setShowAll] = useState(false);

  const upcoming = matches
    .filter((m) => m.status === 'pre')
    .filter((m) => matchesFilter(m, team, location))
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime());

  const totalUpcoming = matches.filter((m) => m.status === 'pre').length;
  const visible = showAll ? upcoming : upcoming.slice(0, INITIAL_LIMIT);

  // Group visible fixtures by day, preserving chronological order.
  const groups: { heading: string; rows: Match[] }[] = [];
  for (const m of visible) {
    const heading = dayHeading(m.kickoffUtc);
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.rows.push(m);
    else groups.push({ heading, rows: [m] });
  }

  return (
    <>
      <div className="section-head" id="upcoming">
        <h2>Upcoming</h2>
        <button className="matchcount" type="button">
          {upcoming.length} {upcoming.length === 1 ? 'match' : 'matches'} remaining
        </button>
      </div>
      <div className="stack">
        <div className="panel">
          {upcoming.length > 0 ? (
            groups.map((g) => (
              <div key={g.heading}>
                <div className="day-head">{g.heading}</div>
                {g.rows.map((m) => (
                  <FixtureRow key={m.id} match={m} pm={pm} />
                ))}
              </div>
            ))
          ) : (
            <div className="up-empty">
              {team || location ? 'No matches for this filter.' : 'No upcoming matches.'}
            </div>
          )}
        </div>
        {upcoming.length > INITIAL_LIMIT && (
          <button className="show-all" type="button" onClick={() => setShowAll((v) => !v)}>
            {showAll
              ? 'Show fewer'
              : `Show all ${totalUpcoming} upcoming matches`}
          </button>
        )}
      </div>
    </>
  );
}
