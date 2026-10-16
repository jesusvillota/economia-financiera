# TASK-039 outcome

## Acceptance

- [x] `npm test` passes, including `tests/capitulo14.test.ts` covering every number in the text. Evidence: the final sequential verification on 2026-10-16 passed **31 test files / 1077 tests**. Chapter tests recompute the original demand table, proceeds, fees, net, returns, money left, playground states and quiz answers with `markets.ts`. A numerical-token inventory rejects new figures without a test update. Metadata and the Chapter 5 link are also checked.
- [x] `npm run build` passes and `/chapters/14-opv/` renders the six sections in order. Evidence: **114 files checked; 0 errors, 0 warnings, 0 hints; 19 pages built; Complete!** The route appears in the build output. Playwright receives HTTP 200 and asserts Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen in all four theme/viewport combinations.
- [x] `npm run screenshots 14` is clean. Evidence: `chapters_14-opv-{dark,light}-{desktop,phone}.png` all passed, with no console, KaTeX or horizontal-overflow errors. The widget was also visually inspected in dark/light at 1280 px and 360 px. Controls and readouts fit both widths.
- [x] `npm run clickthrough:cap14` exercises every widget and compares readouts with the library. Evidence: **576 readout comparisons match `markets.ts`** across dark/light × 1280/360 px. Keyboard interactions exercise every offer-price step, closing-price endpoints, negative/zero/positive returns, uncovered offers, both buttons, all quizzes with wrong-answer/retry/correct-answer paths, and the derivation disclosure. No console, KaTeX or overflow errors.
- [x] No claim contradicts `docs/AUDIT.md`. Evidence: reviewed against the coverage map, curriculum and source corrections. The chapter distinguishes OPV/OPS, offer/closing/fundamental values, sample patterns versus guarantees, and first-day versus subsequent returns. Added a section-2 source clarification for note 04's universal underpricing claim, with zero/negative-return counterexamples asserted in `tests/capitulo14.test.ts`. No third-party case, slide prose or numerical example is reproduced.

## Summary

**What.** Added the Spanish chapter `src/content/chapters/14-opv.mdx` with six house-template sections, three quizzes, `sessions: []` and a Chapter 5 valuation link. The original Brisa Sensores example covers process, pricing methods, fees, initial returns, issuance cycles and long-run relative performance.

**How.** `BookBuilding.tsx` uses `WidgetFrame` and `PlotFrame`. All financial calculations come from `markets.ts`. Its only library addition is the small validated `ipoDemandAtPrice` helper, reusing the existing demand-depth function. The example data are in `src/data/ipo.ts`. Added notation rows and the `clickthrough:cap14` package script without changing existing entries.

**Explicit simplifications.** Demand indications are treated as fixed limit bids. An uncovered offer is withdrawn, with zero completed sales and no applicable initial-return readout. The first-day close is an independent scenario input. Fees are fixed at the example's chosen rate; taxes, other costs and green-shoe exercise are excluded. The maximum covering price is a teaching rule, not a claim about actual book-building discretion. Signed money left is a counterfactual comparison, not a realised accounting loss or a guarantee of achievable proceeds.

**Deviations.** None. No session was linked because PS4 is outside this task.

**Verified revision.** `0246bcac226276d50a64bee53156269b58c4fb8b` (chapter commit `3b7a8da`, after merging `origin/main` without conflicts). Only this outcome and the PR description follow verification. The complete command sequence below exited 0. The work stays on `goal/course-site/task-039`; no merge of the PR was performed.

```sh
npm test
npm run build
npm run screenshots 14
npm run clickthrough:cap14
```

Final output tail:

```text
✓ dark 1280px: sliders, both buttons, covered/uncovered offers, negative/zero/positive returns, quizzes and six sections
✓ dark 360px: sliders, both buttons, covered/uncovered offers, negative/zero/positive returns, quizzes and six sections
✓ light 1280px: sliders, both buttons, covered/uncovered offers, negative/zero/positive returns, quizzes and six sections
✓ light 360px: sliders, both buttons, covered/uncovered offers, negative/zero/positive returns, quizzes and six sections
✓ 576 readouts match markets.ts; no console, KaTeX or overflow errors

VERIFY_EXIT=0
```

**Review and checks.** PR #33 targets `main` and carries `goal:course-site` and `Goal-Task: course-site/TASK-039`. All required local checks pass. Per the explicit owner rule, GitHub Actions and the PR build check are ignored; they were not read, run or awaited.

**Proposed follow-ups.** None required for this task.
