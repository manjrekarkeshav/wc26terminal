import type { Podium } from '../../lib/tournament';
import { rankFor } from '../../lib/rankings';

function fmtDate(utc: string): string {
  if (!utc) return '';
  return new Date(utc).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Archive-mode hero: replaces "Happening now" once the tournament is over. Shows the
 * champion plus the final scoreline.
 */
export function Champion({ podium }: { podium: Podium }) {
  const { champion, runnerUp, final } = podium;
  const champIsHome = final.winner === 'home';
  const champScore = champIsHome ? final.homeScore : final.awayScore;
  const oppScore = champIsHome ? final.awayScore : final.homeScore;
  const champPens = champIsHome ? final.homeShootout : final.awayShootout;
  const oppPens = champIsHome ? final.awayShootout : final.homeShootout;
  const hasPens = champPens != null && oppPens != null;
  const rank = rankFor(champion.abbreviation);

  return (
    <>
      <div className="section-head" id="champion">
        <h2>Champion</h2>
        <span className="sub">{final.round ?? 'Final'} · {fmtDate(final.kickoffUtc)}</span>
      </div>
      <div className="stack">
        <article className="panel champ-card">
          <div className="champ-top">
            <span className="champ-trophy" aria-hidden="true">🏆</span>
            <span className="champ-flag">{champion.flag}</span>
            <span className="champ-name">
              {champion.name}
              {rank != null && <sup>{rank}</sup>}
            </span>
            <span className="champ-tag">World Champions</span>
          </div>
          <div className="champ-score">
            <span className="cs-team">{champion.abbreviation}</span>
            <span className="cs-num">
              {champScore ?? 0}
              {hasPens && <span className="mpen"> ({champPens})</span>}
            </span>
            <span className="cs-dash">–</span>
            <span className="cs-num">
              {oppScore ?? 0}
              {hasPens && <span className="mpen"> ({oppPens})</span>}
            </span>
            <span className="cs-team away">{runnerUp.abbreviation}</span>
          </div>
          <div className="champ-foot">
            beat <span className="fl">{runnerUp.flag}</span> {runnerUp.name} in the final
            {final.venue ? ` · ${final.venue}` : ''}
          </div>
        </article>
      </div>
    </>
  );
}
