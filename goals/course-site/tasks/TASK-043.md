---
id: TASK-043
title: 'Finance maths library: derivatives (forwards, futures margining, option payoffs and strategies)'
milestone: M-5
state: approved
depends_on: [TASK-018]
delivery: pr
---

## Why

SC-4: maths for chapters 20 and 21, Problem Session 4 (Ex 10 and the new futures exercise) and the final-exam page.

## Scope

Add `src/lib/finance/derivatives.ts`: forward price by no-arbitrage (no income, known cash income, continuous and discrete yield, storage cost), forward value at a later date, forward-rate-agreement payoff, futures daily marking to market with margin account (initial, maintenance, margin call, variation margin path), basis, option payoffs (long and short call and put), profit including premium, strategies (covered call, protective put, bull and bear spread, straddle, strangle, collar) as payoff sums, breakevens, and put-call parity as a check only. Option pricing models are out of scope: link to options-explained instead. Tests in `tests/derivatives.test.ts`: hand values, `source/problem_sets/ps4` Ex 10 with the corrected discount factor 0,9429 and F = 4,74. Add the missing futures exercise values (design the numbers, document them in the test). Validation: negative prices or maturity throw. No UI. Out of scope: bonds, chapters.

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Property tests: forward value is 0 at inception; a forward and a short futures with daily settlement have the same total gain when rates are flat; strategy payoff equals the sum of leg payoffs; put-call parity holds for payoffs; margin account balance equals initial margin plus cumulative variation margin minus withdrawals.
- ps4 Ex 10 numeric answers are asserted with the audit correction.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
