---
id: TASK-020
title: 'M-2 follow-ups: screenshots port, contract docs, ps1 links, audit entry'
milestone: M-3
state: approved
depends_on: [TASK-016]
delivery: pr
---

## Why

Lessons from M-2 (agent-inbox and outcome files): fix the small shared defects before 8 chapters and 2 sessions build on them.

## Scope

1. `scripts/screenshots.mjs`: choose a free port (or read `PORT`) so parallel worktrees do not collide (also the clickthrough scripts if they hard-code a port). 2. Document `{{answer_id}}` in solution steps in `docs/contracts/problem-session.md`. 3. In `src/content/sesiones/01-interes-y-rentas.mdx` set the real chapter slugs (`01-interes`, `02-valor-actual`, `03-van-tir`), remove the YAML `pendiente` comment, and link the chapters back to ps1 (`sessions:` frontmatter). 4. Remove or renumber the fixture session `00-ejemplo` (it also has `number: 1`) and update tests that use it. 5. Add the note-01 growing-annuity error (7.710 vs 7.439,81 EUR) to `docs/AUDIT.md` section 2. 6. Let the session contract carry `source: examen` and a per-exercise `difficulty` (needed by the final-exam page in M-5); update schema, docs and a test. Out of scope: content changes.

## Acceptance

- Two `npm run screenshots` runs at the same time on different builds both pass (no port collision).
- `npm test` passes, including a schema test for `source: examen` and per-exercise `difficulty`.
- `npm run build` passes and ps1 links resolve to the three chapters and back.
- `docs/AUDIT.md` lists the growing-annuity error with its test.

## Verify

```sh
npm test
npm run build
npm run screenshots sesiones
```
