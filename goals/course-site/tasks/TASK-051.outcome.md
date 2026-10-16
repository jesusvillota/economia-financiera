# TASK-051 outcome

## Acceptance

Verified in this session on 2026-10-16 at implementation revision `2a184914a3c1e02435deaaba9b062452eceed132`, after rebasing onto `origin/main` without conflicts. The outcome commit adds documentation only.

- [x] `npm test` passes, including `tests/examen.test.ts` and `tests/curriculum.test.ts`. The final full run passed **42 files and 1303 tests**. Its verbose output includes **38 exam tests** and **3 curriculum tests**. Every exam answer is checked against its library wrapper, frontmatter default, independent arithmetic and 20 reproducible random seeds. The normal `npm test` command also passed before the rebase (38 files, 1256 tests).
- [x] `npm run build` passes and the exam renders with exercises ordered by difficulty. Astro checked **152 files with 0 errors, 0 warnings and 0 hints**, then built **28 pages**, including `/sesiones/examen-final/`. The browser script checks the landing link, exam title and visible difficulty order **1, 1, 2, 2, 2, 3, 3, 3** in both themes at 1280 px and 360 px. Every difficulty has at least two exercises.
- [x] `npm run screenshots sesiones` exits 0. All **20 screenshots** pass: the session index and four existing exercise pages, each in dark/light and desktop/phone. No browser console errors, KaTeX errors or horizontal overflow. Visually reviewed the complete exam page in all four combinations using contact sheets. Images are generated under ignored `screenshots/`.
- [x] `node scripts/clickthrough-examen.mjs` exits 0. In dark/light at 1280/360 px, the script reveals all three rentas hints in order, rejects incorrect option and value inputs, accepts both correct answers computed independently, verifies solved progress, reveals four solution steps, generates a new variant, checks reset state, and solves that variant too. No console, KaTeX or overflow errors.
- [x] Rentas options a/b/c are decided by brute-force summation in the test. `sumRentas` discounts **20,000 individual payments** at their actual dates; `chooseBySum` requires exactly one matching option. It does not assert a copied answer index. Coverage includes the source periodicities, 20 seeded variants and every payment/discount frequency pair at the slowest-convergence corner. Browser checking uses its own payment sum as well.

The final combined shell ran the following verification sequence with `set -e` and exited **0**. The test invocation added `-- --reporter=verbose` to preserve individual test evidence.

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-examen.mjs
```

Tail excerpts from that run:

```text
 Test Files  42 passed (42)
      Tests  1303 passed (1303)
Result (152 files):
- 0 errors
- 0 warnings
- 0 hints
19:52:53 [build] 28 page(s) built in 2.41s
✓ sesiones_03-carteras-y-capm-light-phone.png
✓ sesiones_examen-final-dark-desktop.png
✓ sesiones_examen-final-dark-phone.png
✓ sesiones_examen-final-light-desktop.png
✓ sesiones_examen-final-light-phone.png
✓ dark 1280px: landing link, ordered difficulty, hints, wrong/right answers, solution and seeded variant
✓ dark 360px: landing link, ordered difficulty, hints, wrong/right answers, solution and seeded variant
✓ light 1280px: landing link, ordered difficulty, hints, wrong/right answers, solution and seeded variant
✓ light 360px: landing link, ordered difficulty, hints, wrong/right answers, solution and seeded variant
✓ Rentas solved by summing 20,000 payments; no console, KaTeX or overflow errors
```

## Summary

Added `src/content/sesiones/examen-final.mdx` with `source: examen`, eight exercises and explicit per-exercise difficulty. Seven original exercises cover annuities, VAN/TIR, dividend valuation, two-asset portfolios, CAPM, WACC/FCFF and bond price/duration. The rentas adaptation preserves the original semiannual payments, annual growth, quarterly discounting and first payment at year two, while seeded variants change both frequencies. Formula choices use numeric codes a=1, b=2, c=3 to reuse the established checker. The page states units and tolerances.

All financial answers use `src/lib/examen.ts` wrappers over `src/lib/finance`. Shared exercise rendering now displays the existing optional difficulty field. The exam header identifies exam preparation. The landing course map links to the page, the session index discovers it through the collection, and `finalExam` stays in sync with its title and eight chapter references.

Exercise map (also included in PR #43):

| Exercise | Difficulty | Topics | Chapters |
| --- | --- | --- | --- |
| ahorro | 1 | Present value of annual payments | 2 |
| capm | 1 | Required return | 10 |
| proyecto | 2 | VAN, TIR, investment decision | 2, 3 |
| accion | 2 | Dividend discount model | 4 |
| cartera | 2 | Two-asset return and risk | 7 |
| empresa | 3 | WACC, growing FCFF valuation | 5 |
| bono | 3 | Price, Macaulay and modified duration | 17, 19 |
| rentas | 3 | Growing deferred perpetuity, options a/b/c | 2 |

PR: https://github.com/jesusvillota/economia-financiera/pull/43 into `main`, on `goal/course-site/task-051`, with `Goal-Task: course-site/TASK-051` and label `goal:course-site`. No task specifications, other tasks, decisions, goal configuration or chapter content were manually edited. No scope deviations, missing decisions or proposed follow-ups. No deployment verification was required. Node emitted its existing experimental type-stripping warning; local checks passed.

GitHub Actions and the PR build check are excluded by the explicit owner override in `goal rules`; they were not inspected or awaited. Local verification is complete, so the PR can be marked ready. The PR must not be merged by this worker.
