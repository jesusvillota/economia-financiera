---
id: TASK-007
title: Style guide, notation table and repo CLAUDE.md
milestone: M-1
state: approved
depends_on: [TASK-003, DEC-001, DEC-002]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

Consistency across many chapters written by different sessions (SC-2).

## Scope

Write `docs/STYLE_GUIDE.md` and repo `CLAUDE.md`, adapted from options-explained's (see https://github.com/jesusvillota/options-explained, files `docs/STYLE_GUIDE.md`, `CLAUDE.md`) but in a way that fits this course: Spanish voice (tuteo, short sentences, honest simplifications), the chapter template Hook -> Intuition -> Formalisation -> Playground -> Check yourself -> Recap with Spanish `section-tag`s, the problem-session voice per DEC-001, the notation table from `docs/AUDIT.md` section 3 (resolve clashes), colour semantics (CSS variables from TASK-003), the euro sign and decimal comma rules in prose vs in math, widget rules, verification checklist, one-commit-per-chapter rule. `CLAUDE.md` lists commands, stack, rules and gotchas and links the guide and the curriculum. Update `src/lib/katexMacros.ts` so every notation-table symbol that needs a macro has one. No chapter content.

## Acceptance

- `docs/STYLE_GUIDE.md` has sections Voice, Chapter template, Problem-session template, Notation, Colours, Widgets, Checklist.
- Every symbol in the notation table that uses a macro is defined in `src/lib/katexMacros.ts`; a Vitest test renders each macro with KaTeX without error.
- `CLAUDE.md` exists and lists the real npm scripts of `package.json`.
- `npm test && npm run build` pass.

## Verify

```sh
npm test && npm run build
ls docs/STYLE_GUIDE.md CLAUDE.md
```
