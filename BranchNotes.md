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