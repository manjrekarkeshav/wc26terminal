import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { getWinProb, isResolvedMatchup } from '../../lib/winprob';

/**
 * Compact win-probability bar for an Upcoming row: home vs away (draw folded out),
 * showing BOTH nations. Source tag only shown when it's a real market (PM/DK).
 * Hidden entirely for unresolved bracket fixtures (e.g. "Round of 32 3 Winner").
 */
export function UpcomingWinProb({ match, pm }: { match: Match; pm: WinProbMap | null }) {
  if (!isResolvedMatchup(match)) return <span className="up-wp" />;

  const wp = getWinProb(match, pm);
  const denom = wp.home + wp.away || 1;
  const homePct = Math.round((wp.home / denom) * 100);
  const awayPct = 100 - homePct;

  return (
    <span className="up-wp">
      {/* team 2 (away) sits to the LEFT of the bar, team 1 (home) to the RIGHT */}
      <span className="wl away">{match.awayTeam.abbreviation} {awayPct}%</span>
      <span className="up-bar">
        <i className="away" style={{ width: `${awayPct}%` }} />
        <i className="home" style={{ width: `${homePct}%` }} />
      </span>
      <span className="wl home">{match.homeTeam.abbreviation} {homePct}%</span>
      {wp.source !== 'MODEL' && <span className="src">{wp.source}</span>}
    </span>
  );
}

/**
 * Full win-probability bar for a live card: home / draw / away with both labels.
 */
export function LiveWinProb({ match, pm }: { match: Match; pm: WinProbMap | null }) {
  if (!isResolvedMatchup(match)) return null;

  const wp = getWinProb(match, pm);
  return (
    <div className="wp">
      <div className="bar">
        <i className="home" style={{ width: `${wp.home}%` }} />
        <i style={{ width: `${wp.draw}%`, background: 'var(--draw)' }} />
        <i className="away" style={{ width: `${wp.away}%` }} />
      </div>
      <div className="lab">
        <span className="home">{match.homeTeam.abbreviation} {wp.home}%</span>
        <span>
          <span className="away">{match.awayTeam.abbreviation} {wp.away}%</span>
          {wp.source !== 'MODEL' && <span className="pm">{wp.source}</span>}
        </span>
      </div>
    </div>
  );
}
