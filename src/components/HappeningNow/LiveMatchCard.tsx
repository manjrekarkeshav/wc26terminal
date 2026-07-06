import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { ScorerLine } from './ScorerLine';
import { LiveWinProb } from '../WinProbBar/WinProbBar';
import { MatchStats } from '../MatchStats/MatchStats';

function startsIn(kickoffUtc: string): string {
  const diff = new Date(kickoffUtc).getTime() - Date.now();
  const mins = Math.max(0, Math.ceil(diff / 60_000));
  return mins <= 0 ? 'KICKOFF' : `KICKOFF ${mins}m`;
}

export function LiveMatchCard({ match, pm }: { match: Match; pm: WinProbMap | null }) {
  const groupLabel = match.group ?? match.round ?? '';
  const venue = match.venue ?? '';
  const contextLabel = [groupLabel, venue].filter(Boolean).join(' · ');

  const isSoon = match.status === 'pre';
  const homeWinning = !isSoon && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWinning = !isSoon && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <article className="panel panel-live live-card">
      <div className="lc-head">
        <span className="grp">{contextLabel}</span>
        <span className={`min${isSoon ? ' soon' : ''}`}>
          {match.delayed && <span className="delayed-tag">Delayed</span>}
          {!match.delayed && <span className="live-dot" aria-hidden="true" />}
          {isSoon || match.delayed ? startsIn(match.kickoffUtc) : match.clock}
        </span>
      </div>
      <div className="lc-row">
        <span className="lc-name">
          <span className="fl">{match.homeTeam.flag}</span>
          {match.homeTeam.name}
        </span>
        <span className={`lc-sc${homeWinning ? ' glow' : ''}`}>
          {isSoon ? '–' : match.homeScore ?? 0}
        </span>
      </div>
      <div className="lc-row">
        <span className="lc-name">
          <span className="fl">{match.awayTeam.flag}</span>
          {match.awayTeam.name}
        </span>
        <span className={`lc-sc${awayWinning ? ' glow' : ''}`}>
          {isSoon ? '–' : match.awayScore ?? 0}
        </span>
      </div>
      <LiveWinProb match={match} pm={pm} />
      <ScorerLine goals={match.goals} />
      {match.homeStats && match.awayStats && (
        <MatchStats
          home={match.homeStats}
          away={match.awayStats}
          homeAbbr={match.homeTeam.abbreviation}
          awayAbbr={match.awayTeam.abbreviation}
        />
      )}
    </article>
  );
}
