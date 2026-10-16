---
id: TASK-040
title: 'Chapter 15: market efficiency'
milestone: M-4
state: approved
depends_on: [TASK-036]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 15 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 and M-3 chapters.

## Scope

Write `src/content/chapters/15-eficiencia.mdx` in Spanish from note 08 §2 and §3 (efficiency concept, weak, semi-strong and strong forms, empirical evidence). Widget: a random-walk versus trend demo (seeded paths, autocorrelation and variance-ratio readouts, a momentum rule with costs) calling only `efficiency.ts` (TASK-036); add an event-window panel reusing the existing `EventWindow` component for the semi-strong form. Chapter 11 is a prerequisite (event studies). Template and notation from `docs/STYLE_GUIDE.md` (read `src/content/chapters/01-interes.mdx` and one M-3 chapter first). Rewrite, do not copy; original examples; no third-party slide or case content. 3 `<Quiz>` blocks. Tests assert every number in the text against the library. Add new symbols to the notation table, new scripts to `package.json` and source errors to `docs/AUDIT.md` section 2 (each with a test). Link the chapter in `sessions:` frontmatter only if the session exists (PS4 is built in M-5: leave `sessions: []`). Several chapter PRs touch `package.json`, `docs/AUDIT.md` and `docs/STYLE_GUIDE.md`: append only, and merge `origin/main` before you finish. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new `tests/capitulo15.test.ts` covering every number in the text.
- `npm run build` passes and `/chapters/15-eficiencia/` renders the six sections in order.
- `npm run screenshots 15` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap15`) exercises each widget and compares readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 15
npm run clickthrough:cap15
```
