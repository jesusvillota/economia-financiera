# TASK-041 outcome: Chapter 16, behavioural finance

## Acceptance

- [x] `npm test` exits 0. Final run: **31 test files, 1,060 tests passed**. New `tests/capitulo16.test.ts` has eight tests for every numeric claim and example in the chapter, a numeric inventory to detect uncovered additions, frontmatter/template, bias answer key and the source correction.
- [x] `npm run build` exits 0. Astro check: **115 files, 0 errors, 0 warnings**. Static build: **19 pages** including `/chapters/16-conductuales/` (under the site's `/economia-financiera` base). The browser script asserts HTTP 200 and the six sections in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen.
- [x] `npm run screenshots 16` exits 0. All four dark/light × desktop/phone screenshots pass with no browser console, KaTeX or horizontal overflow errors. Inspected full-page and widget images for both themes and widths. Screenshots remain local in the ignored `screenshots/` directory.
- [x] `npm run clickthrough:cap16` exits 0. **756 readout comparisons** against `efficiency.ts` and `biases.ts`, across dark/light × 1280/360 px. Exercises all four sliders, endpoints, probability weighting, keyboard input, reset, every bias selector with wrong/correct/cleared answers, score/reset, all three Quiz blocks and the formula disclosure. No browser console, KaTeX or overflow errors.
- [x] No chapter claim contradicts `docs/AUDIT.md`. Reviewed note 08 §4 and the audit coverage/curriculum. Added an append-only section-2 correction for the source's claim about symmetric classical utility. The named regression test demonstrates asymmetric changes with concave log utility and rejection of a positive-mean gamble. The chapter distinguishes this from reference-dependent loss aversion, states the separate-outcome weighting approximation, and makes no promise of profitable trading.

## Summary

**What.** Added the Spanish Chapter 16 (about 1,700 words), the prospect-theory value-function plot and gamble evaluator, five-case bias classifier, and exactly three Quiz blocks. Frontmatter retains curriculum prerequisite 15 and `sessions: []`.

**How.** All financial widget calculations call the existing `src/lib/finance/efficiency.ts`; no finance-library changes were needed. PlotFrame, WidgetFrame and shared controls provide the house layout. The bias examples and scoring live in `src/data/biases.ts`. Added the browser script/package command and notation rows. All examples are original; no third-party slide or case content was used.

**Deviations.** None. The evaluator explicitly uses separate-outcome weights rather than the full cumulative prospect-theory model, matching TASK-036's library contract. GitHub Actions and the PR build check were neither read nor used as a gate, per the owner override; all four local Verify commands passed.

**Verified revision.** `84983c0103b9e291a59f1d7e44853e2b7b836ba9`, after merging `origin/main` (`46d56c4`) without conflicts into `goal/course-site/task-041`. Chapter implementation commit: `87f5253`. This outcome is the only subsequent file change. Remained on the assigned branch. PR #35 targets `main`; never merged.

**Proposed follow-ups.** None required for this task. The deliberate simplified weighting model is explained in the chapter and widget caption.

Final verification tail from this session (all commands run sequentially with `set -e`):

```text
 Test Files  31 passed (31)
      Tests  1060 passed (1060)
npm test exit=0
17:11:55 [build] 19 page(s) built in 2.09s
17:11:55 [build] Complete!
npm run build exit=0
✓ chapters_16-conductuales-dark-desktop.png
✓ chapters_16-conductuales-dark-phone.png
✓ chapters_16-conductuales-light-desktop.png
✓ chapters_16-conductuales-light-phone.png
npm run screenshots 16 exit=0
✓ light 360px: bias controls, three quizzes, details and six sections; no console, KaTeX or overflow errors
✓ 756 readout comparisons against efficiency.ts and biases.ts; Chapter 16 click-through passed
npm run clickthrough:cap16 exit=0
```
