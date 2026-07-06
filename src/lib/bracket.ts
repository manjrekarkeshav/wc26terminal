/**
 * Knockout bracket builder.
 *
 * Primary source: ESPN's own knockout fixtures. ESPN resolves the bracket as matches
 * finish — when a R32 match completes it places the winner into the correct R16 slot —
 * so we render its fixtures directly (real teams, scores, live status, advancement).
 *
 * Fallback: before the knockouts begin (R32 still all placeholders), we project the R32
 * "as it stands" from group standings using the fixed FIFA template (Annex C) + a
 * max-bipartite matching for the 8 best third-place teams.
 */

import type { GroupStanding, GroupTeamRow, Match, TeamStats } from './types';
import { rankFor } from './rankings';
import { getUpset } from './upsets';

export interface BracketTeam {
  flag: string;
  name: string;
  abbr: string;
  fifaRank: number | null;
}

export interface BracketSlot {
  team?: BracketTeam;
  /** Placeholder text when the team isn't resolved yet, e.g. "Round of 32 3 Winner". */
  label?: string;
  /** Small seed hint after a projected team, e.g. "A1", "3rd". */
  seed?: string;
  /** Group winners/runners-up that have mathematically qualified (🔒). */
  locked?: boolean;
  /** Score to show once the match has started. */
  score?: number;
  /** Penalty-shootout goals for this side (knockouts decided on penalties). */
  shootout?: number | null;
  /** This side won a completed match (green highlight). */
  advanced?: boolean;
  /** This side is in a match currently in progress (red live dot). */
  live?: boolean;
}

export interface BracketMatchView {
  matchNo: number;
  venue: string;
  date: string;
  home: BracketSlot;
  away: BracketSlot;
  /** Set when the completed match was a SHOCKER upset; holds the explanatory text. */
  upset?: string;
  /** Team stats for in/post matches (hover panel); undefined for placeholders/pre. */
  stats?: { home: TeamStats; away: TeamStats };
}

export interface BracketRoundView {
  label: string;
  spread?: boolean;
  matches: BracketMatchView[];
}

const PLACEHOLDER_RE = /(winner|loser|runner|round of|semifinal|quarterfinal|group [a-l])/i;

function isPlaceholderName(name: string): boolean {
  return PLACEHOLDER_RE.test(name);
}

function fmtDate(utc: string): string {
  if (!utc) return '';
  const d = new Date(utc);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Build a bracket slot from one side of a real ESPN knockout match. */
function slotFromCompetitor(
  team: BracketTeam,
  score: number,
  status: Match['status'],
  won: boolean,
  shootout: number | null,
): BracketSlot {
  if (isPlaceholderName(team.name)) return { label: team.name };
  return {
    team,
    score: status === 'pre' ? undefined : score,
    shootout,
    advanced: status === 'post' && won,
    live: status === 'in',
  };
}

// ─── Bracket ordering (match the official connector-tree layout) ───────────────

/** City portion of a venue string ("Foxborough, MA" → "Foxborough"), for slot matching. */
function cityOf(venue: string): string {
  return venue.split(',')[0].trim();
}

function winnerAbbr(v: BracketMatchView): string | null {
  if (v.home.advanced && v.home.team) return v.home.team.abbr;
  if (v.away.advanced && v.away.team) return v.away.team.abbr;
  return null;
}
function viewTeamAbbrs(v: BracketMatchView): string[] {
  return [v.home.team?.abbr, v.away.team?.abbr].filter((x): x is string => !!x);
}

/** Order a round so match k pairs the winners of the previous round's matches 2k / 2k+1. */
function orderByFeeders(prev: BracketMatchView[], current: BracketMatchView[]): BracketMatchView[] {
  const n = Math.floor(prev.length / 2);
  const result: (BracketMatchView | undefined)[] = new Array(n).fill(undefined);
  const pool = [...current];
  for (let k = 0; k < n; k++) {
    const feeders = [winnerAbbr(prev[2 * k]), winnerAbbr(prev[2 * k + 1])].filter((x): x is string => !!x);
    if (feeders.length) {
      const idx = pool.findIndex((v) => feeders.every((t) => viewTeamAbbrs(v).includes(t)));
      if (idx >= 0) result[k] = pool.splice(idx, 1)[0];
    }
  }
  let p = 0;
  for (let k = 0; k < n; k++) if (!result[k]) result[k] = pool[p++];
  return result.filter((v): v is BracketMatchView => !!v);
}

function buildFromEspn(matches: Match[]): BracketRoundView[] {
  const knockout = matches.filter((m) => m.round != null);

  const toView = (m: Match, i: number): BracketMatchView => {
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;
    return {
      matchNo: i + 1,
      venue: m.venue,
      date: fmtDate(m.kickoffUtc),
      home: slotFromCompetitor(
        { flag: m.homeTeam.flag, name: m.homeTeam.name, abbr: m.homeTeam.abbreviation, fifaRank: rankFor(m.homeTeam.abbreviation) },
        hs, m.status, m.winner === 'home', m.homeShootout,
      ),
      away: slotFromCompetitor(
        { flag: m.awayTeam.flag, name: m.awayTeam.name, abbr: m.awayTeam.abbreviation, fifaRank: rankFor(m.awayTeam.abbreviation) },
        as, m.status, m.winner === 'away', m.awayShootout,
      ),
      upset: getUpset(m)?.text,
      stats: m.homeStats && m.awayStats ? { home: m.homeStats, away: m.awayStats } : undefined,
    };
  };
  const build = (label: string) => knockout.filter((m) => m.round === label).map(toView);

  // Round of 32 ordered by the official venue sequence (date breaks ties for the two
  // venues that host two R32 matches), so each later round aligns to its feeders.
  const rawR32 = knockout.filter((m) => m.round === 'Round of 32');
  const usedR32 = new Set<Match>();
  const orderedR32: Match[] = [];
  for (const slot of R32) {
    const city = cityOf(slot.venue);
    const cand = rawR32
      .filter((m) => !usedR32.has(m) && cityOf(m.venue) === city)
      .sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime())[0];
    if (cand) { orderedR32.push(cand); usedR32.add(cand); }
  }
  for (const m of rawR32) if (!usedR32.has(m)) orderedR32.push(m);
  const r32 = orderedR32.map(toView);

  const r16 = orderByFeeders(r32, build('Round of 16'));
  const qf = orderByFeeders(r16, build('Quarterfinals'));
  const sf = orderByFeeders(qf, build('Semifinals'));
  const fin = build('Final');

  const rounds: BracketRoundView[] = [
    { label: 'Round of 32', spread: false, matches: r32 },
    { label: 'Round of 16', spread: true, matches: r16 },
    { label: 'Quarterfinals', spread: true, matches: qf },
    { label: 'Semifinals', spread: true, matches: sf },
    { label: 'Final', spread: true, matches: fin },
  ];

  // 3rd-place match (rendered under Final by the component).
  const third = knockout
    .filter((m) => m.round === '3rd Place')
    .map((m, i): BracketMatchView => ({
      matchNo: i + 1,
      venue: m.venue,
      date: fmtDate(m.kickoffUtc),
      home: { label: m.homeTeam.name },
      away: { label: m.awayTeam.name },
    }));
  if (third.length) rounds.push({ label: '3rd Place', matches: third });

  return rounds;
}

// ─── Projection fallback (used only before knockouts resolve) ──────────────────

type Source =
  | { kind: 'W'; g: string }
  | { kind: 'RU'; g: string }
  | { kind: 'T'; set: string[] };

interface R32Template {
  matchNo: number;
  venue: string;
  date: string;
  home: Source;
  away: Source;
}

// Official 2026 R32 template (matches 73–88). Venues/dates illustrative.
const R32: R32Template[] = [
  { matchNo: 73, venue: 'Foxborough, MA', date: 'Jun 29', home: { kind: 'RU', g: 'A' }, away: { kind: 'RU', g: 'B' } },
  { matchNo: 74, venue: 'East Rutherford, NJ', date: 'Jun 30', home: { kind: 'W', g: 'E' }, away: { kind: 'T', set: ['A', 'B', 'C', 'D', 'F'] } },
  { matchNo: 75, venue: 'Inglewood, CA', date: 'Jun 28', home: { kind: 'W', g: 'F' }, away: { kind: 'RU', g: 'C' } },
  { matchNo: 76, venue: 'Guadalupe', date: 'Jun 29', home: { kind: 'W', g: 'C' }, away: { kind: 'RU', g: 'F' } },
  { matchNo: 77, venue: 'Toronto', date: 'Jul 2', home: { kind: 'W', g: 'I' }, away: { kind: 'T', set: ['C', 'D', 'F', 'G', 'H'] } },
  { matchNo: 78, venue: 'Inglewood, CA', date: 'Jul 3', home: { kind: 'RU', g: 'E' }, away: { kind: 'RU', g: 'I' } },
  { matchNo: 79, venue: 'Santa Clara, CA', date: 'Jul 1', home: { kind: 'W', g: 'A' }, away: { kind: 'T', set: ['C', 'E', 'F', 'H', 'I'] } },
  { matchNo: 80, venue: 'Seattle, WA', date: 'Jul 1', home: { kind: 'W', g: 'L' }, away: { kind: 'T', set: ['E', 'H', 'I', 'J', 'K'] } },
  { matchNo: 81, venue: 'Houston, TX', date: 'Jun 29', home: { kind: 'W', g: 'D' }, away: { kind: 'T', set: ['B', 'E', 'F', 'I', 'J'] } },
  { matchNo: 82, venue: 'Arlington, TX', date: 'Jun 30', home: { kind: 'W', g: 'G' }, away: { kind: 'T', set: ['A', 'E', 'H', 'I', 'J'] } },
  { matchNo: 83, venue: 'Mexico City', date: 'Jun 30', home: { kind: 'RU', g: 'K' }, away: { kind: 'RU', g: 'L' } },
  { matchNo: 84, venue: 'Atlanta, GA', date: 'Jul 1', home: { kind: 'W', g: 'H' }, away: { kind: 'RU', g: 'J' } },
  { matchNo: 85, venue: 'Miami Gardens, FL', date: 'Jul 3', home: { kind: 'W', g: 'B' }, away: { kind: 'T', set: ['E', 'F', 'G', 'I', 'J'] } },
  { matchNo: 86, venue: 'Arlington, TX', date: 'Jul 3', home: { kind: 'W', g: 'J' }, away: { kind: 'RU', g: 'H' } },
  { matchNo: 87, venue: 'Vancouver', date: 'Jul 2', home: { kind: 'W', g: 'K' }, away: { kind: 'T', set: ['D', 'E', 'I', 'J', 'L'] } },
  { matchNo: 88, venue: 'Kansas City, MO', date: 'Jul 3', home: { kind: 'RU', g: 'D' }, away: { kind: 'RU', g: 'G' } },
];

function teamOf(row: GroupTeamRow): BracketTeam {
  return {
    flag: row.team.flag,
    name: row.team.name,
    abbr: row.team.abbreviation,
    fifaRank: row.fifaRank ?? rankFor(row.team.abbreviation),
  };
}

function rankThirds(thirds: { g: string; row: GroupTeamRow }[]) {
  return [...thirds].sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd;
    if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf;
    return (a.row.fifaRank ?? 999) - (b.row.fifaRank ?? 999);
  });
}

/** Max bipartite matching (Kuhn's) of qualified third groups → R32 third slots. */
function matchThirds(qualifiedGroups: string[]): Record<number, string> {
  const slots = R32.filter((m) => m.away.kind === 'T').map((m) => ({
    matchNo: m.matchNo,
    set: (m.away as { kind: 'T'; set: string[] }).set,
  }));
  const result: Record<number, string> = {};
  const augment = (group: string, visited: Set<number>): boolean => {
    for (const slot of slots) {
      if (!slot.set.includes(group) || visited.has(slot.matchNo)) continue;
      visited.add(slot.matchNo);
      const current = result[slot.matchNo];
      if (current === undefined || augment(current, visited)) {
        result[slot.matchNo] = group;
        return true;
      }
    }
    return false;
  };
  for (const g of qualifiedGroups) augment(g, new Set());
  return result;
}

function resolveSlot(
  src: Source,
  byGroup: Map<string, GroupStanding>,
  thirdByMatch: Record<number, string>,
  matchNo: number,
  groupComplete: (g: string) => boolean,
): BracketSlot {
  if (src.kind === 'W' || src.kind === 'RU') {
    const idx = src.kind === 'W' ? 0 : 1;
    const row = byGroup.get(src.g)?.rows[idx];
    if (!row) return { label: `${src.kind === 'W' ? 'Winner' : 'Runner-up'} ${src.g}` };
    return { team: teamOf(row), seed: `${src.g}${idx + 1}`, locked: groupComplete(src.g) };
  }
  const g = thirdByMatch[matchNo];
  const row = g ? byGroup.get(g)?.rows[2] : undefined;
  if (!row) return { label: `3rd ${src.set.join('/')}` };
  return { team: teamOf(row), seed: '3rd' };
}

function projectR32(standings: GroupStanding[]): BracketMatchView[] {
  const byGroup = new Map(standings.map((s) => [s.id, s]));
  const groupComplete = (g: string) => {
    const s = byGroup.get(g);
    return !!s && s.rows.length === 4 && s.rows.every((r) => r.played === 3);
  };
  const thirds = standings.filter((s) => s.rows.length >= 3).map((s) => ({ g: s.id, row: s.rows[2] }));
  const thirdByMatch = matchThirds(rankThirds(thirds).slice(0, 8).map((t) => t.g));

  return R32.map((m) => ({
    matchNo: m.matchNo,
    venue: m.venue,
    date: m.date,
    home: resolveSlot(m.home, byGroup, thirdByMatch, m.matchNo, groupComplete),
    away: resolveSlot(m.away, byGroup, thirdByMatch, m.matchNo, groupComplete),
  }));
}

const PLACEHOLDER_LATER: BracketRoundView[] = (() => {
  const ph = (label: string, n: number): BracketMatchView[] =>
    Array.from({ length: n }, (_, i) => ({
      matchNo: 0, venue: '', date: '',
      home: { label: `${label} ${i * 2 + 1} Winner` },
      away: { label: `${label} ${i * 2 + 2} Winner` },
    }));
  return [
    { label: 'Round of 16', spread: true, matches: ph('Round of 32', 8) },
    { label: 'Quarterfinals', spread: true, matches: ph('Round of 16', 4) },
    { label: 'Semifinals', spread: true, matches: ph('Quarterfinal', 2) },
    { label: 'Final', spread: true, matches: [{ matchNo: 0, venue: 'East Rutherford, NJ', date: 'Jul 19', home: { label: 'Semifinal 1 Winner' }, away: { label: 'Semifinal 2 Winner' } }] },
  ];
})();

export function computeBracket(matches: Match[], standings: GroupStanding[]): BracketRoundView[] {
  const espn = buildFromEspn(matches);
  const r32 = espn.find((r) => r.label === 'Round of 32');

  // If ESPN has no R32 fixtures yet, or every R32 slot is still a placeholder
  // (knockouts not drawn), fall back to the "as it stands" projection.
  const r32Unresolved =
    !r32 ||
    r32.matches.length === 0 ||
    r32.matches.every((m) => m.home.label != null && m.away.label != null);

  if (r32Unresolved) {
    return [{ label: 'Round of 32', matches: projectR32(standings) }, ...PLACEHOLDER_LATER];
  }
  return espn;
}
