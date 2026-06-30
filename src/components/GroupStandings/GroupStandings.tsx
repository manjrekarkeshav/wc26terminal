import type { GroupStanding } from '../../lib/types';
import { GroupCard } from './GroupCard';

export function GroupStandings({ standings }: { standings: GroupStanding[] }) {
  if (standings.length === 0) {
    return (
      <>
        <div className="section-head" id="groups">
          <h2>Group standings</h2>
          <span className="sub">top 2 advance · 8 best 3rd-place teams advance</span>
        </div>
        <div className="stack">
          <div className="empty-card">No group data yet.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-head" id="groups">
        <h2>Group standings</h2>
        <span className="sub">top 2 advance · 8 best 3rd-place teams advance</span>
      </div>
      <div className="groups">
        {standings.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
    </>
  );
}
