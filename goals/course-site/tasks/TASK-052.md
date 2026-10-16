---
id: TASK-052
title: 'Glossary page /glosario: terms and notation from the style guide, linked from the nav'
milestone: M-6
state: approved
depends_on: []
delivery: pr
---

## Why

SC-2: a reader meets terms (TIR, VAN, beta, duración…) across 21 chapters; a glossary gives one place to look up each term and symbol.

## Scope

Add `src/data/glossary.ts` (typed list: term, Spanish definition of one or two sentences, symbol if any, links to the chapters where it is introduced) and `src/pages/glosario.astro` rendered in the house style with an alphabetical index. Cover every symbol in the `docs/STYLE_GUIDE.md` Notation table and at least 60 terms from the chapters. Write original definitions. Add a `Glosario` link to `CourseNav.astro` only (no other layout change). Tests in `tests/glosario.test.ts`: unique ids, every chapter link exists in `curriculum.ts`, every notation-table symbol has an entry. Out of scope: search (TASK-056), chapter edits.

## Acceptance

- `npm test` passes, with the new glossary tests.
- `npm run build` passes and `dist/glosario/index.html` exists.
- `npm run screenshots dev` or the glossary page shows no console, KaTeX or overflow error in dark/light, desktop/phone.

## Verify

```sh
npm test
npm run build
test -f dist/glosario/index.html && echo ok
npm run screenshots glosario
```
