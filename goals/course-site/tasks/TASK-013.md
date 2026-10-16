---
id: TASK-013
title: 'Chapter 3: NPV, IRR and investment criteria'
milestone: M-2
state: approved
depends_on: [TASK-009, TASK-010]
delivery: pr
---

## Why

SC-2. Part I of the lectures (session 1), chapter 3.

## Scope

Write `src/content/chapters/03-<slug>.mdx` (NPV, IRR and investment criteria) in the house template from `docs/STYLE_GUIDE.md`, in Spanish, 1,500 to 3,000 words. Topics: project as cash-flow timeline, NPV rule, IRR as a root (NPV profile plot), payback, conflicts between NPV and IRR, multiple IRRs. Start from `source/class_notes/01_fundamentos_basicos/01_fundamentos_basicos.tex` but rewrite: the source is not the truth, fix what `docs/AUDIT.md` lists. Widgets: `CashFlowTimeline` plus an NPV-profile widget (draggable rate, IRR crossing marked), reusing TASK-010 components and `src/lib/finance`. Sections Hook, Intuition, Formalisation, Playground, Check yourself (2 to 3 `<Quiz>`), Recap & next up. Update `src/data/curriculum.ts` status and add any new notation to the style guide table. Practice exercises belong to Problem Session 1 (ps1 section 3); link to it, do not duplicate. One commit.

## Acceptance

- `npm run build` passes and chapter 3 renders with all six template sections in order.
- `npm run screenshots 03` is clean (no console, KaTeX or overflow errors) in both themes, desktop and phone.
- Every formula in the chapter that gives a number is reproduced by a `src/lib/finance` function (no formula re-implemented in a component).
- A Playwright click-through of each widget in the chapter changes the readout as expected.
- A reviewer can find no claim contradicted by `docs/AUDIT.md`.

## Verify

```sh
npm test && npm run build
npm run screenshots 03
```
