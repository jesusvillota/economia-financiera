---
id: TASK-023
title: 'Finance maths library: CAL, CAPM, SML, event studies'
milestone: M-3
state: approved
depends_on: [TASK-022]
delivery: pr
---

## Why

SC-4: maths for chapters 9 to 11 and Problem Session 3.

## Scope

Add `src/lib/finance/capm.ts`: capital allocation line, Sharpe ratio, tangent portfolio (from `portfolio.ts`), separation theorem helper (mix of risk-free asset and tangent portfolio for a target risk or return), CML, beta (covariance over market variance), SML expected return, alpha and mispricing, systematic vs idiosyncratic risk; and `src/lib/finance/eventStudy.ts`: market-model abnormal returns, AR, AAR, CAR over a window, t-statistic; Fama-French and Carhart factor regression helper (OLS by normal equations) with APT expected return. Tests in `tests/capm.test.ts`, `tests/eventStudy.test.ts`: hand values plus the ps3 Ex 4 to 7 and ps4 Ex 4 answers (Ex 7 with the audit correction). No UI.

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Property tests: the tangent portfolio has the highest Sharpe ratio on a grid of weights; an asset with beta = 1 is priced on the SML; CAR is the sum of ARs; OLS recovers known coefficients on noiseless data.
- ps3 Ex 4 to 7 and ps4 Ex 4 numeric answers are asserted.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
