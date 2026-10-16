# TASK-029 outcome

Status: BLOCKED — GitHub account billing or spending limit prevents the required build check from starting. All five task acceptance requirements pass locally.

## Acceptance

- [x] `npm test` passes, including chapter 8 tests covering every numeric example in the text. Final run: **617 tests passed in 21 files**. New `tests/capitulo8.test.ts` contains 10 tests covering asset inputs, covariance entries, initial and changed mixes, minimum-variance weights, efficient and dominated targets, short sales, bounds, quiz answers and the six-section contract. Printed values are checked against `portfolio.ts` results.
- [x] `npm run build` passes and `/chapters/08-markowitz/` renders six ordered sections. Final run: Astro check **0 errors, 0 warnings, 0 hints**; **11 pages built**. Playwright receives HTTP 200 and asserts the rendered heading order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen. The Astro base prefix is `/economia-financiera/`.
- [x] `npm run screenshots 08` is clean. All four screenshots pass: dark/light × desktop/phone. No browser console, page, KaTeX or horizontal overflow errors. Both widgets were visually inspected in both themes and both viewport sizes. An additional browser check opened the algebra derivation and found zero page overflow at 1280 px and 375 px in both themes.
- [x] `npm run clickthrough:cap8` moves every widget and compares readouts with library values. Final run: **1,756 readout comparisons** with the actual TypeScript `portfolio.ts` loaded through Vite. It exercises both weight sliders, the correlation and target sliders, the short-sales toggle, portfolio dragging, keyboard input and all three quizzes. It covers four theme/viewport combinations, correlation endpoints, the inefficient branch, weights at boundaries and target clamping when shorts are disabled. It also verifies no browser/KaTeX errors or overflow at 360 px.
- [x] No claim contradicts `docs/AUDIT.md`. The example is original. The chapter follows the audited chapter-8 scope, uses the house notation and distinguishes minimum-risk targets from efficient portfolios. A new audit entry documents note 03 §3's lower-branch error with the tested 7 % counterexample. The text states short-sale restrictions, the plot's finite window, estimation uncertainty and the limits of mean-variance preferences. There is no link to an unpublished problem session.
- [ ] Delivery checks pass or none are configured, and the PR is ready. GitHub's build check fails before starting due to account billing or spending limits. The PR stays draft under the worker protocol and the task's explicit delivery gate.

## Summary

Added `src/content/chapters/08-markowitz.mdx`, an original Spanish chapter of about 1,900 words with the six required sections and three quizzes. Added `MarkowitzExplorer` using `WidgetFrame`, `PlotFrame` and the shared `EfficientFrontier`. Two controls preserve the investment budget while exploring arbitrary long-only weights. A sampled feasible cloud and a marker on the frontier let readers compare their mix with the minimum-risk portfolio at the same expected return. Portfolio calculations call only `portfolio.ts`.

Added the chapter-number tests and `scripts/clickthrough-cap8.mjs`, registered as `npm run clickthrough:cap8`. Added notation rows and the source correction to the audit. A small necessary fix in `EfficientFrontier` rounds native slider bounds to stable decimals. The chapter's three-asset example exposed an otherwise invalid HTML range step at correlation 1 with unrestricted shorts. The click-through covers this combination. No finance-library changes were needed.

Verified implementation revision: `eb8d39ccfa285b2c1f88f7ea5bc56fcc0a8d509e`. The branch was rebased onto `origin/main` before implementation without conflicts. No task specs, other task outcomes, decisions, routes or policy were changed. No task was dispatched and no merge was performed. Proposed follow-up: restore GitHub billing or its spending limit, then resume the task and retry the required build check.

The final sequence exited **0**, with no implementation changes afterwards:

```sh
npm test && npm run build && npm run screenshots 08 && npm run clickthrough:cap8
```

Final output tail:

```text
✓ chapters_08-markowitz-dark-desktop.png
✓ chapters_08-markowitz-dark-phone.png
✓ chapters_08-markowitz-light-desktop.png
✓ chapters_08-markowitz-light-phone.png
✓ chapter 8 dark 1280px: six sections, both widgets, sliders, shorts, drag, keyboard and quizzes
✓ chapter 8 dark 360px: six sections, both widgets, sliders, shorts, drag, keyboard and quizzes
✓ chapter 8 light 1280px: six sections, both widgets, sliders, shorts, drag, keyboard and quizzes
✓ chapter 8 light 360px: six sections, both widgets, sliders, shorts, drag, keyboard and quizzes
✓ cap8 click-through: 1756 readouts match portfolio.ts
VERIFY_EXIT=0
```

`git diff --check` passed. The build emits existing euro-glyph messages from other chapters, but the chapter-8 browser checks have no KaTeX errors.

## Delivery blocker

PR: https://github.com/jesusvillota/economia-financiera/pull/24 — open, draft, base `main`, label `goal:course-site`, branch `goal/course-site/task-029`. Implementation commits and this outcome are committed and pushed on that branch.

For verified implementation `eb8d39c`, the required `build` check concluded `FAILURE` at 2026-10-16 14:03:48 UTC; check ID `117012348888`. Its failure annotation states:

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

Only the check status and failure annotation were read to establish the external blocker. No workflow definitions or execution logs were read or changed. Fixing account billing is outside this task's access and scope. The latest task instruction explicitly makes failed or pending checks block delivery. The PR body contains `Goal-Blocked: GitHub account billing or spending limit prevents the build check from starting`. The native goal is not marked complete.
