---
id: TASK-050
title: Problem Session 4 (ps4) as an interactive session
milestone: M-5
state: approved
depends_on: [TASK-044, TASK-045, TASK-046, TASK-047, TASK-048]
delivery: pr
---

## Why

SC-2 and SC-5: Problem Session 4 of the DEC-001 track.

## Scope

Write `src/content/sesiones/04-NOMBRE.mdx` (`number: 4`, `source: ps4`) from `source/problem_sets/ps4` (`markets.ts`, `efficiency.ts`/`eventStudy.ts`, `bonds.ts`, `derivatives.ts`). Link chapters 11, 13 and 17 to 21 in the session `chapters:` list and add the session slug to each of those chapters' `sessions:` frontmatter (this task is the only one that edits the `sessions:` fields; update the chapter template tests that expect `sessions: []`). Follow `docs/contracts/problem-session.md` and the ps3 session as the pattern: seeded parameters with valid ranges, 2 to 3 hints, stepwise solutions, numeric answers with a `lib` entry. Add `src/lib/sesion04.ts` (numeric wrappers over `src/lib/finance`) and `tests/sesion04.test.ts` asserting every answer: default seed vs the library, vs the frontmatter value, and an independent check on 20 random seeds; assert the corrected `docs/AUDIT.md` numbers (Ex 9c, 10b, 8b, 6a). Fix the LaTeX bug and the missing numbering (Ex 5 and 7 absent). Add a futures exercise (daily margining) because the source has none. The Ex 6 quadratic YTM works for 2 years only: use the library root finder in variants. Include an exercise map in the PR (each source exercise kept or dropped with a reason). Out of scope: other sessions, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including `tests/sesion04.test.ts` over every exercise and the updated chapter tests.
- `npm run build` passes and `/sesiones/04-...` renders; chapters 11, 13 and 17 to 21 link to it and it links back.
- `npm run screenshots sesiones` is clean.
- `node scripts/clickthrough-sesion04.mjs` solves one exercise through hints, a wrong answer and a right answer.
- Each source exercise maps to an exercise or is dropped with a reason.

## Verify

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-sesion04.mjs
```
