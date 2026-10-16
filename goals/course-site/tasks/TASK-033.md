---
id: TASK-033
title: Problem Session 2 (ps2) as an interactive session
milestone: M-3
state: approved
depends_on: [TASK-021, TASK-020]
delivery: pr
---

## Why

SC-3, SC-4 and SC-5: Problem Session 2 on the same footing as ps1 (TASK-014).

## Scope

Write `src/content/sesiones/02-NOMBRE.mdx` (`number: 2`, `source: ps2`, chapters 4 to 6) from `source/problem_sets/ps2` (`valuation.ts`, `risk.ts`). Follow `docs/contracts/problem-session.md` and the ps1 session as the pattern: seeded parameters with valid ranges, 2 to 3 hints, stepwise solutions, numeric answers with a `lib` entry. Add `src/lib/sesion02.ts` (numeric wrappers over `src/lib/finance`) and `tests/sesion02.test.ts` asserting every answer: default seed vs the library, vs the frontmatter value, and an independent check on 20 random seeds; assert the corrected `docs/AUDIT.md` numbers. Fix Ex 5c and 7c (see AUDIT section 2). Skip the commented-out Ex 10 to 14. Include an exercise map in the PR (each source exercise kept or dropped with a reason). Out of scope: other sessions, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including `tests/sesion02.test.ts` over every exercise.
- `npm run build` passes and `/sesiones/02-...` renders.
- `npm run screenshots sesiones` is clean.
- `node scripts/clickthrough-sesion02.mjs` solves one exercise through hints, a wrong answer and a right answer.
- Each source exercise maps to an exercise or is dropped with a reason.

## Verify

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-sesion02.mjs
```
