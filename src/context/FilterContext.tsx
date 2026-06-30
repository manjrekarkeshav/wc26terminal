import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FilterState {
  team: string;
  location: string;
  setTeam: (t: string) => void;
  setLocation: (l: string) => void;
  clear: () => void;
}

const FilterContext = createContext<FilterState>({
  team: '', location: '',
  setTeam: () => {}, setLocation: () => {}, clear: () => {},
});

export function FilterProvider({ children }: { children: ReactNode }) {
  const [team, setTeamState] = useState('');
  const [location, setLocationState] = useState('');

  const setTeam = (t: string) => { setTeamState(t); if (t) setLocationState(''); };
  const setLocation = (l: string) => { setLocationState(l); if (l) setTeamState(''); };
  const clear = () => { setTeamState(''); setLocationState(''); };

  return (
    <FilterContext.Provider value={{ team, location, setTeam, setLocation, clear }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilter = () => useContext(FilterContext);
