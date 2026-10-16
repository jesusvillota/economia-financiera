## Acceptance

- [x] `npm test` passes: 45 tests, 5 files, including new `tests/curves.test.ts` (VA/VF of flows vs `npv`, simple/compound growth, doubling time, rule of 72).
- [x] `npm run build` passes (`astro check`: 0 errors) and `/dev/widgets` is built with both components.
- [x] `npm run screenshots dev` is clean: 4/4 ✓ (dark/light × desktop/phone), no console or KaTeX errors, no overflow. Images checked by eye.
- [x] `npm run clickthrough:widgets` (Playwright) sets the rate slider and confirms the readouts equal `src/lib/finance/curves.ts` values: VA -5,60 €, VF -9,86 € (r = 12 %); simple 300,00 €, compuesto 672,75 €, duplicar 7,3 años (r = 10 %).

## Summary

- **What:** `CashFlowTimeline` (draggable arrow tips snapped to whole years and 10 €, rate slider, "Descontar a t = 0" tween, VA/VF readout) and `GrowthCurves` (simple vs compound, sliders r, n, k, shaded gap, doubling-time marker, rule of 72). Gallery at `/dev/widgets`, not linked from navigation.
- **How:** all maths in new `src/lib/finance/curves.ts` (reuses `timeValue.ts`); components use `PlotFrame`, `WidgetFrame`, `useTweened`, CSS variables.
- **Deviations:** `scripts/screenshots.mjs` now also visits `dist/dev/widgets/` so `npm run screenshots dev` has a page to check. Added `scripts/clickthrough-widgets.mjs` (+ npm script) rather than changing the existing slider click-through. The script imports the lib `.ts` through Node type stripping. Flows are not draggable while discounted (button toggles back).
- **Verified revision:** this branch's head commit.
- **Follow-ups:** none required.
