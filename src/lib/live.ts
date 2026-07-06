import type { Match } from './types';

/** Fixtures starting within this window surface in "Happening now" before kickoff. */
export const SOON_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * True when a match belongs in the "Happening now" section: live, delayed (and not yet
 * finished), or a pre-match kicking off within the next 30 minutes. Shared with Upcoming
 * so the same fixture never appears in both lists.
 */
export function isHappeningNow(match: Match, now: number = Date.now()): boolean {
  if (match.status === 'in') return true;
  // Delayed fixtures surface here regardless of their (stale) scheduled time
  if (match.delayed && match.status !== 'post') return true;
  // Pre-match starting within the next 30 minutes
  if (match.status === 'pre') {
    const diff = new Date(match.kickoffUtc).getTime() - now;
    return diff > 0 && diff <= SOON_WINDOW_MS;
  }
  return false;
}
