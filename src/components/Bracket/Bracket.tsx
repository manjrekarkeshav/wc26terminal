/**
 * Knockout bracket — driven by ESPN's actual knockout fixtures (real teams, scores,
 * advancement, live status). Falls back to an "as it stands" projection from group
 * standings before the knockouts are drawn. See lib/bracket.ts.
 */

import type { GroupStanding, Match } from '../../lib/types';
import { computeBracket, type BracketSlot } from '../../lib/bracket';
import { ROUND_CLASS } from '../../lib/roundColors';

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
      {slot.score != null && (
        <span className="msc">
          {slot.score}
          {slot.shootout != null && <span className="mpen"> ({slot.shootout})</span>}
        </span>
      )}
    </div>
  );
}

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
            <div key={round.label} className={`bk-col${round.spread ? ' spread' : ''}${round.label === 'Final' ? ' final-col' : ''} ${ROUND_CLASS[round.label] ?? ''}`}>
              <div className="bk-head">{round.label}</div>
              <div className="bk-matches">
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
                const penalties = match.home.shootout != null || match.away.shootout != null;
                return (
                  <div className={`m32${match.upset ? ' shock' : ''}`} key={i}>
                    {(penalties || match.upset) && (
                      <div className="m32-tags">
                        {penalties && <span className="pen-tag">Penalties</span>}
                        {match.upset && (
                          <span className="shocker-tag" title={`⚡ ${match.upset}`}>⚡ Shocker</span>
                        )}
                      </div>
                    )}
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
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
