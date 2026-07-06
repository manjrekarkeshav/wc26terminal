import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { LiveMatchCard } from './LiveMatchCard';
import { Countdown } from '../Upcoming/Countdown';
import { isHappeningNow } from '../../lib/live';

export function HappeningNow({ matches, pm }: { matches: Match[]; pm: WinProbMap | null }) {
  const now = Date.now();
  const liveMatches = matches
    .filter((m) => isHappeningNow(m, now))
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
                (<span className="fl">{nextMatch.homeTeam.flag}</span> {nextMatch.homeTeam.name} v{' '}
                <span className="fl">{nextMatch.awayTeam.flag}</span> {nextMatch.awayTeam.name})
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
