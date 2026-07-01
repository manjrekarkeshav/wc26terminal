import { useState } from 'react';
import type { ScorerRow } from '../../lib/scorers';
import { Tooltip } from '../Tooltip/Tooltip';

function LeaderboardPanel({
  title,
  badge,
  badgeClass,
  rows,
  eliminated,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  rows: ScorerRow[];
  eliminated: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, 10);

  return (
    <div className={`panel${expanded ? ' expanded' : ''}`}>
      <div className="phead">
        <span className="l">
          <span className="tick">◎</span>
          <span className="eyebrow">{title}</span>
        </span>
        <span className={`count ${badgeClass}`}>{badge}</span>
      </div>

      {visible.map((row) => {
        const goalLines = row.goals.map((g) => (
          <>⚽ {g.minute} vs {g.opponent} · <span className="ab">{g.result}</span></>
        ));
        const isOut = eliminated.has(row.teamAbbr);
        return (
          <div className="scorer" key={`${row.name}-${row.teamAbbr}`}>
            <span className="rk">{row.rank}</span>
            <Tooltip lines={goalLines}>
              <span className="who">
                <span className="fl">{row.flag}</span>
                <span>
                  <span className="nm">{row.name}</span>{' '}
                  <span className="nat">{row.teamAbbr}</span>{' '}
                  <span
                    className="team-status"
                    title={isOut ? 'Team eliminated' : 'Team still in the competition'}
                  >
                    {isOut ? '❌' : '🟢'}
                  </span>
                </span>
              </span>
            </Tooltip>
            <Tooltip lines={goalLines} align="right">
              <span className="g">{row.count}</span>
            </Tooltip>
          </div>
        );
      })}

      {rows.length > 10 && (
        <button className="show-more" type="button" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show top 10' : `Show top ${Math.min(rows.length, 20)}`}
        </button>
      )}
    </div>
  );
}

export function ScorersAndAssists({
  scorers,
  eliminated,
}: {
  scorers: ScorerRow[];
  eliminated: Set<string>;
}) {
  if (scorers.length === 0) return null;

  return (
    <>
      <div className="section-head" id="scorers">
        <h2>Golden Boot</h2>
        <span className="sub">top scorers · goals</span>
      </div>
      <div className="stack">
        <div className="sa-grid">
          <LeaderboardPanel
            title="Top scorers"
            badge="GOALS"
            badgeClass="c-amber"
            rows={scorers}
            eliminated={eliminated}
          />
        </div>
      </div>
    </>
  );
}
