import { useEffect, useRef, useState, useCallback } from 'react';
import { normalizeScoreboard } from '../lib/espn';
import type { DataResponse } from '../lib/types';

const LIVE_INTERVAL = 10_000;
const IDLE_INTERVAL = 60_000;
// Every fixture played — nothing left to fetch, so back right off.
const COMPLETE_INTERVAL = 1_800_000; // 30 min
const FALLBACK_URL = '/schedule.json';

export function usePolling() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [error, setError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const normalized = normalizeScoreboard(raw);
      if (raw.isStale) normalized.isStale = true;
      setData(normalized);
      setError(false);
      // Schedule next poll: fast while live, slow when idle, barely at all once the
      // whole tournament is played out.
      const hasLive = normalized.matches.some((m) => m.status === 'in');
      const allDone =
        normalized.matches.length > 0 && normalized.matches.every((m) => m.status === 'post');
      const next = hasLive ? LIVE_INTERVAL : allDone ? COMPLETE_INTERVAL : IDLE_INTERVAL;
      timerRef.current = setTimeout(fetchData, next);
    } catch (e) {
      console.error('Poll error:', e);
      setError(true);
      // On error, try fallback schedule.json if we don't have data yet
      if (!data) {
        try {
          const fb = await fetch(FALLBACK_URL);
          const raw = await fb.json();
          setData({ ...normalizeScoreboard(raw), isStale: true });
        } catch {/* silent */}
      }
      // Retry slower on error
      timerRef.current = setTimeout(fetchData, IDLE_INTERVAL);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchData]);

  return { data, error };
}
