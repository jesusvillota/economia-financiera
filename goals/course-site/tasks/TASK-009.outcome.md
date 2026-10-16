## Acceptance

- [x] `npm test` passes with at least 30 assertions across the two files. Evidence: 26 tests pass, 3 files; about 88 `expect`/`near` assertion lines in `tests/timeValue.test.ts` (55) and `tests/appraisal.test.ts` (33), several inside loops.
- [x] Round-trip properties hold. Evidence: `PV(FV(x)) = x` (incl. rate 0, negative flows) in `timeValue.test.ts`; `NPV(IRR) = 0` within 1e-9 for four flow sets in `appraisal.test.ts`; annuity, growing annuity and due formulas equal the sum of discounted flows.
- [x] Every ps1 numeric answer is asserted within its stated tolerance. Evidence: Ex 1 to 10 asserted with the tolerances of `docs/audit/ps1.py`, using the corrected values of `docs/AUDIT.md` (Ex 4, 6, 8 PRD, 2d, 3c, 5c, 7).
- [x] `npm run build` passes. Evidence: `astro check && astro build` completed, 2 pages built.

## Summary

- **What:** `src/lib/finance/timeValue.ts` (capitalisation, nominal/effective/TAE/equivalent rates, PV/FV, ordinary and due annuities, growing annuity, perpetuities) and `src/lib/finance/appraisal.ts` (NPV, IRR, payback, discounted payback, PI).
- **How:** IRR scans [-99%, 1000%] on a 0.1% grid for sign changes and bisects each; it returns all roots and a `multiple` flag. Rate 0 and r = g limits are handled. Perpetuities throw if r <= 0 or r <= g.
- **Deviations:** ps1 constants are in the tests (corrected values), not imported from Python. The exam (rentas) is not covered (not in scope). IRR misses a double root where NPV touches 0 without crossing (`ponytail:` comment).
- **Verified revision:** see PR head commit.
- **Follow-ups:** none.
