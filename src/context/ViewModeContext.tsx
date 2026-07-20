import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * Archive vs Live presentation. Once the tournament is over the dashboard defaults to
 * "archive" (champion hero, podium, recap); flipping to "live" restores the
 * tournament-era layout exactly as it looked while matches were being played.
 *
 * Surfaced in the UI as the "Summary" switch — `archive` is the internal name.
 */
export type ViewMode = 'archive' | 'live';

interface ViewModeState {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}

const STORAGE_KEY = 'wc26-view-mode';

const ViewModeContext = createContext<ViewModeState>({ mode: 'archive', setMode: () => {} });

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'live' ? 'live' : 'archive';
    } catch {
      return 'archive';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — mode simply won't persist */
    }
  }, [mode]);

  return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);
