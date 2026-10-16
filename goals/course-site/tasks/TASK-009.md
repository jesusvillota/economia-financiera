---
id: TASK-009
title: 'Finance maths library: time value, annuities, NPV, IRR'
milestone: M-2
state: approved
depends_on: [TASK-003, TASK-004]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

SC-4: all maths in `src/lib` with tests, so chapters, widgets and problem answers share one verified source.

## Scope

Implement `src/lib/finance/timeValue.ts` and `src/lib/finance/appraisal.ts`: simple and compound capitalisation, fractional (nominal vs effective, TAE, equivalent rates), present and future value, ordinary and due annuities, growing annuity, perpetuity and growing perpetuity, NPV, IRR (robust root finder with bracketing, multiple sign changes reported), payback and discounted payback, profitability index. Formulas follow `docs/AUDIT.md` (corrected where the source was wrong). Tests in `tests/timeValue.test.ts` and `tests/appraisal.test.ts`: reference values worked by hand in comments, plus the numeric answers of ps1 exercises 1 to 7 as recomputed in `docs/audit/recompute.py` (import the numbers as constants; no network). Edge cases: rate 0, negative flows, no IRR, multiple IRRs. No UI.

## Acceptance

- `npm test` passes with at least 30 assertions across the two files.
- Round-trip properties hold: PV(FV(x)) = x, NPV at the IRR is 0 within 1e-9, annuity formula equals the sum of discounted flows.
- Every ps1 numeric answer is asserted within its stated tolerance.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
