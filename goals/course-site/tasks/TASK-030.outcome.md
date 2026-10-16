# TASK-030 outcome

## Acceptance

- [x] `npm test` passes, including the new `tests/capitulo9.test.ts`. The final required command sequence exited 0 with **619 tests in 21 files**. The chapter tests cover every financial number in the hook, asset inputs, tangent weights and moments, Sharpe ratios, four allocation-table rows, euro budgets, playground prompts, negative-weight example and numerical quiz. Structural constants and model conditions are also checked.
- [x] `npm run build` passes and `/chapters/09-activo-libre-riesgo/` renders six sections in order. Astro reported **0 errors, 0 warnings and 0 hints**, and built **11 pages**. Playwright checked HTTP 200 and Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen in both themes at 1280 and 360 px.
- [x] `npm run screenshots 09` passes for **dark/light × desktop/phone** with no console, KaTeX or page overflow errors. Full-page screenshots and enlarged widget views were visually inspected. The chapter remains usable at 360 px in the click-through.
- [x] `npm run clickthrough:cap9` passes with **1,520 readout comparisons** against the actual `capm.ts` and `portfolio.ts` modules. It moves correlation, risky-fund return, allocation weight and short-sale controls; tests keyboard input, borrowing, zero allocation, singular endpoints, long-only clamping, both draggable points and all three quizzes. Every displayed computed readout is compared with the library. The existing frontier click-through also passes with **260 comparisons**.
- [x] No claim contradicts `docs/AUDIT.md`. Read note 03 §4–§5 and the dependency outcomes. Original inputs replace the source examples. Added the note 03 missing-CAL-branch restriction to audit section 2 with a negative-weight regression test. Separation is explicitly conditional on common expectations, opportunity sets, restrictions, mean-variance preferences and equal lending/borrowing rates. No claim identifies T with the market before CAPM assumptions apply.

## Summary

Added the Spanish chapter in the house template, with three quizzes and a CAL widget overlaid on `EfficientFrontier`. All financial computations use `capm.ts` and `portfolio.ts`; no library changes were needed. Small optional frontier composition slots add controls, readouts and axis bounds while preserving existing callers. The overlay draws the candidate CAL, unrestricted tangent reference and a draggable final portfolio. Pointer handling keeps plot labels from intercepting the portfolio handle.

Added the new symbols to the style guide. PS3 does not yet exist in this checkout, so there is no `sessions:` frontmatter or broken session link. No task specification, other task, decision, goal configuration, policy or route was edited. No material decision remains and no follow-up implementation is proposed.

Rebased this task branch onto `origin/main` at `dce3255ebaaa17f2ac48739a228bef8707bb99f5` before editing, without conflicts. Verified implementation revision: `78f5405f83956740c20b3d4ae6e9f7e5fc1d9ae1`. Final required command sequence: `npm test && npm run build && npm run screenshots 09 && npm run clickthrough:cap9`, exit **0**. `git diff --check` also passes. Existing build messages about euro glyph metrics do not affect this chapter's KaTeX checks.

Final verification tail:

```text
✓ light 360px: cal-portfolio drag; readouts match capm.ts and portfolio.ts
✓ light 360px: frontier-portfolio drag; readouts match capm.ts and portfolio.ts
✓ 1520 library readout comparisons; all controls, both drags, quizzes and six sections pass; no console, KaTeX or overflow errors
```

## Delivery

PR: https://github.com/jesusvillota/economia-financiera/pull/28. Base: `main`. Label: `goal:course-site`. Body contains `Goal-Task: course-site/TASK-030`. No merge performed. Final readiness follows the PR's check status after pushing this outcome.
