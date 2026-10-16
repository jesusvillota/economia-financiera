# TASK-021 outcome

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. Evidence: exit 0 on 2026-10-16 after rebasing onto `origin/main`. All 436 tests pass in 12 files. `tests/valuation.test.ts` adds 137 passing tests; `tests/risk.test.ts` adds 118. Each new test executes at least one assertion, so there are at least 255 new assertions.
- [x] Required property tests pass. Evidence: Gordon matches the sum of 2,000 discounted dividends for four growth rates, including negative and zero growth. Five capital structures have WACC weights summing to 1. Forty generated joint-scenario cases assert covariance symmetry and correlation within [-1, 1]. Additional tests cover Gordon inverses, affine expectation and variance, and perfect positive/negative correlation.
- [x] Every PS2 numeric answer is asserted within its tolerance. Evidence: 139 passing numeric cases correspond to the 139 checks in `docs/audit/ps2.py`: 91 valuation cases and 48 risk cases. Exercises 1–5 and 7–9 and the appendix are covered. Constants and absolute tolerances follow the audit, with the corrections in `docs/audit/ps2_findings.md`, including Ex 5(c), Ex 7(c), and the appendix mean of 5.1%. Rounded intermediate calculations are labelled separately from full-precision chains.
- [x] `npm run build` passes. Evidence: exit 0 after the rebase, `astro check` reports 0 errors, 0 warnings, and 0 hints across 58 files; the static build produces 8 pages.
- [ ] Delivery checks pass and PR is ready. Blocked: GitHub account billing prevents the required `build` check from starting. PR remains a draft as required by the worker protocol.

## Summary

- **What:** Added `src/lib/finance/valuation.ts` and `risk.ts`, plus their two test files. No UI changes.
- **How:** Valuation includes Gordon, inverse growth/return formulas, finite-horizon and multi-stage DDM, FCFF/FCFE reconciliation, market-value capital weights, tax-adjusted WACC, terminal value, discounted cash flows, enterprise-to-equity bridge, and per-share price. Risk includes scenario expectation/variance/standard deviation, covariance/correlation, sample moments using n-1, holding-period returns, annualized volatility, and affine moment properties.
- **Input rules:** `ValuationError` and `RiskError` extend `RangeError`. Nonfinite values, invalid growth/discount relations, invalid probabilities, zero-variance correlation, and insufficient sample sizes fail explicitly. Probabilities must sum to 1 within 1e-12; only accepted rounding is normalized. Centered expectation preserves constant scenarios exactly.
- **Deviations:** No production CAPM or beta API was added; these belong to TASK-023. Their PS2 numeric results are still asserted as direct arithmetic using the tested moment and WACC functions. No new dependencies. The manual prerequisite TASK-016 is marked done in its spec and has no outcome file.
- **Verified revision:** `37b6b4ddb56b38ba505d15d05cf7350daa5a4028`, rebased onto `origin/main` (`7dfa02dc341c8b29aedea4e56c12326440ec7b34`) without conflicts. This outcome is the only subsequent task change. Verification used Node v23.7.0 and the installed lockfile dependencies.
- **Follow-up:** The account owner must resolve GitHub billing or the spending limit. Then rerun the required checks and mark this PR ready only after they pass. Do not merge as part of this task.

## Blocker

GitHub account billing prevents the required build check from starting. This requires account-owner access, which is unavailable to this worker.

PR: https://github.com/jesusvillota/economia-financiera/pull/16

Check evidence: https://github.com/jesusvillota/economia-financiera/actions/runs/38903033742/job/116979692177

The `build` check annotation states:

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

The failure occurred before task code ran. Local tests and build pass, but the explicit delivery rule says failing or pending checks block delivery. No billing settings or workflow files were changed. The task is not complete.

## Verification tail

`npm test` exited 0:

```text
 Test Files  12 passed (12)
      Tests  436 passed (436)
   Start at  14:47:59
   Duration  284ms (transform 58%, import 25%, tests 14%, worker 4%)
```

`npm run build` exited 0:

```text
14:48:05 [build] ✓ Completed in 715ms.
14:48:05 [build] 8 page(s) built in 1.02s
14:48:05 [build] Complete!
```
