# TASK-042 outcome

## Acceptance

- [x] `npm test` passes with at least 35 new assertions. On verified implementation revision `bbb6a78f7f39820a961cbfb2e9a681458e52d51e`, the command exited 0: 35 test files and 1,151 tests passed. `tests/bonds.test.ts` adds 48 tests. Its main 324-case grid alone enforces 3,240 assertions (`expect.assertions(1080)` in each of three frequency cases).
- [x] All seven required properties pass on deterministic grids. The main grid varies face (100, 1,000, 10,000), maturity (1, 2, 7 years), coupon (0%, 3%, 12%), frequency (1, 2, 4) and yield (−2%, 0%, 5%, 20%). It checks independent discounted-cash-flow sums against prices at recovered YTM, decreasing and convex prices, coupon = yield par pricing, modified duration against a central numerical derivative, and zero-coupon Macaulay duration = maturity. It also checks analytic convexity against the numerical second derivative. Separate grids bootstrap rising, flat and falling spot curves at each frequency and reprice every input bond. Forward tests cover fractional starts and lengths, including start zero, and verify compound-return equality with ending spots. Small positive and negative shifts verify that the convexity correction improves the duration estimate.
- [x] PS4 Exercises 6, 8 and 9 use audited corrected answers. Six named regression tests assert Ex 6a final-payment PV **980.19** and total **1,028.73**; Ex 6b/c yields and durations; Ex 6d the implied spot and source-rounded shifted-curve prices; Ex 8 forwards, including **5.01%**; Ex 9a purchase and accrued figures, Ex 9b effective annual YTM **14.76%**, and Ex 9c corrected sale **98.99%**, sale amount **989.86**, rounded proceeds **1,014.03**, and annual IRR **8.14%**. IRR retains unrounded sale/accrual, matching `docs/audit/ps4.py`. Printed rounded proceeds are tested separately. Sources: `docs/AUDIT.md` §2, `docs/audit/ps4_findings.md`, and the PS4 wording and solutions.
- [x] `npm run build` passes. On the same revision it exited 0: Astro checked 129 files with 0 errors, 0 warnings and 0 hints, then built 22 pages. The combined shell command `npm test && npm run build` exited 0 in this session.

Verification tail:

```text
 Test Files  35 passed (35)
      Tests  1151 passed (1151)
   Start at  17:47:08
   Duration  652ms (transform 37%, import 31%, tests 29%, worker 3%)

17:47:18 [build] ✓ Completed in 1.73s.
17:47:18 [build] 22 page(s) built in 2.15s
17:47:18 [build] Complete!
```

## Summary

Added `src/lib/finance/bonds.ts` and `tests/bonds.test.ts`. The library provides regular coupon schedules, prices from flat yields and spot curves, YTM by bisection with an expanding upper bound, accrued coupon, clean/dirty conversion, zero-coupon spots, coupon-bond bootstrap, implied forwards, Macaulay and modified duration, convexity, and duration/convexity price-change approximations. Explicit cash flows support irregular payment dates such as PS4 Ex 9. Tests include invalid inputs and a YTM at the nearest representable rate above −100%.

Coupon rates and YTM are annual nominal rates compounded at the stated frequency, default annual. Spot and forward rates are annual effective rates. Accrued interest uses Actual/Actual within a coupon period, counting UTC civil days, with leap-day and boundary tests. PS4 uses simplified month fractions; the regression tests state that distinction. Curve operations require observed nodes for all nonzero cash-flow dates and reject insufficient data rather than assume interpolation. Bootstrap sorts a copy of its input and rejects duplicate maturities or nonpositive residual discount values.

Verified implementation revision: `bbb6a78f7f39820a961cbfb2e9a681458e52d51e`, rebased without conflicts onto `origin/main`. This outcome is a documentation-only follow-up commit. TASK-018 is marked done in its spec; it has no separate outcome file. No task specs, decisions, other tasks, UI or goal configuration were changed. No scope deviations or proposed follow-ups.

The local task verification commands are the delivery gate. GitHub Actions and the PR build check are ignored under the owner's explicit override. No visual checks were needed because no pages or widgets changed.
