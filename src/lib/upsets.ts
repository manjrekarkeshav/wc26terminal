/**
 * Identifies "SHOCKER" results: a completed match where the favorite (higher FIFA rank)
 * failed to win against a team ranked ≥ 20 places below.
 *  - Group stage: favorite drew ("held") or lost ("beat").
 *  - Knockout:    favorite was eliminated ("knocked out"), penalties included via match.winner.
 * Skipped when either team is unranked (outside the FIFA top 100).
 */

import type { Match } from './types';
import { rankFor } from './rankings';

const RANK_GAP = 20;

export interface UpsetInfo {
  /** e.g. "#41 Paraguay knocked out #10 Germany" */
  text: string;
}

export function getUpset(match: Match): UpsetInfo | null {
  if (match.status !== 'post') return null;

  const homeRank = rankFor(match.homeTeam.abbreviation);
  const awayRank = rankFor(match.awayTeam.abbreviation);
  if (homeRank == null || awayRank == null) return null;

  const homeIsFav = homeRank <= awayRank; // lower number = higher rank
  const favRank = homeIsFav ? homeRank : awayRank;
  const dogRank = homeIsFav ? awayRank : homeRank;
  if (dogRank - favRank < RANK_GAP) return null;

  const fav = homeIsFav ? match.homeTeam : match.awayTeam;
  const dog = homeIsFav ? match.awayTeam : match.homeTeam;
  const favSide = homeIsFav ? 'home' : 'away';

  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;
  const favScore = homeIsFav ? hs : as;
  const dogScore = homeIsFav ? as : hs;

  let verb: string | null = null;
  if (match.round != null) {
    // Knockout: the favorite must have been eliminated (dog is the winner).
    if (match.winner && match.winner !== favSide) verb = 'knocked out';
  } else {
    // Group stage: favorite drew or lost.
    if (favScore < dogScore) verb = 'beat';
    else if (favScore === dogScore) verb = 'held';
  }
  if (!verb) return null;

  return { text: `#${dogRank} ${dog.name} ${verb} #${favRank} ${fav.name}` };
}
