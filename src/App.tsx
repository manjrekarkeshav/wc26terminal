import { useMemo } from 'react';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { usePolling } from './hooks/usePolling';
import { useWinProb } from './hooks/useWinProb';
import { useTitleOdds } from './hooks/useTitleOdds';
import { computeStandings } from './lib/standings';
import { computeTopScorers } from './lib/scorers';
import { computeAllTimeScorers } from './lib/allTimeScorers';
import { computeEliminatedTeams } from './lib/teamStatus';
import { TopBar } from './components/TopBar/TopBar';
import { HappeningNow } from './components/HappeningNow/HappeningNow';
import { FilterBar } from './components/FilterBar/FilterBar';
import { Upcoming } from './components/Upcoming/Upcoming';
import { RecentResults } from './components/RecentResults/RecentResults';
import { ScorersAndAssists } from './components/ScorersAndAssists/ScorersAndAssists';
import { GroupStandings } from './components/GroupStandings/GroupStandings';
import { ThirdPlaceRace } from './components/ThirdPlaceRace/ThirdPlaceRace';
import { Bracket } from './components/Bracket/Bracket';
import { TitleOdds } from './components/TitleOdds/TitleOdds';
import { Credit } from './components/Credit/Credit';
import { StaleBanner } from './components/StaleBanner';

export default function App() {
  const { data, error } = usePolling();
  const winProb = useWinProb();
  const titleOdds = useTitleOdds();

  const matches = data?.matches ?? [];
  const isLive = matches.some((m) => m.status === 'in');
  const isStale = data?.isStale || error;

  // Short name of the viewer's own time zone (e.g. "PDT", "GMT+5:30"), for the footer.
  const tz = (() => {
    try {
      return (
        new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
          .formatToParts(new Date())
          .find((p) => p.type === 'timeZoneName')?.value ?? 'LOCAL'
      );
    } catch {
      return 'LOCAL';
    }
  })();

  const standings = useMemo(() => computeStandings(matches), [matches]);
  const topScorers = useMemo(() => computeTopScorers(matches, 20), [matches]);
  const allTimeScorers = useMemo(() => computeAllTimeScorers(matches), [matches]);
  const eliminated = useMemo(() => computeEliminatedTeams(matches, standings), [matches, standings]);

  // Polymarket's live title market runs on the real-world timeline, so it can still
  // price teams our tournament has already knocked out. Drop eliminated teams and
  // renormalize across those actually still alive in this bracket.
  const liveTitleOdds = useMemo(() => {
    const alive = titleOdds.filter((t) => !eliminated.has(t.code));
    const total = alive.reduce((s, t) => s + t.prob, 0) || 1;
    return alive.map((t) => ({ ...t, prob: (t.prob / total) * 100 }));
  }, [titleOdds, eliminated]);

  return (
    <ThemeProvider>
      <FilterProvider>
        <TopBar isLive={isLive} />

        {isStale && <StaleBanner />}

        <main>
          <div className={`top-split${liveTitleOdds.length > 0 ? ' has-side' : ''}`}>
            <div className="top-main">
              <HappeningNow matches={matches} pm={winProb} />
            </div>
            <TitleOdds teams={liveTitleOdds} />
          </div>
          <FilterBar matches={matches} />
          <Upcoming matches={matches} pm={winProb} />
          <RecentResults matches={matches} />
          <ScorersAndAssists scorers={topScorers} eliminated={eliminated} allTime={allTimeScorers} />
          <Bracket matches={matches} standings={standings} />
          <GroupStandings standings={standings} />
          <ThirdPlaceRace standings={standings} />
          <Credit />
        </main>

        <footer className="foot">
          <span>
            <span className="k">DATA</span> ESPN ·{' '}
            <span className="k">TITLE ODDS</span> POLYMARKET ·{' '}
            <span className="k">WIN%</span> MODEL ·{' '}
            <span className="k">REFRESH</span> 10s ·{' '}
            <span className="k">TZ</span> {tz}
          </span>
          <span>WC26TERMINAL</span>
        </footer>
      </FilterProvider>
    </ThemeProvider>
  );
}
