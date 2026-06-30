import type { Match } from '../../lib/types';
import { rankFor } from '../../lib/rankings';
import { Tooltip } from '../Tooltip/Tooltip';

export function ResultRow({ match }: { match: Match }) {
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const homeAbbr = match.homeTeam.abbreviation;
  const awayAbbr = match.awayTeam.abbreviation;

  const homeCards = match.cards.filter((c) => c.teamAbbr === homeAbbr);
  const awayCards = match.cards.filter((c) => c.teamAbbr === awayAbbr);

  const hasShootout = match.homeShootout != null && match.awayShootout != null;
  const homeText = hasShootout ? `${homeScore} (${match.homeShootout})` : `${homeScore}`;
  const awayText = hasShootout ? `${awayScore} (${match.awayShootout})` : `${awayScore}`;

  // Scorer lines for the score tooltip, in chronological order.
  const goalLines = match.goals.map((g) => (
    <>⚽ {g.minute} {g.scorer} <span className="ab">{g.teamAbbr}</span></>
  ));

  const cardLines = (cards: typeof homeCards) =>
    cards.map((c) => (
      <>🟨 {c.minute} {c.player}</>
    ));

  return (
    <div className="res-card">
      <span className="rc-side">
        <span className="fl">{match.homeTeam.flag}</span>
        <span className="rc-abbr">{homeAbbr}</span>
        {rankFor(homeAbbr) != null && <sup>{rankFor(homeAbbr)}</sup>}
        {homeCards.length > 0 && (
          <Tooltip lines={cardLines(homeCards)}>
            <span className="yc">{homeCards.length}</span>
          </Tooltip>
        )}
      </span>

      <span className="rc-mid">
        <Tooltip lines={goalLines} align="left">
          <span className="rc-score">{homeText} – {awayText}</span>
        </Tooltip>
        {hasShootout && <span className="pen-tag">Penalties</span>}
      </span>

      <span className="rc-side away">
        <span className="fl">{match.awayTeam.flag}</span>
        <span className="rc-abbr">{awayAbbr}</span>
        {rankFor(awayAbbr) != null && <sup>{rankFor(awayAbbr)}</sup>}
        {awayCards.length > 0 && (
          <Tooltip lines={cardLines(awayCards)} align="right">
            <span className="yc">{awayCards.length}</span>
          </Tooltip>
        )}
      </span>
    </div>
  );
}
