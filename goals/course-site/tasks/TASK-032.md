---
id: TASK-032
title: 'Chapter 11: beyond CAPM, event studies, Fama-French, APT'
milestone: M-3
state: approved
depends_on: [TASK-023]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 11 of the curriculum (`docs/AUDIT.md` section 4) in the house template, following the M-2 reference chapters.

## Scope

Write `src/content/chapters/11-mas-alla-capm.mdx` in Spanish from note 07 §7 and note 03 §9: rewrite, do not copy; original examples. Template and notation from `docs/STYLE_GUIDE.md` (read `01-interes.mdx` first). Widget: event-window CAR plot; put it in `src/components/plots/` using `PlotFrame` + `WidgetFrame`, calling only `eventStudy.ts and capm.ts`. 3 `<Quiz>` blocks. Add tests asserting every number in the text against the library. Add any new symbol to the notation table. Log any source error found in `docs/AUDIT.md` section 2 with its test. Fama-French, Carhart and APT stay descriptive (no new data). Link to the session in the `sessions:` frontmatter if it exists. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new test file for chapter 11 covering every number in the text.
- `npm run build` passes and `/chapters/11-mas-alla-capm/` renders the six sections in order.
- `npm run screenshots 11` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap11`) moves each widget and compares the readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 11
npm run clickthrough:cap11
```
