---
id: TASK-037
title: 'Chapter 12: market structure, venues and participants'
milestone: M-4
state: approved
depends_on: [TASK-017]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 12 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 and M-3 chapters.

## Scope

Write `src/content/chapters/12-estructura-mercado.mdx` in Spanish from note 05 §2, §4 and §5 (market classification, participants, venues, OTC). Widget: a venue-classification sorter (drag or select each example into regulated market, MTF, OTC, dark pool and so on) in `src/components/plots/`, using `WidgetFrame`; the example data lives in a small typed data file, not in the component. No new maths: the chapter is Quiz and sorter only, so there is no lib dependency. Note 05 §3 (trading) belongs to chapter 13. Template and notation from `docs/STYLE_GUIDE.md` (read `src/content/chapters/01-interes.mdx` and one M-3 chapter first). Rewrite, do not copy; original examples; no third-party slide or case content. 3 `<Quiz>` blocks. Tests assert every number in the text against the library. Add new symbols to the notation table, new scripts to `package.json` and source errors to `docs/AUDIT.md` section 2 (each with a test). Link the chapter in `sessions:` frontmatter only if the session exists (PS4 is built in M-5: leave `sessions: []`). Several chapter PRs touch `package.json`, `docs/AUDIT.md` and `docs/STYLE_GUIDE.md`: append only, and merge `origin/main` before you finish. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new `tests/capitulo12.test.ts` covering every number in the text.
- `npm run build` passes and `/chapters/12-estructura-mercado/` renders the six sections in order.
- `npm run screenshots 12` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap12`) exercises each widget and compares readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 12
npm run clickthrough:cap12
```
