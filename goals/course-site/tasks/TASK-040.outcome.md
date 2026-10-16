# TASK-040 outcome

Status: delivered. Chapter 15 passes all local acceptance requirements.

## Acceptance

- [x] `npm test` passes, including `tests/capitulo15.test.ts`: **1061 tests in 31 files**, exit 0. The nine new chapter tests cover all numeric examples, frontmatter numbers, simulator inputs and identities, lag-one autocorrelation, overlapping variance-ratio conventions, five-session momentum with 0.10 % switching costs, simple versus log returns, and all stated event-window values. Hand calculations and validation failures also cover the new price-to-simple-return helper.
- [x] `npm run build` passes: **0 errors across 113 files**, **19 pages built**, exit 0. `/chapters/15-eficiencia/` is generated. Playwright receives HTTP 200 and verifies all six rendered section tags in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen. Frontmatter requires chapter 11 and keeps `sessions: []`.
- [x] `npm run screenshots 15` passes, exit 0. All four dark/light × desktop/phone images are clean: no browser-console errors, KaTeX errors or horizontal overflow. Reviewed the full-page images and enlarged widget images in both themes; controls and readouts fit on phones. Files: `screenshots/chapters_15-eficiencia-{dark,light}-{desktop,phone}.png` (generated, not committed).
- [x] `npm run clickthrough:cap15` passes, exit 0, with **1484 readout comparisons** against `efficiency.ts` and `eventStudy.ts`. Tests both widgets at 1280 px and 360 px in both themes. Exercises both series, all eight sliders, boundary values, zero persistence, costs, lookback, variance-ratio horizon, re-roll, reset, keyboard controls, crossed event-window endpoints, and wrong/right quiz answers. No console, KaTeX or overflow errors.
- [x] No claim contradicts `docs/AUDIT.md`. Reviewed the chapter against the audit and house notation. The chapter distinguishes risk-adjusted evidence from raw wealth, efficiency from the independent-increment simulation, and CAR from compounding. Added a section-2 audit entry for note 08 §3.1's positive-only abnormal-return definition. Regression test “audit note 08 §3.1” checks positive, zero and negative residuals. No third-party slides or case content is reproduced.

## Summary

**What.** Added the Spanish chapter with six ordered sections, three quizzes, an original seeded random-walk versus persistent-return widget, and the reused `EventWindow`. Added notation rows and `clickthrough:cap15`.

**How.** `EfficiencyDemo` calls only `efficiency.ts` for finance calculations. Both paths use the same seeded shocks. Diagnostics use log returns; momentum wealth uses simple returns. The text states the cash, cost, risk, finite-sample and event-study limits explicitly. Empirical discussion is qualitative; simulations are identified as fictional examples.

**Deviations.** Added the small `simpleReturns` library helper to avoid implementing a return formula inside the widget. No other library behavior changed. No material decision or missing access/data blocked delivery.

**Verified revision.** `27d447933e6e6a297c697f72162bde3394fac996` (implementation `1be61eb` plus conflict-free merge of `origin/main` at `46d56c4d7f8dbb73e7f4c4745945d733a281b8aa`). The following outcome-only commit does not change tested code. All four Verify commands were rerun sequentially after that merge. GitHub Actions and PR build checks were excluded under the explicit owner rule; readiness is based on local verification.

**Proposed follow-ups.** None needed for this task. PS4 remains for M-5.

Sequential verification on 2026-10-16:

```sh
npm test
npm run build
npm run screenshots 15
npm run clickthrough:cap15
```

Evidence from the run:

```text
 Test Files  31 passed (31)
      Tests  1061 passed (1061)
Result (113 files):
- 0 errors
[build] 19 page(s) built
[build] Complete!
✓ chapters_15-eficiencia-dark-desktop.png
✓ chapters_15-eficiencia-dark-phone.png
✓ chapters_15-eficiencia-light-desktop.png
✓ chapters_15-eficiencia-light-phone.png
```

Final tail (all commands exited 0):

```text
✓ light 360px: start = 1 matches eventStudy.ts
✓ light 360px: post-announcement window matches eventStudy.ts
✓ 1484 library readout comparisons; both widgets, all eight sliders, bounds, crossed windows, seeds, reset, keyboard, quizzes and six sections pass; no console, KaTeX or overflow errors
TASK-040 verification exit=0
```
