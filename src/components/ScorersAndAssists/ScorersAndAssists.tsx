import { useState } from 'react';
import type { ScorerRow } from '../../lib/scorers';
import type { AllTimeRow } from '../../lib/allTimeScorers';
import { ROUND_CLASS, ROUND_SHORT } from '../../lib/roundColors';
import { Tooltip } from '../Tooltip/Tooltip';

function ActiveToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`sc-toggle${on ? ' on' : ''}`}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      title="Show only players whose nation is still in the tournament"
    >
      <span className="sc-toggle-label">Active only</span>
      <span className="sc-switch" aria-hidden="true"><span className="knob" /></span>
    </button>
  );
}

function AllTimePanel({ rows }: { rows: AllTimeRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const filtered = activeOnly ? rows.filter((r) => r.active) : rows;
  const visible = expanded ? filtered : filtered.slice(0, 10);

  return (
    <div className="panel">
      <div className="phead">
        <span className="l">
          <span className="tick">◎</span>
          <span className="eyebrow">All-time top scorers</span>
        </span>
        <span className="phead-r">
          <ActiveToggle on={activeOnly} onToggle={() => setActiveOnly((v) => !v)} />
          <span className="count c-cyan">WC GOALS</span>
        </span>
      </div>

      {visible.map((row) => {
        const lines = [
          <>⚽ {row.total} career World Cup goals</>,
          ...(row.wc26 > 0
            ? [<span className="ab">{row.pre} pre-2026 · +{row.wc26} in WC26</span>]
            : []),
          row.active ? <>🟢 Active in WC26</> : <>🔴 Retired</>,
        ];
        return (
          <div className="scorer" key={row.name}>
            <span className="rk">{row.rank}</span>
            <Tooltip lines={lines}>
              <span className="who">
                <span className="fl">{row.flag}</span>
                <span>
                  <span className="nm">{row.name}</span>{' '}
                  <span className="nat">{row.code}</span>{' '}
                  <span className="at-markers">
                    {row.isTop && <span>⭐️</span>}
                    <span>{row.active ? '🟢' : '🔴'}</span>
                    {row.movedUp && <span>🔼</span>}
                  </span>
                </span>
              </span>
            </Tooltip>
            <Tooltip lines={lines} align="right">
              <span className="g">{row.total}</span>
            </Tooltip>
          </div>
        );
      })}

      {filtered.length > 10 && (
        <button className="show-more" type="button" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show top 10' : `Show top ${Math.min(filtered.length, 20)}`}
        </button>
      )}
    </div>
  );
}

/** "Quarterfinals" → "QF"; "Champion" keeps its own label. */
function exitLabel(round: string | undefined): string {
  if (!round) return '';
  if (round === 'Champion') return 'CHAMPION';
  return ROUND_SHORT[round] ?? round;
}

function LeaderboardPanel({
  title,
  badge,
  badgeClass,
  rows,
  eliminated,
  archive = false,
  exitRounds,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  rows: ScorerRow[];
  eliminated: Set<string>;
  archive?: boolean;
  exitRounds?: Map<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  // "Still alive" is meaningless once the tournament is over.
  const filtered = !archive && activeOnly ? rows.filter((r) => !eliminated.has(r.teamAbbr)) : rows;
  const visible = expanded ? filtered : filtered.slice(0, 10);

  return (
    <div className={`panel${expanded ? ' expanded' : ''}`}>
      <div className="phead">
        <span className="l">
          <span className="tick">◎</span>
          <span className="eyebrow">{title}</span>
        </span>
        <span className="phead-r">
          {!archive && <ActiveToggle on={activeOnly} onToggle={() => setActiveOnly((v) => !v)} />}
          <span className={`count ${badgeClass}`}>{badge}</span>
        </span>
      </div>

      {visible.map((row) => {
        const isOut = eliminated.has(row.teamAbbr);
        const exit = exitRounds?.get(row.teamAbbr);
        const isWinner = archive && row.rank === 1;
        const goalLines = row.goals.map((g) => (
          <>
            <span className={`goal-round ${ROUND_CLASS[g.round] ?? ''}`}>
              {ROUND_SHORT[g.round] ?? g.round}
            </span>
            ⚽ {g.minute} vs {g.opponent} · <span className="ab">{g.result}</span>
          </>
        ));
        const footer = archive
          ? exit === 'Champion'
            ? '🏆 Won the tournament'
            : exit
              ? `Went out in the ${exit}`
              : ''
          : isOut
            ? "❌ Eliminated from WC '26"
            : "🟢 Still alive in WC '26";
        const tipLines = [
          ...goalLines,
          ...(isWinner ? [<span className="tip-foot">👟 Golden Boot winner</span>] : []),
          ...(footer ? [<span className="tip-foot">{footer}</span>] : []),
        ];
        return (
          <div className="scorer" key={`${row.name}-${row.teamAbbr}`}>
            <span className="rk">{row.rank}</span>
            <Tooltip lines={tipLines}>
              <span className="who">
                <span className="fl">{row.flag}</span>
                <span>
                  <span className="nm">{row.name}</span>{' '}
                  <span className="nat">{row.teamAbbr}</span>{' '}
                  {isWinner && (
                    <span className="boot-crown" title="Golden Boot winner">🏆</span>
                  )}{' '}
                  {archive ? (
                    exit && (
                      <span
                        className={
                          exit === 'Champion'
                            ? 'goal-round exit-champ'
                            : `goal-round ${ROUND_CLASS[exit] ?? ''}`
                        }
                        title={footer}
                      >
                        {exitLabel(exit)}
                      </span>
                    )
                  ) : (
                    <span
                      className="team-status"
                      title={isOut ? "Eliminated from WC '26" : "Still alive in WC '26"}
                    >
                      {isOut ? '❌' : '🟢'}
                    </span>
                  )}
                </span>
              </span>
            </Tooltip>
            <Tooltip lines={tipLines} align="right">
              <span className="g">{row.count}</span>
            </Tooltip>
          </div>
        );
      })}

      {filtered.length > 10 && (
        <button className="show-more" type="button" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Show top 10' : `Show top ${Math.min(filtered.length, 20)}`}
        </button>
      )}
    </div>
  );
}

export function ScorersAndAssists({
  scorers,
  eliminated,
  allTime,
  archive = false,
  exitRounds,
}: {
  scorers: ScorerRow[];
  eliminated: Set<string>;
  allTime: AllTimeRow[];
  archive?: boolean;
  exitRounds?: Map<string, string>;
}) {
  if (scorers.length === 0) return null;

  return (
    <>
      <div className="section-head" id="scorers">
        <h2>Golden Boot</h2>
        <span className="sub">
          {archive ? 'final · this World Cup & all-time' : 'this World Cup & all-time · goals'}
        </span>
      </div>
      <div className="stack">
        <div className="sa-grid">
          <LeaderboardPanel
            title="Top scorers"
            badge="GOALS"
            badgeClass="c-amber"
            rows={scorers}
            eliminated={eliminated}
            archive={archive}
            exitRounds={exitRounds}
          />
          <AllTimePanel rows={allTime} />
        </div>
      </div>
    </>
  );
}
