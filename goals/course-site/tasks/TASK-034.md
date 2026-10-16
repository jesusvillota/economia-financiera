---
id: TASK-034
title: Problem Session 3 (ps3) as an interactive session
milestone: M-3
state: approved
depends_on: [TASK-023, TASK-020]
delivery: pr
---

## Why

SC-3, SC-4 and SC-5: Problem Session 3 on the same footing as ps1 (TASK-014).

## Scope

Write `src/content/sesiones/03-NOMBRE.mdx` (`number: 3`, `source: ps3`, chapters 7 to 10) from `source/problem_sets/ps3` (`portfolio.ts`, `capm.ts`). Follow `docs/contracts/problem-session.md` and the ps1 session as the pattern: seeded parameters with valid ranges, 2 to 3 hints, stepwise solutions, numeric answers with a `lib` entry. Add `src/lib/sesion03.ts` (numeric wrappers over `src/lib/finance`) and `tests/sesion03.test.ts` asserting every answer: default seed vs the library, vs the frontmatter value, and an independent check on 20 random seeds; assert the corrected `docs/AUDIT.md` numbers. Fix Ex 7. Add a short-sale variant for Ex 2 (correlation whose minimum-variance weight is outside [0,1]). Correlation matrices must stay PSD in every variant. Include an exercise map in the PR (each source exercise kept or dropped with a reason). Out of scope: other sessions, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including `tests/sesion03.test.ts` over every exercise.
- `npm run build` passes and `/sesiones/03-...` renders.
- `npm run screenshots sesiones` is clean.
- `node scripts/clickthrough-sesion03.mjs` solves one exercise through hints, a wrong answer and a right answer.
- Each source exercise maps to an exercise or is dropped with a reason.

## Verify

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-sesion03.mjs
```
