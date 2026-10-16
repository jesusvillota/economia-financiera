---
id: TASK-038
title: 'Chapter 13: trading, orders, margin, short sales and costs'
milestone: M-4
state: approved
depends_on: [TASK-035]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 13 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 and M-3 chapters.

## Scope

Write `src/content/chapters/13-negociacion.mdx` in Spanish from note 05 §3 (orders, costs, margin, short sales). Widgets: an order-book simulator (submit market or limit orders, see the average price and cost) and a margin and short-sale account (price slider, margin call line), both calling only `markets.ts` (TASK-035). Feeds PS4 Ex 1 to 3. Note 05 §3 must agree with the audited answers. Template and notation from `docs/STYLE_GUIDE.md` (read `src/content/chapters/01-interes.mdx` and one M-3 chapter first). Rewrite, do not copy; original examples; no third-party slide or case content. 3 `<Quiz>` blocks. Tests assert every number in the text against the library. Add new symbols to the notation table, new scripts to `package.json` and source errors to `docs/AUDIT.md` section 2 (each with a test). Link the chapter in `sessions:` frontmatter only if the session exists (PS4 is built in M-5: leave `sessions: []`). Several chapter PRs touch `package.json`, `docs/AUDIT.md` and `docs/STYLE_GUIDE.md`: append only, and merge `origin/main` before you finish. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new `tests/capitulo13.test.ts` covering every number in the text.
- `npm run build` passes and `/chapters/13-negociacion/` renders the six sections in order.
- `npm run screenshots 13` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap13`) exercises each widget and compares readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 13
npm run clickthrough:cap13
```
