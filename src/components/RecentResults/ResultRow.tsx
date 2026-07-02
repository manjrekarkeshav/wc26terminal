import type { Match, CardEvent } from '../../lib/types';
import { rankFor } from '../../lib/rankings';
import { getUpset } from '../../lib/upsets';
import { ROUND_CLASS, ROUND_SHORT } from '../../lib/roundColors';
import { Tooltip } from '../Tooltip/Tooltip';

export function ResultRow({ match }: { match: Match }) {
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const homeAbbr = match.homeTeam.abbreviation;
  const awayAbbr = match.awayTeam.abbreviation;

  const cardsFor = (abbr: string) => {
    const cards = match.cards.filter((c) => c.teamAbbr === abbr);
    return {
      yellow: cards.filter((c) => c.color === 'yellow'),
      red: cards.filter((c) => c.color === 'red'),
    };
  };
  const home = cardsFor(homeAbbr);
  const away = cardsFor(awayAbbr);

  const upset = getUpset(match);
  const roundLabel = match.round ?? 'Group Stage';
  const hasShootout = match.homeShootout != null && match.awayShootout != null;
  const homeText = hasShootout ? `${homeScore} (${match.homeShootout})` : `${homeScore}`;
  const awayText = hasShootout ? `${awayScore} (${match.awayShootout})` : `${awayScore}`;

  // Scorer lines for the score tooltip, in chronological order.
  const goalLines = match.goals.map((g) => (
    <>⚽ {g.minute} {g.scorer} <span className="ab">{g.teamAbbr}</span></>
  ));

  const cardLines = (cards: CardEvent[]) =>
    cards.map((c) => (
      <>{c.color === 'red' ? '🟥' : '🟨'} {c.minute} {c.player}</>
    ));

  const align = (side: 'home' | 'away') => (side === 'away' ? 'right' : 'left');

  const cardBoxes = (cards: { yellow: CardEvent[]; red: CardEvent[] }, side: 'home' | 'away') => (
    <>
      {cards.yellow.length > 0 && (
        <Tooltip lines={cardLines(cards.yellow)} align={align(side)}>
          <span className="yc">{cards.yellow.length}</span>
        </Tooltip>
      )}
      {cards.red.length > 0 && (
        <Tooltip lines={cardLines(cards.red)} align={align(side)}>
          <span className="redc">{cards.red.length}</span>
        </Tooltip>
      )}
    </>
  );

  return (
    <div className={`res-card${upset ? ' shock' : ''}`}>
      {upset && (
        <span className="rc-shock-pos">
          <Tooltip lines={[<>⚡ {upset.text}</>]} align="left">
            <span className="shocker-tag">⚡ Shocker</span>
          </Tooltip>
        </span>
      )}
      <span className="rc-round-pos">
        <span className={`goal-round ${ROUND_CLASS[roundLabel] ?? ''}`}>
          {ROUND_SHORT[roundLabel] ?? roundLabel}
        </span>
      </span>
      <span className="rc-side">
        <span className="fl">{match.homeTeam.flag}</span>
        <span className="rc-abbr">{homeAbbr}</span>
        {rankFor(homeAbbr) != null && <sup>{rankFor(homeAbbr)}</sup>}
        {cardBoxes(home, 'home')}
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
        {cardBoxes(away, 'away')}
      </span>
    </div>
  );
}
