---
id: TASK-014
title: Problem Session 1 (ps1) as an interactive session
milestone: M-2
state: approved
depends_on: [TASK-006, TASK-009, TASK-004]
delivery: pr
---

## Why

SC-3, SC-4, SC-5: first problem session, the template for ps2 to ps4 and the exam.

## Scope

Turn `source/problem_sets/ps1/ps1_solutions.tex` into `src/content/sesiones/01-interes-y-rentas.mdx` per `docs/contracts/problem-session.md` and DEC-001. Keep the exercise topics (simple and compound interest, finite annuities and perpetuities, project appraisal) but treat the source as a draft: recompute every answer (see `docs/AUDIT.md`), improve wording, and change numbers where a better teaching case exists. Each exercise: statement with seeded parameters, 2 to 3 hints, stepwise solution with KaTeX, numeric checker, link to the chapter section it practises (chapters 1 to 3 may be unmerged: link by slug and flag `pendiente` in the contract field). Answer functions come from `src/lib/finance`; add `tests/sesion01.test.ts` asserting that the default-seed answer of every exercise equals the library value and that 20 random seeds produce self-consistent answers. No cluster jobs.

## Acceptance

- `npm test` passes, including `tests/sesion01.test.ts` over every exercise of the session.
- `npm run build` passes and `/sesiones/01-interes-y-rentas` renders.
- `npm run screenshots sesiones` is clean (both themes, desktop and phone).
- Each exercise in the source ps1 maps to an exercise in the session or is listed as dropped with a reason in the task outcome.
- A Playwright click-through solves one exercise via hints, wrong answer and right answer.

## Verify

```sh
npm test && npm run build
npm run screenshots sesiones
```
