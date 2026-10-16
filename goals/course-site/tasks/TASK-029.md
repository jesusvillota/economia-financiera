---
id: TASK-029
title: 'Chapter 8: Markowitz, many assets and the efficient frontier'
milestone: M-3
state: approved
depends_on: [TASK-024]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 8 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/08-markowitz.mdx` in Spanish from note 03 §3: rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: three-asset weight explorer built on `EfficientFrontier` (TASK-024); put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `portfolio.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 8 covering every number in the text.
- `npm run build` passes and `/chapters/08-markowitz/` renders the six sections in order.
- `npm run screenshots 08` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap8`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 08
npm run clickthrough:cap8
```
