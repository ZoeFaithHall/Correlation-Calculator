# Correlations Tool — Walkthrough Notes

## What I built and why

The spec said to make tradeoffs and focus — so I focused on **architecture over features**.
The live Bitwise tool already shows what the feature set looks like.
What I wanted to demonstrate was how I'd build it to last.

---

## Folder structure

```
app/
├── lib/              # Pure TypeScript — no React, no side effects
│   ├── correlationTypes.ts   # Single source of truth for API + UI types
│   ├── assetHelpers.ts       # Request building, validation, date logic
│   └── chartHelpers.ts       # Color scale, data merging, formatting
│
├── hooks/            # Logic layer — no rendering
│   ├── useCorrelation.ts     # Fetch, loading/error/success state
│   ├── useAssetSearch.ts     # DefaultAssets/AllAssets switching + filtering
│   └── useQueryParams.ts     # URL state — read/write all params
│
├── components/
│   ├── ui/           # Primitives — no domain knowledge
│   │   ├── Combobox.tsx       # Single-select, full keyboard nav + ARIA
│   │   ├── MultiCombobox.tsx  # Multi-select, chips, backspace-to-remove
│   │   └── Badge.tsx          # TypeBadge, Spinner, Tooltip
│   │
│   ├── correlation/  # Domain components — know about assets + correlation
│   │   ├── AssetSelector.tsx  # Wraps Combobox with asset rendering
│   │   ├── ControlPanel.tsx   # All inputs, validation, run button
│   │   ├── WarningBanner.tsx  # Non-fatal API warnings, dismissible
│   │   └── ResultsPanel.tsx   # Status-driven results with dynamic chart imports
│   │
│   └── charts/       # Visualization — takes data, renders it
│       ├── CorrelationHeatmap.tsx
│       └── RollingCorrelationChart.tsx
│
└── page.tsx          # ~60 lines — orchestration only
```

The rule: `ui/` doesn't know what `correlation/` is. `correlation/` doesn't know what `charts/` renders. `page.tsx` doesn't call `fetch()`. Each layer has one job.

---

## Decisions worth talking through

### URL state persistence
Every input — designated ticker, comparisons, date range, rolling window — lives in the URL via `useQueryParams`. Sharable URLs are a product feature, not an afterthought. Anyone with the link sees the same configured analysis.

### Validation before submission
The run button stays disabled with a specific reason shown. Validation runs on every param change via `validateParams` in `lib/assetHelpers`. No surprises on submission.

### Dynamic chart imports
Both charts are lazy-loaded via `next/dynamic` with `ssr: false`. Recharts adds ~150kb to the bundle and is never visible on initial load. The chart bundle loads in parallel with the API response — in practice, the API takes longer.

### Stale results banner
When inputs change after a successful run, a banner appears: "Re-run to update." Results stay visible but flagged. Clearing them silently would be more confusing.

### DefaultAssets / AllAssets
Dropdowns load the curated default list immediately. Typing triggers a search across all assets. This avoids rendering 500+ list items on first open while still making the full asset list accessible.

### isAnimationActive={false}
Recharts animations re-run on every state change. For financial data they add no analytical value and cost render performance. Off by default.

---

## What I'd do next

**`next/font` for DM Sans and JetBrains Mono** — currently loading from Google Fonts at runtime. `next/font` self-hosts them automatically, eliminates the render-blocking request, and removes layout shift.

**Analytics instrumentation** — which asset pairs get selected most often is direct input for what to surface in defaults. GA4 or Mixpanel events on `handleRun` would take an afternoon.

**`as const satisfies AssetOption[]` on `_data/assets.ts`** — the scaffold types `type` as `string`. Adding this export annotation would remove the casts in `useAssetSearch` and `useQueryParams` and give us strict types all the way through.

**Virtualized dropdown for AllAssets** — currently sliced to 24 results. If the asset list ever grows significantly, swapping the `<ul>` in `Combobox` for `react-window`'s `FixedSizeList` is a local change — the headless primitive makes it easy.

**Keyboard shortcut to run** — `Cmd+Enter` to submit. Small thing, high value for power users.