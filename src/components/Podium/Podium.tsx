import type { Podium as PodiumData } from '../../lib/tournament';
import { rankFor } from '../../lib/rankings';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Archive-mode sidebar: replaces Title Odds with the final standings. Reuses the
 * `.title-odds-sec` / `.to-*` layout so the top-split grid is unchanged.
 */
export function Podium({ podium }: { podium: PodiumData }) {
  const rows = [
    { team: podium.champion, label: 'Winner' },
    { team: podium.runnerUp, label: 'Runner-up' },
    ...(podium.third ? [{ team: podium.third, label: 'Third' }] : []),
  ];

  return (
    <section className="title-odds-sec">
      <div className="section-head" id="podium">
        <h2>Final standings</h2>
        <span className="sub">2026 World Cup</span>
      </div>
      <div className="to-wrap">
        <div className="panel to-panel">
          {rows.map((r, i) => {
            const rank = rankFor(r.team.abbreviation);
            return (
              <div className="to-row podium-row" key={r.team.abbreviation}>
                <span className="to-rk medal" aria-hidden="true">{MEDALS[i]}</span>
                <div className="to-body">
                  <div className="to-line">
                    <span className="fl">{r.team.flag}</span>
                    <span className="to-name">{r.team.name}</span>
                    {rank != null && <sup>{rank}</sup>}
                    <span className="podium-lab">{r.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
