---
id: TASK-005
title: 'Contract: chapter and problem-session schemas'
milestone: M-1
state: approved
depends_on: [DEC-001, TASK-003]
delivery: pr
---

## Why

Contract first (SC-3, SC-4): chapters and problem sessions must share one schema before any content or component is written.

## Scope

Write `docs/contracts/chapter.md` and `docs/contracts/problem-session.md`, and implement them as Zod schemas in `src/content.config.ts` (collections `chapters` and `sesiones`). Follow the accepted DEC-001. The problem-session contract defines: frontmatter (title, number, source set e.g. `ps1`, chapters it practises, difficulty), the exercise unit (statement, parameters with seeded defaults, hint ladder, ordered solution steps, final numeric answers with tolerance, concept links), and how a numeric answer is tied to a `src/lib` function name (so tests can assert it). Add one minimal fixture file for each collection under `src/content/` that validates. No components or pages (TASK-006).

## Acceptance

- Both contract docs exist and name every frontmatter field with type and meaning.
- `npm run build` validates the two fixtures against the schemas; a deliberately broken fixture (deleted in the PR) fails `astro check`.
- `npm test` and `npm run build` pass.

## Verify

```sh
npm test && npm run build
ls docs/contracts
```
