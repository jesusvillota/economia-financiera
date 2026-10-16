---
id: TASK-039
title: 'Chapter 14: initial public offerings'
milestone: M-4
state: approved
depends_on: [TASK-035]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 14 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 and M-3 chapters.

## Scope

Write `src/content/chapters/14-opv.mdx` in Spanish from note 04 (IPOs: process, pricing methods, underpricing, cycles, long-run underperformance) and `docs/AUDIT.md`. Widget: a book-building price chooser (demand schedule, price slider, proceeds, underpricing and money left on the table) calling only `markets.ts` (TASK-035). The local files under `~/GitHub/_Other_/Teaching/TA_Financial_Markets/lecture_notes/bermejo_materiales_curso_2026-10-15` (IPO slides, Netscape case) are third-party: read for topics only, never copy or paraphrase closely; write your own example company and numbers. Valuation links back to chapter 5 (DCF). Template and notation from `docs/STYLE_GUIDE.md` (read `src/content/chapters/01-interes.mdx` and one M-3 chapter first). Rewrite, do not copy; original examples; no third-party slide or case content. 3 `<Quiz>` blocks. Tests assert every number in the text against the library. Add new symbols to the notation table, new scripts to `package.json` and source errors to `docs/AUDIT.md` section 2 (each with a test). Link the chapter in `sessions:` frontmatter only if the session exists (PS4 is built in M-5: leave `sessions: []`). Several chapter PRs touch `package.json`, `docs/AUDIT.md` and `docs/STYLE_GUIDE.md`: append only, and merge `origin/main` before you finish. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new `tests/capitulo14.test.ts` covering every number in the text.
- `npm run build` passes and `/chapters/14-opv/` renders the six sections in order.
- `npm run screenshots 14` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap14`) exercises each widget and compares readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 14
npm run clickthrough:cap14
```
