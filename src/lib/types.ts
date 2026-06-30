export type MatchStatus = 'pre' | 'in' | 'post';

export interface Team {
  id: string;
  name: string;        // "Argentina"
  abbreviation: string; // "ARG"
  flag: string;        // emoji flag e.g. "🇦🇷"
}

export interface Goal {
  scorer: string;
  minute: string;      // "18'"
  teamAbbr: string;
}

export interface CardEvent {
  player: string;
  minute: string;      // "54'"
  teamAbbr: string;
}

export interface Match {
  id: string;
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  /** e.g. "67'" for live, null for pre/post */
  clock: string | null;
  /** ISO 8601 UTC string */
  kickoffUtc: string;
  venue: string;       // "Bay Area" / "Dallas"
  group: string | null; // "Grp C" or null for knockouts
  /** Knockout round label e.g. "Round of 32", or null for group stage */
  round: string | null;
  /** Only populated for live/completed matches */
  goals: Goal[];
  /** Yellow cards with player + minute detail */
  cards: CardEvent[];
  /** Penalty-shootout goals per side, null when the match wasn't decided on penalties */
  homeShootout: number | null;
  awayShootout: number | null;
}

export interface GroupTeamRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  fifaRank: number | null;
  qualified: boolean;   // top-2 advance
  eliminated: boolean;  // cannot mathematically advance
}

export interface GroupStanding {
  id: string;   // "A" … "L"
  name: string; // "Group A"
  rows: GroupTeamRow[];
}

export type BracketSlotStatus = 'known' | 'placeholder';

export interface BracketTeamSlot {
  status: BracketSlotStatus;
  team?: Team;
  seed?: string; // "K-2", "3rd" etc. shown when status=placeholder
  advanced?: boolean;
}

export interface BracketMatch {
  venue: string;
  dateLabel: string;
  home: BracketTeamSlot;
  away: BracketTeamSlot;
}

export interface BracketRound {
  label: string; // "Round of 32"
  matches: BracketMatch[];
  spread?: boolean; // whether to spread vertically (all rounds except R32)
}

export interface DataResponse {
  matches: Match[];
  /** Unix ms timestamp of when the proxy fetched from ESPN */
  fetchedAt: number;
  /** true when serving stale/bundled data */
  isStale?: boolean;
}
