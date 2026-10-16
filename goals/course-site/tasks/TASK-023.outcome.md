# TASK-023 outcome

Status: BLOCKED — GitHub account billing or spending limit prevents the required build check from starting. All four acceptance requirements pass locally.

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. The final local run exited 0: **576 tests in 17 files**, compared with the session baseline of **491 tests in 15 files**. The two new test files add **85 cases** and **152 explicit `expect(...)` statements**, with further assertions from deterministic property grids.
- [x] All four required properties pass. Three two-asset correlation cases each compare the tangent portfolio with **301 weights**, including short positions. A three-asset grid compares **441 portfolios**. A **16-pair rate grid** verifies beta=1 lies on the SML at the market return, with zero alpha. CAR equals the sum of ARs for every inclusive subwindow of deterministic series of lengths 1–12. OLS recovers known intercepts and coefficients on noiseless datasets with **1–4 factors at four scales** (1e-6, 0.01, 1, 100).
- [x] PS3 Exercises 4–7 and PS4 Exercise 4 numeric answers are asserted. PS3 covers lending/borrowing returns and variances, CAL slope and target allocation (Ex 4); all three asset betas, required returns and pricing gaps (Ex 5); both portfolio betas and required returns (Ex 6); and equal-weight/minimum-variance moments, Sharpe, CAPM gaps and final allocation (Ex 7). The Ex 7 audit corrections are explicit: equal-weight sigma **0.14832396974191325**, minimum-variance Sharpe **0.4853626716970755**, risky allocation **0.6933752452815365**, cash allocation **0.3066247547184635**. PS4 asserts expected returns **[0.036, 0.012, -0.024]**, ARs **[0.010, 0.008, 0.019]**, and CAR **0.037**.
- [x] `npm run build` passes. The final local run exited 0. Astro check reports **0 errors, 0 warnings, 0 hints across 69 files**. Astro builds **7 pages**. Existing KaTeX euro-glyph messages do not prevent the build.

## Summary

Added `src/lib/finance/capm.ts`, `src/lib/finance/eventStudy.ts`, `tests/capm.test.ts`, and `tests/eventStudy.test.ts`. No UI, dependency, source exercise, task specification, policy, route or other task changed.

The CAPM module provides CAL/CML, Sharpe ratio, tangent portfolio, risk-free mixing and separation allocation, beta and portfolio beta, SML, Jensen alpha, mispricing and systematic/idiosyncratic variance. It reuses the existing `portfolio.ts` moment functions and `matrix.ts` solver. The dependency has no tangent helper to import, so the tangent calculation lives in `capm.ts` without changing the portfolio core.

The event-study module provides raw-return market-model predictions and ARs, cross-asset AARs, inclusive-window CAR, supplied-standard-error and one-sample t-statistics, OLS by centered/scaled normal equations, Fama-French/Carhart excess-return regression wrappers, and APT expected returns. The regression result includes fitted values, residuals, residual sum of squares, degrees of freedom and residual variance.

All returns and volatilities use decimals for the same period. CAR adds returns rather than compounding them. Tangent portfolios allow short sales and require nonsingular PSD covariance with a positive normalizer; undefined or numerically degenerate upper tangents throw. OLS includes an intercept and requires full column rank; normal equations are intended for small teaching datasets, with near-collinearity rejected at the solver tolerance. Exactly identified fits return `null` residual variance. One-sample t-statistics assume independent observations and reject zero standard error; no p-value or correlated-event inference is implied. No material decision or missing source data remains.

Read the dependency outcome (`TASK-022.outcome.md`) and accepted DEC-003. Its Exercise 2 decision does not change this task's exercises. Rebased this task branch onto `origin/main` at `e7a4272e5cd287eef6b652057dae71e8ca51047b` without conflicts. Verified implementation revision: **`e77bc02990e57fa0d3c0dd85474c56d442d74804`**. Both required commands passed together after the rebase and final implementation change. `git diff --check` passed. No pages changed, so screenshot verification does not apply. No follow-up implementation is proposed.

## Delivery

PR: https://github.com/jesusvillota/economia-financiera/pull/21. Base: `main`. Label: `goal:course-site`. Body contains `Goal-Task: course-site/TASK-023` and `Goal-Blocked: GitHub account billing or spending limit prevents the build check from starting`. Implementation and acceptance evidence are committed and pushed on `goal/course-site/task-023`. The PR remains open and draft. Never merged.

## Delivery blocker

The required build check for implementation revision `e77bc02990e57fa0d3c0dd85474c56d442d74804` failed before starting (check ID `117006291245`). The same failure recurred on outcome revision `6d0185c7c1f447a074f9d576816721acc0656f86` (check ID `117006616195`, completed 2026-10-16 at 13:50:56 UTC). Its annotation states: **"The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings"**. The deploy check was skipped.

The task's explicit delivery rule makes failing or pending checks block delivery. Only check status and the failure annotation were inspected to establish this access blocker. No workflow definitions or execution logs were read or changed. Fixing the GitHub account payment or spending limit needs account access outside this task. The owner must resolve the account restriction before resuming delivery and retrying the required check. No implementation decision remains. The native goal is not marked complete because delivery requirements are not satisfied.

Local verification tail (combined command exited 0):

```text
 Test Files  17 passed (17)
      Tests  576 passed (576)
   Start at  15:49:34
   Duration  321ms (transform 48%, import 29%, tests 20%, worker 3%)

15:49:40 [build] 7 page(s) built in 995ms
15:49:40 [build] Complete!
```
