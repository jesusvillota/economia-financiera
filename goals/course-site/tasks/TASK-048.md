---
id: TASK-048
title: 'Chapter 21: options, payoffs and strategies'
milestone: M-5
state: approved
depends_on: [TASK-043]
delivery: pr
---

## Why

SC-2 and SC-5: chapter 21 of the curriculum (`docs/AUDIT.md` section 4, Part V, DEC-002 option B) in the house template.

## Scope

Write `src/content/chapters/21-opciones.mdx` in Spanish. Widget: a payoff diagram with a strategy picker (legs, strikes, premiums, breakevens) calling only `derivatives.ts` (TASK-043). Option pricing depth: link to options-explained (https://jesusvillota.github.io/options-explained/), do not rewrite it. Feeds PS4 Ex 10. Prerequisite: chapter 20. Template and notation from `docs/STYLE_GUIDE.md` (read `src/content/chapters/01-interes.mdx` and one M-4 chapter first). Rewrite, do not copy; original examples; no third-party slide content (the Bermejo slides under `~/GitHub/_Other_/Teaching/TA_Financial_Markets/lecture_notes/bermejo_materiales_curso_2026-10-15` are topic context only). There is no class note for this topic: write from first principles and `source/problem_sets/ps4`. 3 `<Quiz>` blocks. Tests assert every number in the text against the library. Add new symbols to the notation table, new scripts to `package.json`, and source errors to `docs/AUDIT.md` section 2 (each with a test). Leave `sessions: []` (PS4 adds the links). Chapters touch `package.json`, `docs/AUDIT.md` and `docs/STYLE_GUIDE.md` in parallel: append only and merge `origin/main` before you finish. Out of scope: other chapters, lib changes beyond small additions.

## Acceptance

- `npm test` passes, including a new `tests/capitulo21.test.ts` covering every number in the text.
- `npm run build` passes and `/chapters/21-opciones/` renders the six sections in order.
- `npm run screenshots 21` is clean (dark/light x desktop/phone: no console, KaTeX or overflow errors).
- A Playwright click-through script (`npm run clickthrough:cap21`) exercises each widget and compares readouts with the library values.
- No claim contradicts `docs/AUDIT.md`.

## Verify

```sh
npm test
npm run build
npm run screenshots 21
npm run clickthrough:cap21
```
