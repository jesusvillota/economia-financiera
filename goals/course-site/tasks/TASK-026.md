---
id: TASK-026
title: 'Chapter 5: firm valuation, FCFF, FCFE, WACC'
milestone: M-3
state: approved
depends_on: [TASK-021]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 5 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/05-empresa-wacc.mdx` in Spanish from note 02 §1.2: rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: DCF bar builder (FCFF bars, terminal value, equity bridge); put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `valuation.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Cover FCFF vs FCFE and when each applies. Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 5 covering every number in the text.
- `npm run build` passes and `/chapters/05-empresa-wacc/` renders the six sections in order.
- `npm run screenshots 05` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap5`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 05
npm run clickthrough:cap5
```
