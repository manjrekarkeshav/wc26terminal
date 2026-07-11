import type { TitleOddsRow } from '../../lib/titleOdds';
import { flagFor } from '../../lib/espn';
import { rankFor } from '../../lib/rankings';

/**
 * Title Odds — live outright "who wins the tournament" probabilities from
 * Polymarket's World Cup Winner market. Sits next to Happening Now (desktop) and
 * stacks below it (mobile). Hidden entirely when no market data is available.
 */
export function TitleOdds({ teams }: { teams: TitleOddsRow[] }) {
  if (teams.length === 0) return null;
  const max = teams[0]?.prob || 100;

  return (
    <section className="title-odds-sec">
      <div className="section-head" id="title-odds">
        <h2>Title odds</h2>
        <span className="sub">live · Polymarket</span>
      </div>
      <div className="to-wrap">
        <div className="panel to-panel">
          {teams.map((t, i) => {
            const rank = rankFor(t.code);
            return (
              <div className="to-row" key={t.code}>
                <span className="to-rk">{i + 1}</span>
                <div className="to-body">
                  <div className="to-line">
                    <span className="fl">{flagFor(t.code)}</span>
                    <span className="to-name">{t.name}</span>
                    {rank != null && <sup>{rank}</sup>}
                    <span className="to-pct">{t.prob.toFixed(1)}%</span>
                  </div>
                  <span className="to-bar">
                    <i style={{ width: `${(t.prob / max) * 100}%` }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="to-note">Implied by live Polymarket money, renormalized across teams still alive.</p>
      </div>
    </section>
  );
}
