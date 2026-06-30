import { useEffect, useState } from 'react';
import type { WinProbMap } from '../lib/winprob';

const REFRESH_MS = 60_000;

/**
 * Polls /api/winprob (the Polymarket proxy) for live market probabilities.
 * Returns null when unavailable (e.g. local dev without the Function) — callers
 * then fall back to the model in getWinProb().
 */
export function useWinProb(): WinProbMap | null {
  const [map, setMap] = useState<WinProbMap | null>(null);

  useEffect(() => {
    let active = true;
    const fetchMap = async () => {
      try {
        const res = await fetch('/api/winprob');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as WinProbMap;
        if (active) setMap(data);
      } catch {
        if (active) setMap(null);
      }
    };
    fetchMap();
    const id = setInterval(fetchMap, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return map;
}
