# TASK-043 outcome

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. The full local run passed **35 files / 1,144 tests**, including **41 new derivatives tests**. The five seeded property tests enforce **15,000 assertions** with `expect.assertions` (2,400 + 400 + 6,000 + 600 + 5,600), in addition to hand-value, exercise and validation assertions.
- [x] All five required properties pass in `tests/derivatives.test.ts`: zero forward value at inception (six carry conventions, both positions); equal nominal gains for short forwards and daily-settled short futures at flat rates; strategy payoffs equal independently computed leg sums for all seven strategies; put-call payoff parity; margin balances equal initial margin plus cumulative variation margin minus cumulative net withdrawals. Each property uses 200 reproducible seeded cases. Margin-account tests check every daily row, including top-ups and withdrawals.
- [x] PS4 Exercise 10a–d numeric answers are asserted with the audit correction. Two-year forward price: **48.672 → €48.67**. At 1.5 years remaining: discount factor **0.9428660343181924 → 0.9429**, PV of delivery price **€45.26**, long value **€4.74** (and an explicit regression against €4.76). Call payoffs **4/0/0**, profits **0.50/−3.50/−3.50**, breakeven **€51.50**; straddle at €44 pays **€4**, costs **€5.50**, and loses **€1.50**.
- [x] `npm run build` passes. Local `astro check`: **129 files, 0 errors, 0 warnings, 0 hints**; static build: **22 pages**. The combined `npm test && npm run build` command exited **0** after rebasing onto `origin/main`.

## Summary

Added `src/lib/finance/derivatives.ts` and `tests/derivatives.test.ts` only, plus this outcome. The library supports annual/continuous forward carry (no income, dated cash income, continuous/discrete proportional yield, present-value storage costs), later long/short forward values, FRA start/end settlement, basis, daily futures margining, call/put payoffs and profit, covered call, protective put, bull call spread, bear put spread, straddle, strangle, collar, and breakevens. Strategies contain signed stock/option legs. Breakevens return isolated prices and entire zero-profit intervals. Parity functions check identities or observed prices; no option pricing model was added. The module links to options-explained for pricing depth. Negative/nonfinite prices, negative maturities and incompatible financial inputs throw `RangeError`.

The original missing futures exercise is documented beside its test: short two contracts at 100, multiplier 10, total initial/maintenance margins €200/€120, daily settlements 103/108/104/99, variations −60/−100/+80/+100, a €160 margin call, €80/€100 withdrawals, and €20 total trading gain. Calls restore the initial margin only when the account falls strictly below maintenance.

Conventions: rates are annual effective unless selected otherwise; maturity means remaining years. Daily trading gains exclude funding/reinvestment interest and fees. The forward/futures property compares nominal trading gains at zero and positive deterministic flat rates; equal terminal funded wealth is guaranteed by this comparison at zero rates. Margin deposits are negative **net withdrawals**; separate `marginCall` and gross `payout` fields make deposits and cash withdrawals explicit. Option profits subtract premiums without capitalizing them, matching PS4. Discrete proportional yield means annual effective yield. There are no scope deviations or material decisions pending.

Read the TASK-018 dependency spec: it records completed manual decomposition. No TASK-018 outcome file exists in the available history. DEC-002 accepts basic derivatives coverage. This task needs no additional dependency data.

Verified implementation revision: `c66fd69674be97394f85773f9cec1c176f2015b4`, rebased onto `origin/main` without conflicts. Final acceptance documentation adds no executable changes. Verification on 2026-10-16:

```text
$ npm test && npm run build
Test Files  35 passed (35)
     Tests  1144 passed (1144)
Result (129 files): 0 errors, 0 warnings, 0 hints
[build] 22 page(s) built in 2.14s
[build] Complete!
exit 0
```

No pages or widgets changed, so screenshot/clickthrough checks do not apply. The build emitted existing Node experimental-type-stripping and KaTeX euro font notices. GitHub Actions and the PR build check are excluded by the explicit owner rule returned by `goal rules`; local Verify commands determine readiness. No Actions status was inspected.

PR: https://github.com/jesusvillota/economia-financiera/pull/36 into `main`, label `goal:course-site`. Never merge. Proposed follow-ups: none beyond the already planned chapters and PS4 consumers.
