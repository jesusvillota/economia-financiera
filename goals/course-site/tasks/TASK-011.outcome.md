## Acceptance

- [x] `npm run build` passes (`astro check`: 0 errors) and `/chapters/01-interes/` renders the six sections in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen (checked in `dist/chapters/01-interes/index.html`).
- [x] `npm run screenshots 01` is clean (4/4 ✓: dark/light × desktop/phone, no console, KaTeX or overflow errors). Caveat: `scripts/screenshots.mjs` uses fixed port 4329. Other task worktrees run it at the same time, and then my run hits their server and reports a 404 for my page. Evidence of a clean run: the same script on port 4529 gave 4/4 ✓, and a run on the default port gave 4/4 ✓ when no other server was up. Already logged in agent-inbox as a bug.
- [x] Every number in the chapter comes from `src/lib/finance`: `tests/capitulo1.test.ts` (8 tests) calls `simpleFV`, `fv`, `pv`, `equivalentRate`, `effectiveFromNominal`, `nominalFromEffective`, `proportionalRate`, `doublingTime`, `rule72`, `compoundGrowth`. No formula is written in a component. 62 tests pass in total.
- [x] `npm run clickthrough` (Playwright, now pointed at chapter 1) moves the sliders of both `GrowthCurves` widgets: compound 466,10 € → 735,84 €, simple 300,00 €, doubling 13,9 años, all equal to the lib values.
- [x] No claim contradicts `docs/AUDIT.md`: the note's 1.259,70 € and 19,70 € are corrected to 1.259,71 € and 19,71 €; fractional rates use 1,2909 % and 2,5986 % (the audit corrections for ps1 2b).

## Summary

- **What:** `src/content/chapters/01-interes.mdx` (about 1.500 words, 3 quizzes, `GrowthCurves` twice); `tests/capitulo1.test.ts`.
- **How:** rewritten from note 01 §2. Adds the point that simple beats compound before one year. No new widget: `GrowthCurves` already covers the hook, and its `k` slider shows nominal vs effective rate.
- **Deviations:** removed the placeholder `00-ejemplo.mdx` (it also had `chapter: 1`). Repointed the session fixture, `scripts/clickthrough-slider.mjs`, and mentions in `CLAUDE.md`, `docs/contracts/chapter.md` and the curriculum test comment. `curriculum.ts` needs no change: the slug `01-interes` was already listed. No new notation, so no style-guide change. The link to `/sesiones/ps1/` goes live with TASK-014.
- **Verified revision:** the head of this PR.
- **Follow-ups:** make the screenshots port configurable (see agent-inbox bug).
