# Correlation Tool

A tool built for Bitwise Asset Management. The goal: visualize rolling Pearson correlations between stocks, ETFs, and crypto assets over a configurable time window.

Visual reference: (https://correlation-calculator-theta.vercel.app/)

---

## What It Does

Pick a designated asset. Pick up to five comparison assets. Pick a time range. The tool returns two views:

- **Rolling correlation chart** — one line per comparison asset, showing how the correlation against the designated asset has changed over time. Lines are individually toggleable.
- **Correlation heatmap** — an NxN matrix showing the correlation between every asset pair in the selection, colored on a red-to-lime scale.

The full state — assets, date range, rolling window — lives in the URL. Every analysis is shareable with a single copy-paste.

---

## Stack

- **Next.js 14 App Router** — file-based routing, server components where it made sense
- **TypeScript** — strict throughout
- **Tailwind CSS v3** — utility-first, no component library
- **Recharts** — line chart and custom heatmap cells
- **nuqs** — type-safe URL state management (replaced ~130 lines of manual `URLSearchParams` wrangling)
- **lucide-react** — icons

---

## Architecture

The project is organized around three layers with a strict separation of concerns.

```
app/
├── page.tsx                         # Orchestration only — no business logic
components/
├── charts/
│   ├── CorrelationHeatmap.tsx       # Recharts-powered NxN heatmap
│   └── RollingCorrelationChart.tsx  # Multi-line rolling correlation
├── correlation/
│   ├── AssetSelector.tsx            # Designated + comparison selectors
│   ├── ControlPanel.tsx             # Sidebar — assets + run button
│   ├── TimeControls.tsx             # Preset pills + custom date expander
│   ├── WindowScrubber.tsx           # Rolling window drag control
│   ├── ResultsPanel.tsx             # Chart layout + empty/loading states
│   └── WarningBanner.tsx            # Non-fatal per-asset data warnings
└── ui/
    ├── Combobox.tsx                 # Single-select, fully accessible
    ├── MultiCombobox.tsx            # Multi-select with chips
    └── Badge.tsx                    # TypeBadge, Spinner, Tooltip
hooks/
├── useQueryParams.ts                # URL state via nuqs
├── useCorrelation.ts                # Fetch lifecycle (idle/loading/success/stale/error)
├── useSearch.ts                     # Generic filtered search
├── useAssetSearch.ts                # Asset-specific wrapper over useSearch
├── useComboboxState.ts              # Shared keyboard/open/active state for both comboboxes
└── useOnboardingStep.ts             # Derives setup progress from params (1 | 2 | 3)
lib/
├── correlationTypes.ts              # All shared types — one source of truth
├── assetHelpers.ts                  # Request building, validation, date math
└── chartHelpers.ts                  # Color scale, formatting, data transformation
```

### Key decisions

**URL as the state layer.** All user selections are serialized to URL params via `nuqs`. This gives shareable analyses for free, handles browser back/forward correctly, and means there's no global state to manage. The hook reads typed params and exposes typed setters — the rest of the app never touches `URLSearchParams` directly.

**`CorrelationStatus` as a proper union.** The fetch state is typed as `"idle" | "loading" | "success" | "stale" | "error"`. Stale is a first-class state — when the user changes params after a successful run, the old results stay visible but the UI signals they're outdated. This is more honest than clearing results on every input change.

**`useComboboxState` as a shared primitive.** `Combobox` and `MultiCombobox` were sharing ~80% of the same code — keyboard navigation, outside-click handler, scroll-active-into-view, dropdown markup. That logic now lives in one hook. Both components consume it. One place to fix keyboard bugs.

**`useSearch` as a generic hook.** The asset search behavior (filter by query, switch between default and full dataset at a character threshold, exclude already-selected items, cap results) is not asset-specific. `useSearch` takes a `filterFn` and `getKey` and works on any list. `useAssetSearch` is a 15-line wrapper.

**`buildMatrixLookup` fixed for floating point.** The original approach identified which row belonged to which symbol by finding the cell where `value === 1.0` (self-correlation). Floating point arithmetic can return `0.9999999`. The lookup now uses the index from `getMatrixSymbols` — we already know the symbol order, so we use it.

**Charts are loaded dynamically with `ssr: false`.** Recharts uses browser APIs that don't exist at SSR time. Both chart components are wrapped in `next/dynamic` to prevent hydration errors without the workarounds that were otherwise required.

**Progressive onboarding highlight.** A `step: 1 | 2 | 3` value is derived from params in `useOnboardingStep` and passed through the component tree. Step 1 glows the Designated selector. Step 2 glows the Comparison selector. Step 3 glows the Run button. No tutorial copy, no separate state, no timeout — derived entirely from whether the user has filled in the required fields.

---

## Tradeoffs

**`isStale` lives in `page.tsx` instead of `useCorrelation`.** Staleness is a UI concern — "the user changed something since the last run." The hook's job is to manage the fetch lifecycle. Keeping them separate means the hook is simpler and more reusable.

**`nuqs` adds a dependency.** It's 130 lines of URL wrangling replaced by a well-maintained, App Router-native library with TypeScript-first APIs. The tradeoff is worth it for any tool where shareable state is a first-class feature. The `NuqsAdapter` in `layout.tsx` is the only integration point.

**Recharts over VISX.** VISX gives more control at the cost of more code. Recharts gets a production-quality line chart and heatmap to the finish line faster, and the custom cell rendering it allows is enough for the heatmap's color scale and hover interactions. For a more complex charting surface, VISX would be the right call.

**Rolling window drag fires the API only on `pointerUp`.** The visual scrubber updates on every tick for responsiveness. The actual API call fires when the user releases. Firing on every tick would hammer the backend with requests mid-drag.

**Max five comparison assets.** This is a backend constraint (`compareSymbol` + up to 5 comparisons = 6 total assets). The UI enforces it at the input level — the search field hides itself when the limit is reached rather than showing a validation error on submit.

---

## Enhancements

Given more time, in rough priority order:

**Saved analyses.** The URL state is already shareable. The natural next step is named bookmarks — save a specific set of assets and a date range with a label, persist to `localStorage` or a backend, surface them in the sidebar. Useful for users who check the same correlations regularly.

**Asset inception date enforcement in the date picker.** The `inceptionDate` field on `AssetOption` exists and is already used in validation. The date inputs should use it as a `min` attribute and update dynamically as the asset selection changes, so users get feedback at the input level instead of at submit.

**Annotation layer on the rolling correlation chart.** The chart shows how correlations change over time but gives no context for *why*. An annotation layer — togglable overlays for major market events (COVID crash, FTX collapse, Fed rate cycles) — would make the chart meaningfully more useful for the audience this tool serves.

**Expanded asset universe.** The current implementation supports the 25 hardcoded crypto symbols and any valid Yahoo Finance ticker for stocks and ETFs. A real implementation would integrate a ticker search API so users aren't limited to `DefaultAssets` and `AllAssets` — they could type any symbol and get live validation.

**Correlation change alerts.** A watch mode: user sets a correlation threshold for a pair, gets notified when the rolling value crosses it. Straightforward to implement once there's a backend for user state.

---

## Running Locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # verify production build — no env variables required
```
