---
id: TASK-028
title: 'Chapter 7: two assets, correlation and diversification'
milestone: M-3
state: approved
depends_on: [TASK-024]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 7 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/07-dos-activos.mdx` in Spanish from note 03 §2 (note 06 is a duplicate and is dropped): rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: `EfficientFrontier` (TASK-024) with an rho slider, plus a short worked panel; put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `portfolio.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 7 covering every number in the text.
- `npm run build` passes and `/chapters/07-dos-activos/` renders the six sections in order.
- `npm run screenshots 07` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap7`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 07
npm run clickthrough:cap7
```
