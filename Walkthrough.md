# Correlations Tool — Walkthrough Notes

## What I built and why

The spec said to make tradeoffs and focus — so I focused on **architecture over features**.
The live Bitwise tool already shows what the feature set looks like.
What I wanted to demonstrate was how I'd build it to last.

---

## Folder structure

```
app/
├── lib/
│   ├── correlationTypes.ts        # Single source of truth for all API + UI types
│   ├── assetHelpers.ts            # Request building, validation, date logic, window math
│   └── chartHelpers.ts            # Color scale, data merging, formatting
│
├── hooks/
│   ├── useCorrelation.ts          # Fetch lifecycle — idle/loading/success/stale/error
│   ├── useSearch.ts               # Generic filtered search — works on any list
│   ├── useAssetSearch.ts          # Asset-specific wrapper over useSearch
│   ├── useQueryParams.ts          # URL state via nuqs
│   ├── useComboboxState.ts        # Shared keyboard/open/index state for both comboboxes
│   └── useOnboardingStep.ts       # Derives 1 | 2 | 3 from params
│
├── components/
│   ├── ui/
│   │   ├── Combobox.tsx           # Single-select, full keyboard nav + ARIA
│   │   ├── MultiCombobox.tsx      # Multi-select, chips, backspace-to-remove
│   │   └── Badge.tsx              # TypeBadge, Spinner, Tooltip
│   │
│   ├── correlation/
│   │   ├── AssetSelector.tsx      # Wraps Combobox with asset rendering
│   │   ├── ControlPanel.tsx       # Sidebar — selectors + step-driven glow + run button
│   │   ├── TimeControls.tsx       # Preset pills + custom date expander
│   │   ├── WindowScrubber.tsx     # Rolling window slider — constrained to date range
│   │   ├── WarningBanner.tsx      # Non-fatal per-asset data warnings
│   │   └── ResultsPanel.tsx       # Status-driven results with dynamic chart imports
│   │
│   └── charts/
│       ├── CorrelationHeatmap.tsx
│       └── RollingCorrelationChart.tsx
│
└── page.tsx                       # ~70 lines — orchestration only, no business logic
```

The rule: `ui/` doesn't know what `correlation/` is. `correlation/` doesn't know what `charts/` renders. `page.tsx` doesn't call `fetch()`. Each layer has one job.

---

## Decisions worth talking through

### URL state via nuqs
Every input — designated ticker, comparisons, date range, rolling window — lives in the URL. `useQueryParams` was originally ~130 lines of manual `URLSearchParams` wrangling. Replaced with `nuqs`, which handles serialization, batching, and `router.replace` for App Router. Shareable URLs are a product feature, not an afterthought. Anyone with the link sees the same configured analysis.

### Status as a proper union
The fetch state is typed as `"idle" | "loading" | "success" | "stale" | "error"`. Stale is a first-class state — when the user changes params after a successful run, the old results stay visible but flagged. A previous version used `as any` to cast `"stale"` in. That's gone.

### Rolling window constrained to date range
The API rejects requests where the rolling window exceeds the date range — `"Date range must be greater than rolling window"`. Rather than surfacing that as an API error, `maxRollingWindow(startDate, endDate)` computes the ceiling in `assetHelpers` using a conservative calendar-to-trading-days multiplier (0.65). `validateParams` enforces this client-side. The `WindowScrubber` receives `maxWindow` as a prop and clamps its input `max` accordingly — the error state is structurally unreachable.

### Shared combobox state
`Combobox` and `MultiCombobox` were duplicating ~80% of the same logic: keyboard navigation, outside-click handler, scroll-active-into-view. That's now in `useComboboxState`. Both components consume it. One place for keyboard bugs to live, and to be fixed.

### Generic search
`useAssetSearch` was hardwired to `AssetOption`. The filtering logic — query threshold, exclude set, result cap, dataset switching — is not domain-specific. `useSearch<T>` takes a `filterFn` and `getKey` and works on any list. `useAssetSearch` is now a 15-line wrapper.

### Progressive onboarding highlight
`useOnboardingStep(params)` returns `1 | 2 | 3` based on whether designated and comparisons are filled. Step 1: lime glow on the Designated selector. Step 2: glow moves to Comparisons. Step 3: time controls and Run button activate. No separate state, no tutorial copy — derived entirely from whether required fields are filled.

### buildMatrixLookup — floating point fix
The original identified which matrix row belonged to which symbol by finding the cell where `value === 1.0` (self-correlation). Floating point can return `0.9999999` and silently drop a row. The lookup now uses the symbol index from `getMatrixSymbols` — we already know the order, so we use it.

### Dynamic chart imports
Both charts are lazy-loaded via `next/dynamic` with `ssr: false`. Recharts uses browser APIs that don't exist at SSR time. Loading happens in parallel with the API response — in practice the API takes longer than the bundle.

### DefaultAssets / AllAssets
Dropdowns load the curated default list immediately. Typing triggers a search across all assets. This avoids rendering 500+ items on first open while still making the full asset list accessible.

---

## What I'd do next

**`next/font` for DM Sans and JetBrains Mono** — currently loading from Google Fonts at runtime. `next/font` self-hosts them, eliminates the render-blocking request, and removes layout shift.

**Asset inception date enforcement in the date picker** — `inceptionDate` exists on `AssetOption` and is already used in validation. The date inputs should reflect it as a `min` attribute that updates as the asset selection changes, so users see the constraint at the input level.

**Annotation layer on the rolling chart** — the chart shows how correlations change over time but gives no context for why. Togglable overlays for major market events (COVID crash, FTX collapse, Fed rate cycles) would make it meaningfully more useful for the audience this tool serves.

**Analytics on `handleRun`** — which asset pairs get selected most often is direct signal for what to surface in defaults. One event call, high value.

**`as const satisfies AssetOption[]` on `_data/assets.ts`** — the scaffold types `type` as `string`. Adding this annotation removes the casts in `useAssetSearch` and `useQueryParams` and gives strict types all the way through.