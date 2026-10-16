# TASK-022 outcome

Status: BLOCKED — GitHub account billing or spending limit prevents the build check from starting. All four acceptance requirements pass locally.

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. In this session, `npm test` exited 0: 227 tests passed in 11 files, compared with the recorded baseline of 181 tests in 10 files. `tests/portfolio.test.ts` adds 46 test cases and 128 explicit `expect(...)` statements, with further assertions from deterministic property grids.
- [x] Correlation properties and weights sum to 1. Four volatility pairs, each with 21 weights, verify that `rho = 1` gives linear sigma on `[0,1]`. A separate short-sale check verifies the absolute-linear continuation. The same four volatility pairs verify zero variance at the minimum for `rho = -1`. Per accepted DEC-003, the separately named PS3 Exercise 2 `rho = 0.95` variant asserts unrestricted `wS = -0.375` and long-only `wS = 0`. Both original audited Exercise 2 cases remain: `rho = 0.8` gives `wS = 4/15`, and `rho = -0.2` gives `wS = 122/265`. Weight sweeps and 21 frontier targets in each trading mode verify full investment; frontier tests also verify target returns and variance never below the global minimum.
- [x] A non-PSD correlation matrix throws. Tests use `[[1, 0.9, 0.9], [0.9, 1, -0.9], [0.9, -0.9, 1]]`. Conversion to covariance throws `RangeError` with `PSD`, including when all volatilities are zero. Variance, global-minimum and target-frontier entry points reject the matrix too.
- [x] `npm run build` passes. In this session, the final implementation build exited 0. Astro check reported 0 errors, 0 warnings and 0 hints across 57 files; Astro built all 8 pages.

## Summary

Added `src/lib/finance/portfolio.ts`, `src/lib/finance/matrix.ts`, and `tests/portfolio.test.ts`. No UI or dependencies changed.

The library supplies two-asset return, variance, unrestricted and long-only minimum-variance weights, inclusive weight sweeps, and correlation/diversification tables. For n assets it supplies covariance construction, return and variance, a global minimum-variance portfolio, target-return frontier points and both branch labels. Returns and volatilities use decimals; weights must sum to one.

Matrix validation uses symmetric pivoted elimination with relative tolerance and permits singular positive semidefinite matrices. Frontier optimization uses the Lagrange closed form, with a rank-aware equality-system fallback for singular matrices and equal expected returns. The long-only solver enumerates active sets while preserving the return and investment constraints. It prunes feasible faces except when singular global-minimum ties require selecting the highest-return minimum. Its worst-case cost is exponential; it is intended for small teaching portfolios. Singular unrestricted frontiers also detect a zero-risk direction that increases return, so dominated points are not labelled efficient.

Tests cover hand calculations and the audited PS3 Exercises 1–3, correlation endpoints, short sales, feasible and infeasible targets, boundary optima, four assets, constant returns, singular covariance, scale/order invariance, invalid input and input immutability. An independent feasible weight grid checks long-only target optimality on three Gram matrices. Source intermediate variances retain the audit's `1e-5` tolerance; separate assertions check exact arithmetic values.

DEC-003 was accepted by jesusvillota on 2026-10-16. Its option 1 is implemented without changing the original audited cases or the task specification. No material decision remains. `TASK-016.outcome.md` is absent; `goals/course-site/decisions.jsonl` records TASK-016 completed by the owner at 12:40 UTC.

Verified implementation revision: `154d2f399c676f474dcd386810eb1ff6b98c763b`. The branch was rebased successfully onto `origin/main` at `c08f9b5225b239e92db374e935c2acfefc94a56f`, without conflicts. Both required commands passed after the final implementation changes. `git diff --check` passed. No pages changed, so screenshot verification does not apply. The build emitted existing KaTeX euro-glyph messages but completed successfully.

PR: https://github.com/jesusvillota/economia-financiera/pull/14, base `main`, label `goal:course-site`. No review threads were present when checked after pushing the implementation. No merge performed.

## Delivery blocker

The build check for verified implementation `154d2f399c676f474dcd386810eb1ff6b98c763b` concluded `FAILURE` without starting. Its check annotation states: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". Check ID: `116981704511`; completed 2026-10-16 at 12:52:46 UTC. The deploy check was skipped.

The resume instruction explicitly makes failed or pending checks block delivery. Only check status and its failure annotation were read to establish this external access blocker; no workflow definitions or execution logs were read or changed. Account billing cannot be repaired within this task's authorization. The owner must resolve account billing or spending limits; then this branch can be resumed and the build check retried. No implementation decision is missing. The PR remains open and draft with `Goal-Blocked: GitHub account billing or spending limit prevents the build check from starting`. All code and outcome changes are pushed on the existing task branch.
