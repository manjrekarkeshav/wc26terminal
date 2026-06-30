/**
 * Computes group standings from the match list.
 * Called client-side — no standings API needed.
 *
 * WC 2026 format: 12 groups of 4, top 2 advance automatically.
 * 8 best third-place teams also advance (handled separately in ThirdPlaceRace, v2).
 */

import type { Match, Team, GroupStanding, GroupTeamRow } from './types';
import { rankFor } from './rankings';

interface TeamStats {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
}

function makeStats(team: Team): TeamStats {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
}

function sortRows(rows: GroupTeamRow[]): GroupTeamRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name);
  });
}

export function computeStandings(matches: Match[]): GroupStanding[] {
  // Group matches by their group label (e.g. "Grp A")
  const groupMap = new Map<string, Map<string, TeamStats>>();

  for (const match of matches) {
    if (!match.group) continue;
    if (match.status === 'pre') continue;

    const hScore = match.homeScore ?? 0;
    const aScore = match.awayScore ?? 0;

    if (!groupMap.has(match.group)) groupMap.set(match.group, new Map());
    const g = groupMap.get(match.group)!;

    for (const [team, scored, conceded] of [
      [match.homeTeam, hScore, aScore],
      [match.awayTeam, aScore, hScore],
    ] as [Team, number, number][]) {
      if (!g.has(team.id)) g.set(team.id, makeStats(team));
      const s = g.get(team.id)!;
      s.played++;
      s.gf += scored;
      s.ga += conceded;
      if (scored > conceded) s.won++;
      else if (scored === conceded) s.drawn++;
      else s.lost++;
    }
  }

  const standings: GroupStanding[] = [];

  for (const [groupLabel, teamMap] of groupMap.entries()) {
    const rows: GroupTeamRow[] = Array.from(teamMap.values()).map((s) => {
      const gd = s.gf - s.ga;
      const points = s.won * 3 + s.drawn;
      return {
        team: s.team,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        gf: s.gf,
        ga: s.ga,
        gd,
        points,
        fifaRank: rankFor(s.team.abbreviation),
        qualified: false,
        eliminated: false,
      };
    });

    const sorted = sortRows(rows);

    // Mark top-2 as qualified and bottom team as eliminated (if all played 3 games)
    const allPlayed3 = sorted.every((r) => r.played === 3);
    sorted.forEach((r, i) => {
      if (i < 2 && allPlayed3) r.qualified = true;
      if (i === 3 && allPlayed3) r.eliminated = true;
    });

    // Group ID is "Grp A" → extract "A"
    const id = groupLabel.replace('Grp ', '');
    standings.push({ id, name: `Group ${id}`, rows: sorted });
  }

  return standings.sort((a, b) => a.id.localeCompare(b.id));
}
