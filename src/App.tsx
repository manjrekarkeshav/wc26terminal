import { useMemo } from 'react';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { usePolling } from './hooks/usePolling';
import { useWinProb } from './hooks/useWinProb';
import { computeStandings } from './lib/standings';
import { computeTopScorers } from './lib/scorers';
import { TopBar } from './components/TopBar/TopBar';
import { HappeningNow } from './components/HappeningNow/HappeningNow';
import { FilterBar } from './components/FilterBar/FilterBar';
import { Upcoming } from './components/Upcoming/Upcoming';
import { RecentResults } from './components/RecentResults/RecentResults';
import { ScorersAndAssists } from './components/ScorersAndAssists/ScorersAndAssists';
import { GroupStandings } from './components/GroupStandings/GroupStandings';
import { ThirdPlaceRace } from './components/ThirdPlaceRace/ThirdPlaceRace';
import { Bracket } from './components/Bracket/Bracket';
import { Credit } from './components/Credit/Credit';
import { StaleBanner } from './components/StaleBanner';

export default function App() {
  const { data, error } = usePolling();
  const winProb = useWinProb();

  const matches = data?.matches ?? [];
  const isLive = matches.some((m) => m.status === 'in');
  const isStale = data?.isStale || error;

  const standings = useMemo(() => computeStandings(matches), [matches]);
  const topScorers = useMemo(() => computeTopScorers(matches, 20), [matches]);

  return (
    <ThemeProvider>
      <FilterProvider>
        <TopBar isLive={isLive} />

        {isStale && <StaleBanner />}

        <main>
          <HappeningNow matches={matches} pm={winProb} />
          <FilterBar matches={matches} />
          <Upcoming matches={matches} pm={winProb} />
          <RecentResults matches={matches} />
          <ScorersAndAssists scorers={topScorers} />
          <Bracket matches={matches} standings={standings} />
          <GroupStandings standings={standings} />
          <ThirdPlaceRace standings={standings} />
          <Credit />
        </main>

        <footer className="foot">
          <span>
            <span className="k">DATA</span> ESPN ·{' '}
            <span className="k">WIN%</span> POLYMARKET → DK → MODEL ·{' '}
            <span className="k">REFRESH</span> 10s ·{' '}
            <span className="k">TZ</span> LOCAL
          </span>
          <span>WC26TERMINAL</span>
        </footer>
      </FilterProvider>
    </ThemeProvider>
  );
}
