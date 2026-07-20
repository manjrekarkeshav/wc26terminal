import { useMemo } from 'react';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { usePolling } from './hooks/usePolling';
import { useWinProb } from './hooks/useWinProb';
import { useTitleOdds } from './hooks/useTitleOdds';
import { computeStandings } from './lib/standings';
import { computeTopScorers } from './lib/scorers';
import { computeAllTimeScorers } from './lib/allTimeScorers';
import { computeEliminatedTeams } from './lib/teamStatus';
import { isTournamentComplete, getPodium, computeExitRound } from './lib/tournament';
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
import { Champion } from './components/Champion/Champion';
import { Podium } from './components/Podium/Podium';
import { Recap } from './components/Recap/Recap';
import { Credit } from './components/Credit/Credit';
import { StaleBanner } from './components/StaleBanner';

export default function App() {
  return (
    <ThemeProvider>
      <ViewModeProvider>
        <FilterProvider>
          <Dashboard />
        </FilterProvider>
      </ViewModeProvider>
    </ThemeProvider>
  );
}

function Dashboard() {
  const { mode } = useViewMode();
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

  // Tournament finished → offer the archive presentation (default), with a top-bar
  // toggle back to the live-era layout.
  const complete = useMemo(() => isTournamentComplete(matches), [matches]);
  const podium = useMemo(() => (complete ? getPodium(matches) : null), [complete, matches]);
  const exitRounds = useMemo(() => computeExitRound(matches), [matches]);
  const archive = complete && mode === 'archive' && podium != null;

  // Polymarket's live title market runs on the real-world timeline, so it can still
  // price teams our tournament has already knocked out. Drop eliminated teams and
  // renormalize across those actually still alive in this bracket.
  const liveTitleOdds = useMemo(() => {
    const alive = titleOdds.filter((t) => !eliminated.has(t.code));
    const total = alive.reduce((s, t) => s + t.prob, 0) || 1;
    return alive.map((t) => ({ ...t, prob: (t.prob / total) * 100 }));
  }, [titleOdds, eliminated]);

  const hasSide = archive ? true : liveTitleOdds.length > 0;

  return (
    <>
      <TopBar isLive={isLive} archive={archive} canToggle={complete && podium != null} />

      {isStale && <StaleBanner />}

      <main>
        <div className={`top-split${hasSide ? ' has-side' : ''}`}>
          <div className="top-main">
            {archive && podium ? (
              <Champion podium={podium} />
            ) : (
              <HappeningNow matches={matches} pm={winProb} />
            )}
          </div>
          {archive && podium ? <Podium podium={podium} /> : <TitleOdds teams={liveTitleOdds} />}
        </div>
        {archive && podium && <Recap matches={matches} podium={podium} scorers={topScorers} />}
        <FilterBar matches={matches} />
        {!archive && <Upcoming matches={matches} pm={winProb} />}
        <RecentResults matches={matches} archive={archive} />
        <ScorersAndAssists
          scorers={topScorers}
          eliminated={eliminated}
          allTime={allTimeScorers}
          archive={archive}
          exitRounds={exitRounds}
        />
        <Bracket matches={matches} standings={standings} />
        <GroupStandings standings={standings} />
        <ThirdPlaceRace standings={standings} archive={archive} />
        <Credit />
      </main>

      <footer className="foot">
        <span>
          <span className="k">DATA</span> ESPN ·{' '}
          {archive ? (
            <>
              <span className="k">STATUS</span> TOURNAMENT COMPLETE ·{' '}
              <span className="k">REFRESH</span> PAUSED ·{' '}
            </>
          ) : (
            <>
              <span className="k">TITLE ODDS</span> POLYMARKET ·{' '}
              <span className="k">WIN%</span> MODEL ·{' '}
              <span className="k">REFRESH</span> 10s ·{' '}
            </>
          )}
          <span className="k">TZ</span> {tz}
        </span>
        <span>WC26TERMINAL</span>
      </footer>
    </>
  );
}
