# TASK-028 outcome

Status: BLOCKED — GitHub account billing or spending limit prevents the build check from starting. All five task acceptance requirements pass locally.

## Acceptance

- [x] `npm test` passes, including a new chapter-7 test file covering every number in the text. Final post-rebase run: 615 tests passed in 21 files, exit 0. `tests/capitulo7.test.ts` adds eight tests for the input data, weighted return, covariance, variance terms, four correlations, zero-risk weights, minimum-variance portfolio, short-sale cancellation and the audit correction. Numeric quiz answers and playground readouts are included.
- [x] `npm run build` passes and `/chapters/07-dos-activos/` renders the six sections in order. Final run: Astro check reported 0 errors, 0 warnings and 0 hints; 11 pages built, exit 0. The Playwright script checked HTTP 200 and the exact order Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen in all four theme/viewport combinations.
- [x] `npm run screenshots 07` is clean. Final run: four successful images for dark/light × desktop/phone, exit 0; no console, KaTeX or horizontal overflow errors. All four full-page screenshots were visually inspected, plus widget close-ups on dark phone and light desktop. Screenshots are local ignored artifacts in `screenshots/`.
- [x] `npm run clickthrough:cap7` moves each widget and compares readouts with the library. Final run: 864 readout assertions match `portfolio.ts`, exit 0. It moves all four sliders, toggles short sales, checks clamping, drags the frontier point, uses keyboard input, and answers each quiz incorrectly and correctly. Runs at 1280 px and 360 px in both themes, opens the derivation, and checks browser errors, KaTeX and overflow.
- [x] No claim contradicts `docs/AUDIT.md`. The chapter follows note 03 §2, uses an original example, omits duplicate note 06, and qualifies diversification statements for positive weights. The newly found perfect-positive-correlation error with short sales is recorded in audit section 2 and covered by a regression test. The PS3 session does not exist yet, so `sessions: []` avoids an unavailable link. The notation table now includes portfolio standard deviation.
- [ ] Delivery checks pass or none are configured, and the PR is ready for review. GitHub's build check failed before starting due to account billing or spending limits. The PR remains open and draft as required.

## Summary

Added the Spanish chapter `src/content/chapters/07-dos-activos.mdx` with the six-section house template, three quizzes and an original A/B example: expected returns 6 % / 12 %, volatilities 10 % / 20 %, initial correlation 0.25. It reuses `EfficientFrontier` and adds `TwoAssetWorked` in `src/components/plots/`, composed from `PlotFrame` and `WidgetFrame`. All financial calculations call `portfolio.ts`; no finance-library change was needed.

The chapter explains covariance, the variance derivation, diversification below the weighted average versus below both assets, correlation limits, and short sales. Added the numeric test file and the Playwright script exposed as `npm run clickthrough:cap7`. No task specs, other task outcomes, decisions, goal configuration, dispatch policy or routes were changed.

Verified implementation revision: `7e86411aec08525db7e58294db376aefdf9a3743`. Rebased onto `origin/main` at `4b6cdcdf230117f9cc8f847e37c0650ffc5b0d2c` without conflicts. The full post-rebase sequence below exited 0. `git diff --check` also passed. Existing Node type-stripping and KaTeX euro-glyph build messages did not prevent the build; the chapter's browser checks reported no errors.

```sh
npm test && npm run build && npm run screenshots 07 && npm run clickthrough:cap7
```

Session output excerpts and final tail:

```text
 Test Files  21 passed (21)
      Tests  615 passed (615)
- 0 errors
- 0 warnings
- 0 hints
[build] 11 page(s) built in 1.50s
[build] Complete!
✓ chapters_07-dos-activos-dark-desktop.png
✓ chapters_07-dos-activos-dark-phone.png
✓ chapters_07-dos-activos-light-desktop.png
✓ chapters_07-dos-activos-light-phone.png
✓ dark 1280px: both widgets, all sliders, toggle, drag, keyboard, quizzes and six sections; no console/KaTeX/overflow errors
✓ dark 360px: both widgets, all sliders, toggle, drag, keyboard, quizzes and six sections; no console/KaTeX/overflow errors
✓ light 1280px: both widgets, all sliders, toggle, drag, keyboard, quizzes and six sections; no console/KaTeX/overflow errors
✓ light 360px: both widgets, all sliders, toggle, drag, keyboard, quizzes and six sections; no console/KaTeX/overflow errors
✓ cap7 click-through: 864 readouts match portfolio.ts
```

PR: https://github.com/jesusvillota/economia-financiera/pull/23, base `main`, label `goal:course-site`. Implementation is committed and pushed on `goal/course-site/task-028`. No merge performed. Follow-up: resolve the external billing/access blocker, then resume delivery and rerun the check.

## Delivery blocker

Check ID `117011408553` failed without starting. Its failure annotation says: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". The deploy check was skipped.

Only PR check status and the failure annotation were inspected to identify the external blocker. No workflow definitions or execution logs were read or changed. This task's explicit delivery rule makes failed or pending checks block delivery. Repairing account billing or spending limits requires account access unavailable to this task. The owner must resolve it and resume this task; the PR must remain draft until the required check passes.
