---
id: TASK-025
title: 'Chapter 4: dividend discount model'
milestone: M-3
state: approved
depends_on: [TASK-021]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 4 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/04-dividendos.mdx` in Spanish from note 02 §1.1: rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: price against g and r (surface or paired curves), with the r > g warning; put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `valuation.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Include the zero-growth, constant-growth and two-stage cases. Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 4 covering every number in the text.
- `npm run build` passes and `/chapters/04-dividendos/` renders the six sections in order.
- `npm run screenshots 04` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap4`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 04
npm run clickthrough:cap4
```
