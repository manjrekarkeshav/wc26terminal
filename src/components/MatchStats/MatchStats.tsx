import type { TeamStats } from '../../lib/types';

interface Row {
  label: string;
  home: number | null;
  away: number | null;
  suffix?: string;
}

/**
 * Two-team match-stats table (home · label · away) with a possession split bar on top.
 * Pure/presentational — rows with no data on either side are omitted.
 */
export function MatchStats({
  home,
  away,
  homeAbbr,
  awayAbbr,
}: {
  home: TeamStats;
  away: TeamStats;
  homeAbbr: string;
  awayAbbr: string;
}) {
  const rows: Row[] = [
    { label: 'Possession', home: home.possession, away: away.possession, suffix: '%' },
    { label: 'Shots', home: home.shots, away: away.shots },
    { label: 'Shots on goal', home: home.shotsOnTarget, away: away.shotsOnTarget },
    { label: 'Corners', home: home.corners, away: away.corners },
    { label: 'Fouls', home: home.fouls, away: away.fouls },
  ].filter((r) => r.home != null || r.away != null);

  if (rows.length === 0) return null;

  const fmt = (v: number | null, suffix?: string) => (v == null ? '–' : `${v}${suffix ?? ''}`);

  // Possession split bar (falls back to 50/50 if missing).
  const hp = home.possession ?? 50;
  const ap = away.possession ?? 50;
  const total = hp + ap || 1;
  const homePct = Math.round((hp / total) * 100);

  return (
    <div className="match-stats">
      <div className="ms-bar">
        <i className="home" style={{ width: `${homePct}%` }} />
        <i className="away" style={{ width: `${100 - homePct}%` }} />
      </div>
      <div className="ms-head">
        <span className="ms-team">{homeAbbr}</span>
        <span className="ms-lab">Match stats</span>
        <span className="ms-team">{awayAbbr}</span>
      </div>
      {rows.map((r) => (
        <div className="ms-row" key={r.label}>
          <span className="ms-h">{fmt(r.home, r.suffix)}</span>
          <span className="ms-lab">{r.label}</span>
          <span className="ms-a">{fmt(r.away, r.suffix)}</span>
        </div>
      ))}
    </div>
  );
}
