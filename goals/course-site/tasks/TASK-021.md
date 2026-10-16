---
id: TASK-021
title: 'Finance maths library: valuation and single-asset risk'
milestone: M-3
state: approved
depends_on: [TASK-016]
delivery: pr
---

## Why

SC-4: one verified source for chapters 4 to 6 and Problem Session 2.

## Scope

Add `src/lib/finance/valuation.ts` and `src/lib/finance/risk.ts`: Gordon growth and multi-stage DDM, implied growth and required return, price from dividends with a finite horizon; FCFF, FCFE, WACC (with tax shield), enterprise value to equity value bridge, terminal value; scenario moments (expected return, variance, standard deviation, covariance, correlation), sample moments from a return series, and the properties of expectation and variance. Rules (r > g, probabilities sum to 1) throw typed errors. Formulas follow `docs/AUDIT.md` (corrected where the source was wrong). Tests in `tests/valuation.test.ts` and `tests/risk.test.ts`: hand-worked values in comments plus the recomputed ps2 answers (Ex 1 to 5, 7 to 9, with the Ex 5c and 7c corrections) as constants from `docs/audit/ps2_findings.md`. No UI. Out of scope: portfolios of several assets.

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Property tests: Gordon price equals the sum of discounted dividends for a long horizon; WACC weights sum to 1; covariance is symmetric; correlation lies in [-1, 1].
- Every ps2 numeric answer is asserted within its tolerance.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
