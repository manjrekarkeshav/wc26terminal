/**
 * Knockout bracket — driven by ESPN's actual knockout fixtures (real teams, scores,
 * advancement, live status). Falls back to an "as it stands" projection from group
 * standings before the knockouts are drawn. See lib/bracket.ts.
 */

import type { GroupStanding, Match } from '../../lib/types';
import { computeBracket, type BracketSlot } from '../../lib/bracket';

function TeamLine({ slot }: { slot: BracketSlot }) {
  if (!slot.team) {
    return (
      <div className="mteam">
        <span className="nm">{slot.label}</span>
      </div>
    );
  }
  return (
    <div className={`mteam${slot.advanced ? ' adv' : ''}`}>
      <span className="fl">{slot.team.flag}</span>
      <span className="nm">
        {slot.team.name}
        {slot.team.fifaRank != null && <sup>{slot.team.fifaRank}</sup>}
      </span>
      {slot.live && <span className="bk-live" title="Live" />}
      {slot.locked && <span className="lk">🔒</span>}
      {!slot.locked && slot.seed && <span className="seed">{slot.seed}</span>}
      {slot.score != null && <span className="msc">{slot.score}</span>}
    </div>
  );
}

// Accent color class per round (see .bk-c1…5 in index.css).
const ROUND_CLASS: Record<string, string> = {
  'Round of 32': 'bk-c1',
  'Round of 16': 'bk-c2',
  Quarterfinals: 'bk-c3',
  Semifinals: 'bk-c4',
  Final: 'bk-c5',
};

export function Bracket({ matches, standings }: { matches: Match[]; standings: GroupStanding[] }) {
  const allRounds = computeBracket(matches, standings);
  const rounds = allRounds.filter((r) => r.label !== '3rd Place');
  const thirdPlace = allRounds.find((r) => r.label === '3rd Place');

  return (
    <>
      <div className="section-head" id="bracket">
        <h2>Knockout bracket</h2>
      </div>
      <div className="bracket-wrap">
        <div className="bracket-cols">
          {rounds.map((round) => (
            <div key={round.label} className={`bk-col${round.spread ? ' spread' : ''} ${ROUND_CLASS[round.label] ?? ''}`}>
              <div className="bk-head">{round.label}</div>
              {round.matches.map((match, i) => {
                const bothPlaceholder = match.home.label != null && match.away.label != null;
                if (bothPlaceholder) {
                  return (
                    <div className="mph" key={i}>
                      {(match.venue || match.date) && (
                        <div className="mloc">
                          <span>{match.venue}</span>
                          <span>{match.date}</span>
                        </div>
                      )}
                      <div className="phl">{match.home.label}</div>
                      <div className="phl">{match.away.label}</div>
                    </div>
                  );
                }
                return (
                  <div className="m32" key={i}>
                    <div className="mloc">
                      <span>{match.venue}</span>
                      <span>{match.date}</span>
                    </div>
                    <TeamLine slot={match.home} />
                    <TeamLine slot={match.away} />
                  </div>
                );
              })}
              {round.label === 'Final' && thirdPlace && thirdPlace.matches[0] && (
                <div className="bk3rd">
                  <div className="bk-head">3rd place</div>
                  <div className="mph">
                    <div className="mloc">
                      <span>{thirdPlace.matches[0].venue}</span>
                      <span>{thirdPlace.matches[0].date}</span>
                    </div>
                    <div className="phl">{thirdPlace.matches[0].home.label}</div>
                    <div className="phl">{thirdPlace.matches[0].away.label}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
