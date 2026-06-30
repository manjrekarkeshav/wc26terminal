/**
 * All ESPN API response normalization lives here.
 * The rest of the app consumes types.ts shapes — never raw ESPN JSON.
 *
 * ESPN scoreboard endpoint (no auth required):
 *   https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 *
 * This is an unofficial API; treat as best-effort.
 */

import type { Match, Team, Goal, CardEvent, MatchStatus, DataResponse } from './types';

// ESPN season.slug → human round label (knockouts only; group-stage has no pill).
const ROUND_LABELS: Record<string, string> = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  '3rd-place-match': '3rd Place',
  final: 'Final',
};

// Country code → flag emoji map for teams ESPN doesn't give us flags for.
const FLAG_MAP: Record<string, string> = {
  ARG: '🇦🇷', AUS: '🇦🇺', BEL: '🇧🇪', BIH: '🇧🇦', BRA: '🇧🇷',
  CAN: '🇨🇦', CHI: '🇨🇱', COL: '🇨🇴', CRC: '🇨🇷', CRO: '🇭🇷',
  CIV: '🇨🇮', CPV: '🇨🇻', CUW: '🇨🇼', CZE: '🇨🇿', DEN: '🇩🇰',
  ECU: '🇪🇨', EGY: '🇪🇬', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP: '🇪🇸', FRA: '🇫🇷',
  GER: '🇩🇪', GHA: '🇬🇭', HAI: '🇭🇹', IRI: '🇮🇷', IRQ: '🇮🇶',
  ITA: '🇮🇹', JOR: '🇯🇴', JPN: '🇯🇵', KOR: '🇰🇷', MAR: '🇲🇦',
  MEX: '🇲🇽', NED: '🇳🇱', NOR: '🇳🇴', NZL: '🇳🇿', PAN: '🇵🇦',
  PAR: '🇵🇾', POR: '🇵🇹', QAT: '🇶🇦', RSA: '🇿🇦', SAU: '🇸🇦',
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', SEN: '🇸🇳', SUI: '🇨🇭', SWE: '🇸🇪', TUN: '🇹🇳',
  TUR: '🇹🇷', URU: '🇺🇾', USA: '🇺🇸', UZB: '🇺🇿', COD: '🇨🇩',
  ALG: '🇩🇿', AUT: '🇦🇹', IRN: '🇮🇷', KSA: '🇸🇦',
};

function flagFor(abbr: string): string {
  return FLAG_MAP[abbr.toUpperCase()] ?? '🏳️';
}

function normalizeTeam(competitor: Record<string, unknown>): Team {
  const team = competitor.team as Record<string, unknown>;
  const abbr = String(team.abbreviation ?? '???').toUpperCase();
  return {
    id: String(team.id ?? ''),
    name: String(team.displayName ?? team.name ?? abbr),
    abbreviation: abbr,
    flag: flagFor(abbr),
  };
}

function normalizeStatus(event: Record<string, unknown>): MatchStatus {
  const status = event.status as Record<string, unknown>;
  const type = (status?.type as Record<string, unknown>)?.state;
  if (type === 'in') return 'in';
  if (type === 'post') return 'post';
  return 'pre';
}

function normalizeClock(event: Record<string, unknown>): string | null {
  const status = event.status as Record<string, unknown>;
  const type = status?.type as Record<string, unknown>;
  if (type?.state !== 'in') return null;
  const displayClock = status?.displayClock as string | undefined;
  const period = status?.period as number | undefined;
  if (displayClock) {
    // ESPN gives "67:00" — we want "67'"
    const mins = displayClock.split(':')[0];
    if (period && period > 2) return `ET ${mins}'`;
    return `${mins}'`;
  }
  return null;
}

function normalizeGoals(event: Record<string, unknown>): Goal[] {
  const comps = event.competitions as Record<string, unknown>[] | undefined;
  const comp = comps?.[0];
  if (!comp) return [];
  const details = comp.details as Record<string, unknown>[] | undefined;
  if (!details) return [];

  // Build team id → abbreviation map from competitors
  const competitors = comp.competitors as Record<string, unknown>[] | undefined ?? [];
  const teamAbbrById: Record<string, string> = {};
  for (const c of competitors) {
    const t = c.team as Record<string, unknown> | undefined;
    if (t?.id && t?.abbreviation) {
      teamAbbrById[String(t.id)] = String(t.abbreviation).toUpperCase();
    }
  }

  // ESPN goal type IDs: 70=Goal, 97=Own Goal, 98=Penalty, 137=Header, 138=Free-kick, 173=Volley
  const GOAL_TYPE_IDS = new Set(['70', '97', '98', '137', '138', '173']);
  return details
    .filter((d) => {
      const tid = String((d.type as Record<string, unknown>)?.id ?? '');
      return GOAL_TYPE_IDS.has(tid);
    })
    .map((d) => {
      const athletes = d.athletesInvolved as Record<string, unknown>[] | undefined;
      const scorer = athletes?.[0]?.displayName as string ?? 'Unknown';
      const teamId = String((d.team as Record<string, unknown>)?.id ?? '');
      const abbr = teamAbbrById[teamId] ?? '';
      const clock = d.clock as Record<string, unknown> | undefined;
      const minute = clock?.displayValue as string ?? '';
      return { scorer, minute, teamAbbr: abbr };
    });
}

function extractRound(event: Record<string, unknown>): string | null {
  const slug = (event.season as Record<string, unknown>)?.slug as string | undefined;
  if (slug && slug !== 'group-stage') return ROUND_LABELS[slug] ?? null;
  return null;
}

function extractCards(event: Record<string, unknown>): CardEvent[] {
  const comp = (event.competitions as Record<string, unknown>[] | undefined)?.[0];
  const details = comp?.details as Record<string, unknown>[] | undefined;
  if (!details) return [];

  const competitors = comp?.competitors as Record<string, unknown>[] | undefined ?? [];
  const abbrById: Record<string, string> = {};
  for (const c of competitors) {
    const t = c.team as Record<string, unknown> | undefined;
    if (t?.id && t?.abbreviation) abbrById[String(t.id)] = String(t.abbreviation).toUpperCase();
  }

  const cards: CardEvent[] = [];
  for (const d of details) {
    const tid = String((d.type as Record<string, unknown>)?.id ?? '');
    if (tid !== '94') continue; // 94 = Yellow Card
    const abbr = abbrById[String((d.team as Record<string, unknown>)?.id ?? '')];
    if (!abbr) continue;
    const athletes = d.athletesInvolved as Record<string, unknown>[] | undefined;
    const player = (athletes?.[0]?.displayName as string) ?? 'Unknown';
    const minute = ((d.clock as Record<string, unknown>)?.displayValue as string) ?? '';
    cards.push({ player, minute, teamAbbr: abbr });
  }
  return cards;
}

function extractGroup(event: Record<string, unknown>): string | null {
  const comps = event.competitions as Record<string, unknown>[] | undefined;
  const comp = comps?.[0];

  // Primary source: altGameNote e.g. "FIFA World Cup, Group L"
  const altNote = comp?.altGameNote as string | undefined;
  if (altNote) {
    const m = altNote.match(/Group\s+([A-Z])/i);
    if (m) return `Grp ${m[1].toUpperCase()}`;
  }

  // Fallback: notes array (group stage only)
  const notes = comp?.notes as Record<string, unknown>[] | undefined;
  if (notes && notes.length > 0) {
    const headline = notes[0].headline as string | undefined;
    if (headline) {
      const m2 = headline.match(/Group\s+([A-Z])/i);
      if (m2) return `Grp ${m2[1].toUpperCase()}`;
    }
  }

  return null;
}

function extractVenue(event: Record<string, unknown>): string {
  const comps = event.competitions as Record<string, unknown>[] | undefined;
  const comp = comps?.[0];
  const venue = comp?.venue as Record<string, unknown> | undefined;
  if (!venue) return '';
  // city may already include state: "Philadelphia, Pennsylvania" — use it directly
  const city = (venue.address as Record<string, unknown>)?.city as string ?? '';
  return city || (venue.fullName as string ?? '');
}

export function normalizeEvent(event: Record<string, unknown>): Match {
  const comps = event.competitions as Record<string, unknown>[] | undefined;
  const comp = comps?.[0];
  const competitors = comp?.competitors as Record<string, unknown>[] | undefined ?? [];

  const homeComp = competitors.find((c) => c.homeAway === 'home') ?? competitors[0] ?? {};
  const awayComp = competitors.find((c) => c.homeAway === 'away') ?? competitors[1] ?? {};

  const homeScore = homeComp.score !== undefined ? Number(homeComp.score) : null;
  const awayScore = awayComp.score !== undefined ? Number(awayComp.score) : null;

  // Penalty shootout (knockout matches level after extra time)
  const homeSO = homeComp.shootoutScore !== undefined && homeComp.shootoutScore !== null
    ? Number(homeComp.shootoutScore) : null;
  const awaySO = awayComp.shootoutScore !== undefined && awayComp.shootoutScore !== null
    ? Number(awayComp.shootoutScore) : null;

  const status = normalizeStatus(event);

  // Winner: trust ESPN's flag first (handles penalties), else regulation score, else shootout.
  let winner: 'home' | 'away' | null = null;
  if (status === 'post') {
    if (homeComp.winner === true) winner = 'home';
    else if (awayComp.winner === true) winner = 'away';
    else if (homeScore != null && awayScore != null && homeScore !== awayScore)
      winner = homeScore > awayScore ? 'home' : 'away';
    else if (homeSO != null && awaySO != null && homeSO !== awaySO)
      winner = homeSO > awaySO ? 'home' : 'away';
  }

  return {
    id: String(event.id ?? ''),
    status,
    homeTeam: normalizeTeam(homeComp),
    awayTeam: normalizeTeam(awayComp),
    homeScore: status === 'pre' ? null : homeScore,
    awayScore: status === 'pre' ? null : awayScore,
    clock: normalizeClock(event),
    kickoffUtc: String(event.date ?? ''),
    venue: extractVenue(event),
    group: extractGroup(event),
    round: extractRound(event),
    goals: status !== 'pre' ? normalizeGoals(event) : [],
    cards: status !== 'pre' ? extractCards(event) : [],
    homeShootout: status === 'post' ? homeSO : null,
    awayShootout: status === 'post' ? awaySO : null,
    winner,
  };
}

export function normalizeScoreboard(raw: unknown): DataResponse {
  const data = raw as Record<string, unknown>;
  const events = (data.events as Record<string, unknown>[]) ?? [];
  return {
    matches: events.map(normalizeEvent),
    fetchedAt: Date.now(),
  };
}
