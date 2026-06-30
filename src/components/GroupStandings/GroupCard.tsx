import type { GroupStanding } from '../../lib/types';

export function GroupCard({ group }: { group: GroupStanding }) {
  const ranked = group.rows.map((r) => r.fifaRank).filter((r): r is number => r != null);
  const avgRank = ranked.length
    ? Math.round(ranked.reduce((a, b) => a + b, 0) / ranked.length)
    : null;

  return (
    <div className="gcard">
      <div className="ghead">
        <span className="gname">{group.name}</span>
        <span className="grank">
          {avgRank != null ? `Avg FIFA rank ${avgRank}` : `${group.rows.length} / 4 played`}
        </span>
      </div>
      <table className="gtable">
        <thead>
          <tr>
            <th className="tm">Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr
              key={row.team.id}
              className={
                row.qualified ? 'gq' : row.eliminated ? 'gx' : undefined
              }
            >
              <td className="tm">
                <span className="fl">{row.team.flag}</span>
                <span className="lbl">{row.team.name}</span>
                {row.eliminated && <span className="elim">✕</span>}
                {row.fifaRank != null && <sup>{row.fifaRank}</sup>}
              </td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
              <td className="pts">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
