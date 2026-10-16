# TASK-044 outcome

## Acceptance

- [x] `npm test` passes, including `tests/capitulo17.test.ts` covering every number in the chapter. Final combined verification on `3b5de7d27f15d4214c8dcc2e2eee19ff26d6a17b` exited 0: **37 files, 1203 tests passed**. The 11 new chapter tests check metadata, the complete cash-flow table, price/YTM examples, settlement dates and day counts, clean/dirty prices, numerical quiz choices, nominal/effective conversion, the source correction, and a numerical-token inventory. Boundary grids also cover the widget's zero coupon, zero yield, shortest/longest maturity and earliest/latest settlement, plus invalid helper inputs.
- [x] `npm run build` passes. Astro reported **0 errors, 0 warnings, 0 hints** and built **23 pages**, including `/chapters/17-bonos/` (under the configured `/economia-financiera` base). Playwright returned HTTP 200 and asserted the six section tags in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen.
- [x] `npm run screenshots 17` is clean. All four dark/light × desktop/phone images passed with no browser console errors, KaTeX errors or horizontal overflow. Inspected all four images. Output: `screenshots/chapters_17-bonos-{dark,light}-{desktop,phone}.png` (generated, ignored by git).
- [x] `npm run clickthrough:cap17` passes. **532 readout comparisons against bonds.ts**, dark/light × 1280/360 px. Tests all four sliders, endpoints, keyboard interaction, reset, all three quizzes with incorrect/retry/correct paths, the derivation panel, HTTP 200 and section order. No browser console, KaTeX or overflow errors.
- [x] No chapter claim contradicts `docs/AUDIT.md`. Read §2 and PS4 Ex 6/9 before writing. The original example uses annual payments and explicit Actual/Actual coupon-period settlement. PS4's month-fraction results remain unchanged. Added a §2 note and regression showing 59/89 actual days versus PS4's stipulated 2/3; this explains differing accrued amounts without replacing the audited PS4 answers. Existing bond audit regressions also pass in `npm test`.

Final command sequence (one `sh -ec` invocation; stopped on any failure):

```sh
npm test
npm run build
npm run screenshots 17
npm run clickthrough:cap17
```

Verification excerpts and final tail:

```text
 Test Files  37 passed (37)
      Tests  1203 passed (1203)
- 0 errors
- 0 warnings
- 0 hints
17:57:41 [build] 23 page(s) built in 2.23s
✓ chapters_17-bonos-dark-desktop.png
✓ chapters_17-bonos-dark-phone.png
✓ chapters_17-bonos-light-desktop.png
✓ chapters_17-bonos-light-phone.png
✓ dark 1280px: four sliders, endpoints, keyboard, reset, three quizzes, derivation and six sections
✓ dark 360px: four sliders, endpoints, keyboard, reset, three quizzes, derivation and six sections
✓ light 1280px: four sliders, endpoints, keyboard, reset, three quizzes, derivation and six sections
✓ light 360px: four sliders, endpoints, keyboard, reset, three quizzes, derivation and six sections
✓ 532 readouts match bonds.ts; no console, KaTeX or overflow errors
VERIFY_EXIT=0
```

## Summary

Added an original Spanish chapter in the house template (about 1880 words), one accessible price–yield explorer, and three quizzes. The widget imports all finance calculations from `bonds.ts`. A small `bondAtSettlement` helper shifts the regular payment calendar from the last coupon to the settlement date and calculates accrued coupon through the existing Actual/Actual implementation. The widget displays the dirty price curve, face-value reference, coupon, settlement date, accrued coupon, clean/dirty prices and recovered YTM. A shared data file provides the original example. Appended notation rows, the source correction, and the `clickthrough:cap17` command. Kept `sessions: []` as specified.

Implementation revision verified: `3b5de7d27f15d4214c8dcc2e2eee19ff26d6a17b`. Merged `origin/main` before delivery; no conflicts. This outcome is a documentation-only follow-up commit. PR: https://github.com/jesusvillota/economia-financiera/pull/41 into `main`, label `goal:course-site`, marker `Goal-Task: course-site/TASK-044`. No merge performed. No task specs, other tasks, decisions or goal configuration were edited. No scope deviations, material decisions or proposed follow-ups.

All required local verification commands pass. GitHub Actions and the PR build check are ignored under the owner's explicit override. Node emitted its existing experimental type-stripping warning; browser error checks remained clean. No external-site or deployment verification was required.
