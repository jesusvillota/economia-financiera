# TASK-036 outcome

Status: delivered. All three acceptance items pass locally.

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. The local run exited 0: **1015 tests in 28 files**, compared with **1000 tests in 27 files** on `origin/main`. The new file `tests/efficiency.test.ts` adds **15 tests** with **76 `expect(...)` statements**; loops over 10 gain/loss sizes and 19 probabilities execute more.
- [x] Seeded simulations are exactly reproducible; property tests cover the cases listed in the scope.
  - Same seed gives an identical path (`toEqual`) for both simulators; seed 43 gives a different path; `phi = 0` trend equals the random walk.
  - Hand values: autocorrelation, variance ratio, runs test, momentum backtest with a 1 % cost, active alpha (t = √0,6), value function, probability weight (`w(0,25) = 2 − √3` with γ = 0,5), and expected vs prospect value of three gambles.
  - Random walk (seed 42, 10 000 steps): lag-1 autocorrelation is **−0,0042**; the stated tolerance is 3/√n = **0,03** (3 standard errors). Lag 5: −0,0156. VR(5) = 0,991 (tolerance 0,1). Runs z = −0,32.
  - Trend (AR(1), φ = 0,5): lag-1 autocorrelation **0,496** (asserted in (0,45, 0,55)), lag 2 0,246 (≈ φ²), VR(5) = 2,20 (theory 2,225), runs z = −31,7.
  - Value function is concave for gains, convex for losses and steeper for losses: checked by midpoint and slope inequalities at 10 sizes from 1 to 512.
  - Probability weighting fixes 0 and 1, overweights 1 %, underweights 99 %, and increases on a 0,05 grid.
  - Backtest: a higher cost strictly lowers wealth on a seeded trend path.
- [x] `npm run build` passes. The local run exited 0. `astro check`: **0 errors** across 104 files. Astro built **17 pages**.

## Summary

**What.** Added `src/lib/finance/efficiency.ts` and `tests/efficiency.test.ts`. No UI, page, dependency, spec or other task changed.

**How.**
- Simulators reuse `rng` (mulberry32) from `src/lib/problems/variant.ts`, with Box-Muller normal shocks. Log returns follow `r_t = μ + φ(r_{t−1} − μ) + σ z_t`. φ = 0 is the random walk (`randomWalkPrices`); `trendPrices` takes φ in (−1, 1).
- `autocorrelation(returns, lag)`, `varianceRatio(returns, q)` (overlapping q-sums, one-period mean), `runsTest(returns)` (Wald-Wolfowitz; zero returns dropped).
- `momentumBacktest(returns, lookback, cost)`: hold when the sum of the last `lookback` returns is positive, else cash at 0; starts in cash; each switch costs `cost`. Buy and hold pays the cost once.
- `benchmarkAbnormalReturns` and `activeAlpha` reuse `marketModelAbnormalReturns` (intercept 0, beta 1) and `abnormalReturnTStatistic` from `eventStudy.ts`. No event-study code is duplicated.
- `prospectValue`, `probabilityWeight`, `gambleExpectedValue` (reuses `expectedReturn` from `risk.ts`), `gambleProspectValue`. Defaults are the Tversky-Kahneman 1992 estimates (α = β = 0,88, λ = 2,25, γ = 0,61).

**Deviations.** Prospect value weights each outcome separately (1979 form with 1992 functional forms), not cumulative rank-dependent weighting. γ must be above 0,28 so that `w` is increasing.

**Verified revision.** Implementation commit `5bca212` on `goal/course-site/task-036`, rebased on `origin/main` at `0e67f9d`.

**Proposed follow-ups.** Chapters 15 and 16 (TASK-040, TASK-041) add the notation for these symbols (φ, VR(q), λ, γ, v, w) to the style-guide table when they first use them in prose.

Local verification tail:

```text
 Test Files  28 passed (28)
      Tests  1015 passed (1015)
npm test exit=0
16:48:04 [build] Complete!
npm run build exit=0
```
