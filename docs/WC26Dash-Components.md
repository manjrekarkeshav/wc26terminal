# WC26Dash — Component Map (prototype → React)

> The bridge from `docs/prototype.html` to the real React app.
> Build top-to-bottom; MVP components first, then the v2 (flex) layer.

---

## Component tree

```
<App>
├─ <TopBar>
│   ├─ <Brand/>                  WC26▮TERMINAL
│   ├─ <Nav/>                    Live · Upcoming · Groups · Scorers · Bracket (scroll-active)
│   └─ <ThemeSwitcher/>          Dark / Light
├─ <NewsTicker/>                 auto-scroll marquee
├─ <HappeningNow>
│   ├─ <LiveMatchCard/> ×n       neon-green card
│   │   ├─ <WinProbBar/>         (v2)
│   │   └─ <ScorerLine/>
│   └─ <LiveEmptyState/>         shows when 0 live
├─ <FilterBar/>                  Team · Location · Clear  → writes shared filter state
├─ <Upcoming>
│   ├─ <MatchCountPill/>         "{n} matches remaining" (reads filter)
│   └─ <FixtureRow/> ×n
│       └─ <Countdown/>          1H 08M, ticks client-side
├─ <RecentResults>
│   └─ <ResultRow/> ×n
├─ <ScorersAndAssists>
│   └─ <LeaderboardPanel/> ×2    Top Scorers / Top Assists
│       └─ <ShowMoreToggle/>     top 10 ⇄ top 20
├─ <GroupStandings>
│   └─ <GroupCard/> ×12
├─ <ThirdPlaceRace/>
├─ <Bracket>
│   └─ <BracketColumn/> ×5  →  <MatchBox/> | <PlaceholderBox/>
└─ <Credit/>
```

---

## Component map

| Component | Prototype block | Key props | Data source | Phase |
|---|---|---|---|---|
| `TopBar` | `.topbar` | — | — | MVP |
| `Nav` | `.nav` + scrollspy JS | `sections[]`, `activeId` | — | MVP |
| `ThemeSwitcher` | `.theme-ctrl` + `body.light` | `theme`, `onChange` | — | MVP |
| `NewsTicker` | `.newsbar` / `.news-track` | `items: NewsItem[]` | ESPN `/news` | MVP |
| `HappeningNow` | `#live` + `.live-grid` | `matches: Match[]` (status=live) | scoreboard | MVP |
| `LiveMatchCard` | `.live-card` | `match: Match` | scoreboard | MVP |
| `WinProbBar` | `.wp` | `home%`, `draw%`, `away%` | Polymarket | **v2** |
| `ScorerLine` | `.scorers-line` | `goals: Goal[]` | match `/summary` | MVP |
| `LiveEmptyState` | `#liveEmpty` | `visible` | derived | MVP |
| `FilterBar` | `.filterbar` | `teams[]`, `locations[]`, filter state setters | derived from fixtures | MVP |
| `MatchCountPill` | `.matchcount` | `count` | derived | MVP |
| `Upcoming` / `FixtureRow` | `.up-row` | `match: Match` | scoreboard | MVP |
| `Countdown` | `.cd` + `fmt()` | `kickoffUTC` | client clock | MVP |
| `RecentResults` / `ResultRow` | `.res-row` | `match: Match` | scoreboard | MVP |
| `ScorersAndAssists` | `.sa-grid` | — | — | v2 |
| `LeaderboardPanel` | `.panel` (scorers/assists) | `rows: Leader[]`, `metric` | ESPN leaders/stats* | v2 |
| `ShowMoreToggle` | `.show-more` | `expanded`, `onToggle` | — | v2 |
| `GroupStandings` / `GroupCard` | `.groups` / `.gcard` | `group: GroupStanding` | **computed** `standings.ts` | MVP |
| `ThirdPlaceRace` | `.trace` | `rows: StandingRow[]` | **computed** | v2 |
| `Bracket` / `BracketColumn` | `.bracket-cols` / `.bk-col` | `round`, `slots[]` | **computed** `bracket.ts` | MVP (R32) |
| `MatchBox` / `PlaceholderBox` | `.m32` / `.mph` | `slot: BracketSlot` | computed | MVP |
| `Credit` | `.credit` | — | static | MVP |

\* Top scorers/assists: confirm whether ESPN exposes a tournament leaders endpoint; otherwise aggregate from match `/summary`. Mark as v2 if it needs aggregation.

---

## State & data architecture

- **One normalization seam:** `src/lib/espn.ts` turns ESPN's shape into the normalized model (`Team`, `Match`, `Goal`, `StandingRow`, `GroupStanding`, `BracketSlot`). Everything else is source-agnostic — this is what lets F1 reuse the engine by swapping in `openf1.ts`.
- **Polling:** `usePolling(endpoint, intervalMs)` — 10s when any match is live, 60s otherwise. Feeds all sections from one fetch of the cached data function.
- **Computed, not fetched:** `standings.ts` (group tables from results), `bracket.ts` ("as it stands" R32 + best-thirds slotting). No standings/bracket API calls.
- **Shared filter state:** a `FilterContext` (or a `useFilter` store) holds `{ team, location }`, mutually exclusive. `FilterBar` writes it; `Upcoming`, `RecentResults`, and the two `LeaderboardPanel`s read it and filter their rows; `MatchCountPill` reads the filtered upcoming count. This is the clean version of the class-toggling the prototype does in vanilla JS.
- **Theme:** a `theme` value toggling a `light` class/attribute on the root; tokens already defined as CSS variables in the prototype.
- **Resilience:** if the data function errors, render bundled `public/schedule.json` + the "live updates paused" banner.

---

## Suggested file structure

```
src/
├─ lib/        espn.ts · standings.ts · bracket.ts · types.ts
├─ hooks/      usePolling.ts · useFilter.ts
├─ context/    FilterContext.tsx · ThemeContext.tsx
├─ components/ TopBar/ NewsTicker/ HappeningNow/ FilterBar/ Upcoming/
│              RecentResults/ ScorersAndAssists/ GroupStandings/
│              ThirdPlaceRace/ Bracket/ Credit/
├─ styles/     tokens.css (the CSS variables from the prototype)
└─ App.tsx
api/ (or functions/)
└─ data.ts     ESPN proxy + ~10s cache
public/
└─ schedule.json · og-image.png
docs/
└─ prototype.html · COMPONENTS.md · PLAN.md
```

---

## Kickoff prompt for Claude Code

> "Read `CLAUDE.md`, `docs/prototype.html`, and `docs/COMPONENTS.md`. Scaffold a Vite + React + TypeScript + Tailwind app. Port the CSS variables from the prototype into `styles/tokens.css`. Build the MVP components from the map, starting with the data layer (`espn.ts`, types, `usePolling`) and the `data.ts` proxy, then `HappeningNow` and `Upcoming`. Match the prototype's look exactly. Don't build v2 (win %, Monte Carlo, scorers/assists) until the MVP renders live ESPN data."
