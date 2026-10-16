---
id: TASK-008
title: Landing page and course map
milestone: M-1
state: approved
depends_on: [TASK-007]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

SC-1, SC-2: a front door students use.

## Scope

Build the home page in Spanish: pitch, the course map as parts and chapters grouped by session (from `docs/AUDIT.md` section 4 as settled by DEC-002), a clear second track for problem sessions, and per-chapter cards with difficulty and prerequisites, driven from `src/data/curriculum.ts` (chapters not yet written show as `Próximamente`). Add a course preview SVG in `public/`, README rewrite (what, who for, how to run) and `LICENSE` (MIT code) + `LICENSE-CONTENT.md` (CC BY 4.0), mirroring options-explained. Out of scope: real chapters.

## Acceptance

- `npm run build` passes and the home page lists every curriculum entry, marking unwritten ones `Próximamente`.
- `npm run screenshots` is clean for the home page (both themes, desktop and phone).
- `src/data/curriculum.ts` matches the proposed curriculum in `docs/AUDIT.md` (a Vitest test compares chapter slugs with `src/content/chapters`, allowing unwritten ones flagged).

## Verify

```sh
npm test && npm run build
npm run screenshots home
```
