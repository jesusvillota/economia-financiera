---
id: TASK-042
title: 'Finance maths library: fixed income (bonds, YTM, accrued, spot and forward curve, duration, convexity)'
milestone: M-5
state: approved
depends_on: [TASK-018]
delivery: pr
---

## Why

SC-4: maths for chapters 17 to 19, Problem Session 4 (Ex 6, 8, 9) and the final-exam page.

## Scope

Add `src/lib/finance/bonds.ts`: bond price from a flat yield and from a spot curve (annual and generic coupon frequency), yield to maturity (robust root finder, no closed form assumed), accrued coupon and clean/dirty price with an actual-day convention stated in the docstring, spot rates from zero-coupon prices, bootstrapping from coupon bonds, implied forward rates `f_{s,k}` (any start and length), Macaulay and modified duration, convexity, price change by the duration and the duration-plus-convexity approximations. Tests in `tests/bonds.test.ts`: hand values, `source/problem_sets/ps4` Ex 6, 8, 9 with the audit corrections (read `docs/AUDIT.md` section 2, ps4: Ex 6a 980,19; 8b f_{2,1} 5,01 %; 9c TIR 8,14 %). Validation: non-positive maturity or yield below -100 % throws. No UI. Out of scope: derivatives, chapters.

## Acceptance

- `npm test` passes with at least 35 new assertions.
- Property tests on a grid: price at YTM equals price from the cash flows; price is decreasing and convex in yield; a par bond (coupon = yield) prices at face; bootstrapped spots reprice the input bonds; forward rates compound back to the spot rate; modified duration matches a numeric derivative of price; duration of a zero-coupon bond equals its maturity.
- ps4 Ex 6, 8 and 9 numeric answers are asserted, using the corrected values.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
