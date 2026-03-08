# feat/lib-foundation

## feat: lib foundation — types, asset helpers, chart helpers

Establishes the pure TypeScript layer that everything else builds on.

| File | Purpose |
|------|---------|
| `correlationTypes.ts` | Single source of truth for API shapes and UI state |
| `assetHelpers.ts` | Request building, validation, date utilities |
| `chartHelpers.ts` | Data transformation, color scale, formatting |

No React. No side effects. Every function here is independently testable.

> **Reviewers:** `validateParams` is where all business rules live — that's the right place to look when requirements change (min range, max assets, inception dates, etc).

---

## Commits

### `feat(lib): add correlation types`
**WHY:** Shared types across hooks, components, and API layer need a single source of truth — no divergence between what the API returns and what the UI expects.

**DECISION:** `CorrelationParams` is separate from `CorrelationRequest` — UI state shape != API shape, and the mapping should be explicit.

**TRADEOFF:** Slightly more files than inlining types. Worth it the moment a second engineer touches this.

---

### `feat(lib): add asset helpers`
**WHY:** `assetToCompareType` and `splitSymbols` were inline in the component — any second usage would duplicate the logic.

**DECISION:** `validateParams` lives here, not in the hook or the component — validation is a business rule, not a UI concern.

**TRADEOFF:** Inception date enforcement means `ControlPanel` needs to derive its date min from the selected assets. Wires up in the components branch.

---

### `feat(lib): add chart helpers`
**WHY:** `mergeTimestampSeries` and color interpolation were inline in the chart components — untestable and non-reusable.

**DECISION:** `buildMatrixLookup` converts the matrix array once on render, not on every cell — O(n) setup vs O(n²) repeated scans.

**TRADEOFF:** `formatCorrelation` and `formatCorrelationPrecise` are two functions instead of one with a param — easier to read at callsites.



# feat/use-correlation

## feat: hooks — useCorrelation, useAssetSearch, useQueryParams

Pulls all logic out of components. `page.tsx` calls hooks, reads state, passes data down. No fetch logic or search logic lives in any component.

| File | Purpose |
|------|---------|
| `useCorrelation.ts` | API fetch, loading/error/success state, typed response |
| `useAssetSearch.ts` | DefaultAssets/AllAssets switching, query filtering, exclude list |
| `useQueryParams.ts` | Read/write all correlation params to URL search params |

> **Reviewers:** `useQueryParams` is why sharable URLs come for free — state lives in the URL, not in component state. Changing any input updates the URL immediately via `router.replace`.

---

## Commits

### `feat(hooks): add useCorrelation`
**WHY:** `page.tsx` should never call `fetch()` directly — API concerns belong in a hook.

**DECISION:** Status enum (`idle | loading | success | error`) over separate `isLoading`/`isError` booleans — impossible states become impossible types.

**TRADEOFF:** `markStale` extends status beyond the declared type for now — will tighten when `CorrelationState` gets a `stale` variant in the types file.

---

### `feat(hooks): add useAssetSearch`
**WHY:** Both combobox components need identical search logic — one hook, two consumers.

**DECISION:** `DefaultAssets` on open, `AllAssets` on keystroke — intentional perf tradeoff, avoids rendering the full list until needed.

**TRADEOFF:** `SEARCH_THRESHOLD=1` means one character triggers `AllAssets` — feels snappy, acceptable since `AllAssets` is in-memory, not a network call.

---

### `feat(hooks): add useQueryParams`
**WHY:** Sharable URLs are a product feature — anyone with the link should see the same configured analysis.

**DECISION:** `router.replace` over `router.push` — config changes shouldn't pollute browser history, only intentional navigations should.

**TRADEOFF:** Asset lookup requires `AllAssets` to be in-memory at module level — acceptable since it's static data, not a fetch.

---

### `fix(hooks): cast AllAssets entries to AssetOption in useQueryParams`
**WHY:** `AllAssets` in `_data/assets.ts` types `type` as `string`, not the literal union `"stock" | "etf" | "trust" | "crypto"` — TypeScript rejects the `Map` constructor call without a cast.

**DECISION:** Cast at the callsite (`a as AssetOption`) rather than modifying the scaffold's data file — keeps the fix local and avoids touching files outside our scope.

**TRADEOFF:** If `assets.ts` is ever updated to use `as const satisfies AssetOption[]`, this cast becomes redundant but harmless. The cleaner long-term fix is `as const satisfies AssetOption[]` on the export — tracked as a follow-up.