import { useEffect, useState } from 'react';
import type { TitleOddsRow } from '../lib/titleOdds';

const REFRESH_MS = 300_000; // 5 min — outright odds move slowly

/**
 * Polls /api/titleodds (the Polymarket "World Cup Winner" proxy) for live outright
 * title odds. Returns [] when unavailable (local dev without the worker, or the
 * market is gone) — the section then hides itself.
 */
export function useTitleOdds(): TitleOddsRow[] {
  const [teams, setTeams] = useState<TitleOddsRow[]>([]);

  useEffect(() => {
    let active = true;
    const fetchOdds = async () => {
      try {
        const res = await fetch('/api/titleodds');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { teams?: TitleOddsRow[] };
        if (active) setTeams(data.teams ?? []);
      } catch {
        if (active) setTeams([]);
      }
    };
    fetchOdds();
    const id = setInterval(fetchOdds, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return teams;
}
