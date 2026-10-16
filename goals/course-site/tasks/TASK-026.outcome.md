# TASK-026 outcome

## Acceptance

- [x] `npm test` passes, including a new chapter-5 test file covering every number in the text. Evidence: final post-rebase run exited 0 on 2026-10-16; 500 tests pass in 16 files. `tests/capitulo5.test.ts` adds nine tests covering all original-example inputs, FCFF/FCFE reconciliation, capital weights, WACC contributions, each discounted flow, terminal and present values, the equity bridge, price per share, numeric quizzes, experiment directions and source-note regression. The six-section contract and three quizzes are also asserted.
- [x] `npm run build` passes and `/chapters/05-empresa-wacc/` renders the six sections in order. Evidence: exit 0; Astro reports 0 errors, 0 warnings and 0 hints across 68 files; eight pages built, including the chapter route. Playwright asserts HTTP 200 and the rendered order Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen.
- [x] `npm run screenshots 05` is clean. Evidence: exit 0 with four passing dark/light × desktop/phone screenshots; no browser console, KaTeX or page-overflow errors. Inspected all four full-page views and detailed widget captures. Screenshot files are local ignored artifacts under `screenshots/chapters_05-empresa-wacc-*.png`.
- [x] `npm run clickthrough:cap5` moves each widget and compares readouts with the library. Evidence: exit 0 at 1280 px and 360 px. The script changes all seven sliders individually, checks a keyboard arrow, compares every visible numeric readout against `valuation.ts`, checks non-convergent and negative-residual warnings, and answers all three quizzes. No browser console, KaTeX or page-overflow errors.
- [x] No claim contradicts `docs/AUDIT.md`. Evidence: reviewed against sections 2–4 and note 02 §1.2. The chapter uses original numbers rather than the erroneous PS2 answers. It distinguishes FCFF/WACC from FCFE/cost of equity, dates the terminal correctly, uses market/target weights and avoids counting debt or cash twice. A newly identified missing-input error in the source FCFE example is documented in audit section 2 and reproduced by the new regression test.
- [ ] Delivery checks pass and the PR is ready. Blocked: the GitHub account billing/spending restriction prevents the `build` check from starting. PR #18 remains open and draft into `main`, with `goal:course-site` and the task/blocker markers. The task is not delivered and the native goal is not marked complete.

## Summary

- **What:** Added `05-empresa-wacc.mdx`, `DcfBuilder.tsx`, `capitulo5.test.ts` and `clickthrough-cap5.mjs`; registered `clickthrough:cap5`; extended the notation table and source audit.
- **How:** An original Taller Norte example connects operating earnings to FCFF, FCFE, WACC, terminal value, operating value, equity and price per share. The approximately 1800-word Spanish chapter follows the six-section template and includes three quizzes. The widget uses `PlotFrame`, `WidgetFrame`, shared sliders and reduced-motion-aware animation; every financial calculation calls the existing `valuation.ts`. No library changes or dependencies were needed.
- **Plan executed:** Read the reference chapter and audit; write the chapter and widget; verify all numbers; test the built route, interactions and screenshots; sync, push and document delivery status.
- **Deviations:** Session 2 does not yet exist in this checkout, so no session frontmatter link was added. Target capital weights remain fixed while bridge debt changes; both the chapter and widget explain this isolation of effects. The first test attempt found missing dependencies; `npm ci` installed the lockfile packages. No task routes, policies, specs, decisions, other outcomes or goal configuration were changed.
- **Verified revision:** `63bf15b449438412b5e0f639b0d921f5773b4991`, rebased without conflicts onto `origin/main`. All four required commands ran as one `&&` chain and exited 0. This outcome is the only subsequent task change. Node v23.7.0 and the lockfile dependencies were used. The pre-rebase run passed 454 tests; the final run includes the newer base tests and passes 500.
- **Follow-up:** The account owner must resolve the billing/spending restriction. Then the required check must pass before this PR can be marked ready. Never merge as part of this task.

## Blocker

GitHub account billing prevents the required build check from starting. Account-owner access is unavailable to this worker.

PR: https://github.com/jesusvillota/economia-financiera/pull/18

Check: https://github.com/jesusvillota/economia-financiera/actions/runs/38910580964/job/117005097425

The Checks API annotation states:

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

This failed before task code ran. No workflow, billing settings or task policy was changed. Check status and its annotation were read only to satisfy the explicit delivery gate; no Actions run was started or retried and no job logs were read.

## Verification tail

The command chain `npm test && npm run build && npm run screenshots 05 && npm run clickthrough:cap5` exited 0.

```text
 Test Files  16 passed (16)
      Tests  500 passed (500)

Result (68 files):
- 0 errors
- 0 warnings
- 0 hints

15:47:34 [build] 8 page(s) built in 1.19s
15:47:34 [build] Complete!

✓ chapters_05-empresa-wacc-dark-desktop.png
✓ chapters_05-empresa-wacc-dark-phone.png
✓ chapters_05-empresa-wacc-light-desktop.png
✓ chapters_05-empresa-wacc-light-phone.png

✓ 1280px: six sections; all 7 sliders + keyboard; readouts match valuation.ts; warnings and 3 quizzes clean
✓ 360px: six sections; all 7 sliders + keyboard; readouts match valuation.ts; warnings and 3 quizzes clean
✓ Chapter 5 click-through passed
```
