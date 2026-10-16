---
id: TASK-011
title: 'Chapter 1: interest, simple vs compound'
milestone: M-2
state: approved
depends_on: [TASK-009, TASK-010, TASK-007]
delivery: pr
---

## Why

SC-2. Part I of the lectures (session 1), chapter 1.

## Scope

Write `src/content/chapters/01-<slug>.mdx` (interest, simple vs compound) in the house template from `docs/STYLE_GUIDE.md`, in Spanish, 1,500 to 3,000 words. Topics: why money has a time value, simple vs compound capitalisation, fractional periods, effective vs nominal rate. Start from `source/class_notes/01_fundamentos_basicos/01_fundamentos_basicos.tex` but rewrite: the source is not the truth, fix what `docs/AUDIT.md` lists. Widgets: `GrowthCurves` plus one new small widget if the hook needs it, reusing TASK-010 components and `src/lib/finance`. Sections Hook, Intuition, Formalisation, Playground, Check yourself (2 to 3 `<Quiz>`), Recap & next up. Update `src/data/curriculum.ts` status and add any new notation to the style guide table. Practice exercises belong to Problem Session 1 (ps1 section 1); link to it, do not duplicate. One commit.

## Acceptance

- `npm run build` passes and chapter 1 renders with all six template sections in order.
- `npm run screenshots 01` is clean (no console, KaTeX or overflow errors) in both themes, desktop and phone.
- Every formula in the chapter that gives a number is reproduced by a `src/lib/finance` function (no formula re-implemented in a component).
- A Playwright click-through of each widget in the chapter changes the readout as expected.
- A reviewer can find no claim contradicted by `docs/AUDIT.md`.

## Verify

```sh
npm test && npm run build
npm run screenshots 01
```
