import type { Match } from '../../lib/types';
import type { WinProbMap } from '../../lib/winprob';
import { rankFor } from '../../lib/rankings';
import { ROUND_CLASS, ROUND_SHORT } from '../../lib/roundColors';
import { UpcomingWinProb } from '../WinProbBar/WinProbBar';
import { Countdown } from './Countdown';

function localTime(utc: string): string {
  return new Date(utc).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function FixtureRow({ match, pm }: { match: Match; pm: WinProbMap | null }) {
  // Knockout rounds show "Round of 32"; group games show "Grp C".
  const pill = match.round ?? match.group ?? '';
  const pillClass = match.round ? (ROUND_CLASS[match.round] ?? '') : '';

  return (
    <div className="up-row">
      <span className="up-time">{localTime(match.kickoffUtc)}</span>
      <span className="up-cd">
        <Countdown kickoffUtc={match.kickoffUtc} />
      </span>
      <span className="up-match">
        <span className="fl">{match.homeTeam.flag}</span>
        {match.homeTeam.name}
        {rankFor(match.homeTeam.abbreviation) != null && <sup>{rankFor(match.homeTeam.abbreviation)}</sup>}
        <span className="x">v</span>
        <span className="fl">{match.awayTeam.flag}</span>
        {match.awayTeam.name}
        {rankFor(match.awayTeam.abbreviation) != null && <sup>{rankFor(match.awayTeam.abbreviation)}</sup>}
      </span>
      <UpcomingWinProb match={match} pm={pm} />
      <span className={`round-pill ${pillClass}`}>{pill}</span>
      {/* compact round tag shown only on mobile (full pill is hidden there) */}
      <span className={`round-pill up-tag ${pillClass}`}>
        {match.round ? ROUND_SHORT[match.round] ?? match.round : pill}
      </span>
      <span className="venue">{match.venue}</span>
    </div>
  );
}
