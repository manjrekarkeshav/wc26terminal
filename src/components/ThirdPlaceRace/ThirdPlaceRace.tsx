import type { GroupStanding, GroupTeamRow } from '../../lib/types';

interface ThirdRow extends GroupTeamRow {
  groupId: string;
}

function buildRaceRows(standings: GroupStanding[]): ThirdRow[] {
  const thirds: ThirdRow[] = standings
    .filter((g) => g.rows.length >= 3)
    .map((g) => ({ ...g.rows[2], groupId: g.id }));

  // FIFA ranking criteria: pts → GD → GF → name
  return thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return (a.fifaRank ?? 999) - (b.fifaRank ?? 999);
  });
}

export function ThirdPlaceRace({
  standings,
  archive = false,
}: {
  standings: GroupStanding[];
  archive?: boolean;
}) {
  const rows = buildRaceRows(standings);
  if (rows.length === 0) return null;

  return (
    <>
      <div className="section-head">
        <h2>{archive ? '3rd-place standings' : '3rd-place race'}</h2>
        <span className="sub">
          {archive ? 'final · 8 of 12 reached the Round of 32' : '8 of 12 advance to the Round of 32'}
        </span>
      </div>
      <div className="trace-wrap">
        <table className="trace">
          <thead>
            <tr>
              <th className="no">#</th>
              <th className="tm">Team</th>
              <th style={{ textAlign: 'left' }}>Grp</th>
              <th>P</th>
              <th>Pts</th>
              <th>GD</th>
              <th>GF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const advancing = i < 8;
              const cutoff = i === 7;
              return (
                <tr
                  key={row.team.id}
                  className={[advancing ? 'adv' : '', cutoff ? 'cutoff' : ''].join(' ').trim()}
                >
                  <td className="no">{i + 1}</td>
                  <td className="tm">
                    <span className="fl">{row.team.flag}</span>
                    <span className="lbl">{row.team.name}</span>
                    {row.fifaRank != null && <sup>{row.fifaRank}</sup>}
                  </td>
                  <td className="grp">{row.groupId}</td>
                  <td>{row.played}</td>
                  <td><b>{row.points}</b></td>
                  <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td>{row.gf}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="trace-note">
          Ranked by FIFA criteria — points, goal difference, goals scored.{' '}
          {archive
            ? 'The top 8 (green) reached the Round of 32.'
            : 'Top 8 (green) advance to the Round of 32. Provisional until all group games are played.'}
        </p>
      </div>
    </>
  );
}
