---
id: TASK-027
title: 'Chapter 6: return and risk of one asset'
milestone: M-3
state: approved
depends_on: [TASK-021]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 6 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/06-rentabilidad-riesgo.mdx` in Spanish from note 02 §2 and the moments appendix: rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: scenario table with live E and sigma; put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `risk.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Merge the moments appendix here. Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 6 covering every number in the text.
- `npm run build` passes and `/chapters/06-rentabilidad-riesgo/` renders the six sections in order.
- `npm run screenshots 06` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap6`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 06
npm run clickthrough:cap6
```
