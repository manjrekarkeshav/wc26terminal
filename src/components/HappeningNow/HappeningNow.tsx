import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { LiveMatchCard } from './LiveMatchCard';
import { Countdown } from '../Upcoming/Countdown';

const SOON_WINDOW_MS = 30 * 60 * 1000; // show fixtures starting within 30 minutes

export function HappeningNow({ matches, pm }: { matches: Match[]; pm: WinProbMap | null }) {
  const now = Date.now();
  const liveMatches = matches
    .filter((m) => {
      if (m.status === 'in') return true;
      // Delayed fixtures surface here regardless of their (stale) scheduled time
      if (m.delayed && m.status !== 'post') return true;
      // Pre-match starting within the next 30 minutes
      if (m.status === 'pre') {
        const diff = new Date(m.kickoffUtc).getTime() - now;
        return diff > 0 && diff <= SOON_WINDOW_MS;
      }
      return false;
    })
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime());

  // Next upcoming fixture (for the empty-state countdown)
  const nextMatch = matches
    .filter((m) => m.status === 'pre' && new Date(m.kickoffUtc).getTime() > now)
    .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime())[0];

  return (
    <>
      <div className="section-head" id="live">
        <span className="pulse-dot" aria-hidden="true" />
        <h2>Happening now</h2>
        <span className="sub">live · auto-refresh 10s</span>
      </div>

      {liveMatches.length > 0 ? (
        <div className="live-grid">
          {liveMatches.map((m) => (
            <LiveMatchCard key={m.id} match={m} pm={pm} />
          ))}
        </div>
      ) : (
        <div className="stack">
          <div className="empty-card">
            {nextMatch ? (
              <>
                ⚽ No matches are live right now — next kickoff in{' '}
                <b>
                  <Countdown kickoffUtc={nextMatch.kickoffUtc} />
                </b>{' '}
                ({nextMatch.homeTeam.name} v {nextMatch.awayTeam.name})
              </>
            ) : (
              <>⚽ No matches are live right now.</>
            )}
          </div>
        </div>
      )}
    </>
  );
}
