---
id: TASK-036
title: 'Finance maths library: efficiency and behavioural finance'
milestone: M-4
state: approved
depends_on: [TASK-017]
delivery: pr
---

## Why

SC-4: maths for chapters 15 and 16 and for Problem Session 4 (Ex 4 and later the final-exam page).

## Scope

Add `src/lib/finance/efficiency.ts`: seeded random-walk and trend-following price simulators (seeded PRNG, no `Math.random`), sample autocorrelation, variance ratio, runs count, a simple trading-rule backtest (momentum rule vs buy and hold, with a transaction cost), abnormal return versus a benchmark and active-management alpha with its t-statistic (reuse `eventStudy.ts`, do not duplicate it), prospect-theory value function with loss aversion lambda and probability weighting, and expected value vs prospect value of a gamble. Tests in `tests/efficiency.test.ts`: hand values, a fixed seed reproduces the same path, a pure random walk has autocorrelation near 0 on a long sample (tolerance stated), a trend process has positive autocorrelation, value function is concave for gains and convex for losses and steeper for losses. No UI. Out of scope: chapters; fixed-income maths.

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Seeded simulations are exactly reproducible; property tests cover the cases listed in the scope.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
