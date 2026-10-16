---
id: TASK-022
title: 'Finance maths library: portfolio core (two assets, n assets, frontier)'
milestone: M-3
state: approved
depends_on: [TASK-016, DEC-003]
delivery: pr
---

## Why

SC-4: shared portfolio maths for chapters 7 to 9, the frontier widget and Problem Session 3.

## Scope

Add `src/lib/finance/portfolio.ts` (plus a small matrix helper `src/lib/finance/matrix.ts` if none exists): two-asset portfolio return and variance, minimum-variance weight (with and without short sales), weight sweep, correlation-to-diversification table; n-asset portfolio return and variance from a covariance matrix, positive semi-definite check, global minimum-variance portfolio, frontier points for a target return (Lagrange closed form and a long-only version by projection or a simple active-set), efficient and inefficient branches. Reject matrices that are not PSD. Tests in `tests/portfolio.test.ts`: hand values, the ps3 Ex 1 to 3 answers from `docs/audit/ps3_findings.md`, and checks that the frontier variance is never below the global minimum. No UI. Out of scope: risk-free asset and CAPM (TASK-023).

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Property tests: rho = 1 gives a linear sigma; rho = -1 reaches sigma = 0; the minimum-variance weight is outside [0,1] for the ps3 Ex 2 correlation; weights sum to 1.
- A non-PSD correlation matrix throws.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
