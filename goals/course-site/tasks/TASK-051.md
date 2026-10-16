---
id: TASK-051
title: 'Final-exam preparation page (examen): rentas plus mixed exercises of graded difficulty'
milestone: M-5
state: approved
depends_on: [TASK-042, TASK-044]
delivery: pr
---

## Why

SC-2 and SC-5: the final-exam preparation page of the DEC-001 track (owner: the rentas exercise is practice for the final exam; the page mixes exercises of varying difficulty).

## Scope

Write `src/content/sesiones/examen-final.mdx` with `source: examen` and per-exercise `difficulty` (schema from TASK-020; read `docs/contracts/problem-session.md`). Content: the rentas exercise from `source/problem_sets/exam` (semi-annual growing deferred annuity, multiple choice a/b/c: check the options by brute-force summation; vary periodicities with seeded parameters), plus 6 to 8 new mixed exercises at difficulty 1, 2 and 3 covering annuities and NPV/IRR (chapters 2, 3), a DDM or WACC valuation (4, 5), a two-asset portfolio and CAPM (7, 10) and a bond price and duration (17, 19). New problems are original, built from the library wrappers: do not copy ps exercises verbatim, vary them. Add `src/lib/examen.ts` (numeric wrappers over `src/lib/finance`) and `tests/examen.test.ts` asserting every answer: default seed vs the library, vs the frontmatter value, and 20 random seeds; every difficulty level has at least two exercises. Add the page to the landing and course map if the navigation needs a link (`src/data/curriculum.ts` `finalExam` already exists: keep it in sync). Include an exercise map in the PR. Out of scope: other sessions; chapter edits.

## Acceptance

- `npm test` passes, including `tests/examen.test.ts` and `tests/curriculum.test.ts`.
- `npm run build` passes and the exam page renders with exercises ordered or filterable by difficulty.
- `npm run screenshots sesiones` is clean.
- `node scripts/clickthrough-examen.mjs` solves the rentas exercise through hints, a wrong answer and a right answer.
- The rentas options a/b/c are decided by brute-force summation in the test, not by a copied answer.

## Verify

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-examen.mjs
```
