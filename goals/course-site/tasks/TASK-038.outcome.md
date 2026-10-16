# TASK-038 outcome

## Acceptance

- [x] `npm test` passes, including `tests/capitulo13.test.ts` covering every number in the text. Evidence: 31 test files, 1061 tests passed. The new file verifies book levels, fills, costs, margin and short-sale accounts, thresholds, quiz examples and source corrections. Its automatic numeric inventory rejects unverified literals in prose, quizzes and formulas.
- [x] `npm run build` passes and `/chapters/13-negociacion/` renders the six sections in order. Evidence: `astro check` reports 0 errors and 0 warnings; 19 pages built, including the chapter. Playwright requests the built route with HTTP 200 and asserts Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen in all four theme/viewport combinations. Deployment uses the configured `/economia-financiera` base.
- [x] `npm run screenshots 13` is clean. Evidence: `chapters_13-negociacion-{dark,light}-{desktop,phone}.png` all report ✓, with no console, KaTeX or horizontal overflow errors. Both widget images were also inspected in both themes at 1280 px and 360 px. Controls and readouts are readable.
- [x] `npm run clickthrough:cap13` exercises both widgets and compares their readouts with library values. Evidence: 1020 comparisons against `markets.ts` pass across dark/light × 1280/360 px. Coverage includes buys/sells, market/limit orders, no fills, partial fills, exhausted depth, remaining books, commissions, implicit costs, both account modes, both sides of call thresholds, exact long-threshold equality, slider endpoints, keyboard input, resets and all three quizzes, including retry paths.
- [x] No claim contradicts `docs/AUDIT.md`. Evidence: note 05 §3 and PS4 exercises 1–3 reviewed against the audit and TASK-035 outcome. Chapter uses original examples and corrected order terminology; two appended section-2 audit entries have regression tests. The short-sale example accounts for dividend compensation and distinguishes gross trading gain from net profit. No third-party slides or case content used. `sessions: []` remains intentional because PS4 is not published.

## Summary

**What.** Added a Spanish chapter of about 2000 words, two interactive widgets, original numerical examples and three quizzes. Added `clickthrough:cap13`, chapter tests and notation rows.

**How.** Financial calculations use `src/lib/finance/markets.ts`. The small library additions expose short-account assets after dividends and implement a static price-priority `limitOrder` using the existing market-order engine. The order widget shows the remaining book and explicit/implicit costs; each submission starts from the initial book. The account widget shows the current margin and both maintenance/price threshold lines. Its curve is explicitly restricted to positive prices so the plot sampler cannot send invalid prices to the finance library. Controls meet the 44 px touch-height convention.

**Plan.** Follow the six-section template; implement the two library-backed widgets; verify original examples and audited corrections; merge `origin/main`; run all four task commands; record evidence and make the PR ready.

**Deviations and limits.** No scope deviations. The small limit-order addition was necessary because TASK-035 only exposed market orders. The book is static, without later arrivals, time priority or hidden liquidity. Account controls show a period-end snapshot; they do not simulate prior liquidations. These assumptions are stated in the chapter. Interest and dividend compensation are included; account commissions, taxes and stock-borrow fees are omitted explicitly.

**Verified revision.** `5ce9df81ffb0ab5310d5ba1112d22aad695b3844`, after merging `origin/main` without conflicts. This outcome-only commit follows it. No task specs, other task outcomes, decisions or goal configuration were edited. The final command chain below exited 0:

```sh
npm test && npm run build && npm run screenshots 13 && npm run clickthrough:cap13
```

Tail evidence from the final run:

```text
Test Files  31 passed (31)
     Tests  1061 passed (1061)
[build] 19 page(s) built in 1.96s
[build] Complete!
✓ chapters_13-negociacion-dark-desktop.png
✓ chapters_13-negociacion-dark-phone.png
✓ chapters_13-negociacion-light-desktop.png
✓ chapters_13-negociacion-light-phone.png
✓ 1020 readouts compared with markets.ts; six sections in order; no console, KaTeX or overflow errors
```

**Readiness.** All required local checks pass. GitHub Actions and the PR build check are ignored under the explicit owner override; they were not read or used as a gate. PR #34 targets `main` and carries `goal:course-site` and `Goal-Task: course-site/TASK-038`. It is made ready after this outcome is pushed. Never merged.

**Proposed follow-ups.** None required. The future PS4 session can reuse the account and order functions.
