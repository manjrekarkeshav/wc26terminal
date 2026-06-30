import type { Goal } from '../../lib/types';

export function ScorerLine({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="scorers-line">
        <span className="gl" style={{ color: 'var(--dim)' }}>No goals yet</span>
      </div>
    );
  }
  return (
    <div className="scorers-line">
      {goals.map((g, i) => (
        <span className="gl" key={i}>
          <span className="ball">⚽</span> {g.minute} {g.scorer}{' '}
          <span className="ab">{g.teamAbbr}</span>
        </span>
      ))}
    </div>
  );
}
