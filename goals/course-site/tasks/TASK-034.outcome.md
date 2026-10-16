# TASK-034 outcome

Status: BLOCKED — PR build check failed; its failure diagnostic is unavailable under the owner's no-Actions rule. All five local acceptance requirements pass.

## Acceptance

- [x] `npm test` passes, including `tests/sesion03.test.ts` over every exercise. Final combined verification exited 0 with **951 tests in 22 files**. Session 3 adds **137 cases**: every one of its **62 answers** is checked against the library, canonical frontmatter, independent arithmetic and 20 reproducible random seeds. Other cases assert all nine exercise IDs, hint counts, parameter ranges, solution placeholders, the PSD domain, the binding short-sale variant and all corrected `docs/AUDIT.md` Exercise 7 numbers.
- [x] `npm run build` passes and `/sesiones/03-carteras-y-capm/` renders. Final Astro check: **0 errors, 0 warnings, 0 hints across 87 files**; static build: **12 pages**. Browser verification receives HTTP **200**, finds the expected title and all **nine exercise cards**.
- [x] `npm run screenshots sesiones` is clean. Final combined run exits 0 with **16 passing images**: session index and Sessions 1–3, each in dark/light and desktop/phone. No console errors, KaTeX errors or horizontal overflow. Inspected new-page top and exercise sections in both themes and layouts. Existing euro-glyph build messages do not fail the build or screenshot checks.
- [x] `node scripts/clickthrough-sesion03.mjs` solves an exercise through hints, a wrong answer and a right answer. Final run exits 0 at **360 px**. It reveals all three hints, rejects a wrong answer, accepts all nine answers of source Exercise 1, verifies solved progress, reveals all four solution steps, generates a new variant, verifies reset state and recomputed answers, and checks correlation graph endpoints and clean maths/layout. The test waits for the lazily hydrated graph before changing its control.
- [x] Every source exercise maps to an exercise; none is dropped. All **seven exercises / 33 source parts** are retained. The PR body includes the exercise map reproduced below. The extra short-sale card implements accepted DEC-003 with rho = 0.95.

## Exercise map

| PS3 source | Session ID / page card | Kept coverage |
| --- | --- | --- |
| 1a–c | `ej1` / 1 | Mean and five correlation risks; risk-versus-correlation plot; minimum-variance weight, mean and risk. |
| 2a–b | `ej2_pos` / 2 | rho = 0.8, with/without short sales. |
| 2c–d | `ej2_neg` / 3 | rho = -0.2, with/without short sales. |
| Additional Ex 2 variant | `ej2_corto` / 4 | rho = 0.95: unrestricted first weight -37.5%, constrained first weight 0%. |
| 3a–d | `ej3` / 5 | Mean, variance, volatility, three covariances; fixed-return diversification constraint. |
| 4a–e | `ej4` / 6 | Lending/borrowing mean and risk; CAL derivation, Sharpe and target-risk weight. |
| 5a–d | `ej5` / 7 | Betas, classification, required returns, signed pricing gaps and SML plot. |
| 6a–d | `ej6` / 8 | Both betas and required returns; exposure comparison. |
| 7a–f | `ej7` / 9 | Corrected equal-weight/minimum-variance moments, Sharpe, CAPM valuation and both final allocation weights. |

Complementary two-asset weights are explained as 100% minus the first weight, rather than duplicated as checker inputs. No exercise or subpart was dropped. Conceptual parts use a drawing or solution explanation rather than an artificial numeric answer.

## Summary

Added `src/content/sesiones/03-carteras-y-capm.mdx`, `src/lib/sesion03.ts`, `tests/sesion03.test.ts`, `src/components/sesiones/GraficosPS3.tsx` and `scripts/clickthrough-sesion03.mjs`. No shared finance function, source material, other session, task specification, decision, policy, route configuration or goal configuration changed.

The wrappers call the existing portfolio and CAPM library. UI returns, volatility and weights use percent; variances and covariances use decimal returns squared; pricing gaps use percentage points. Exercise 5 explicitly puts all moments and returns in one monthly period. Exercise 7 uses full precision and the audited 14.83% risk, 0.4854 Sharpe, 0.6934 risky fraction and 69.34% / 30.66% allocation. It does not confuse the specified minimum-variance fund with the tangent fund.

Every card has three hints, parameter ranges and computed stepwise answers. Three-asset correlations stay fixed at the source PSD matrix; positive volatility scaling preserves PSD for every variant. Two-asset correlation ranges stay within [-1,1]. The short-sale demonstration keeps source volatilities fixed so its constraint binds in every variant. The original Exercise 2 correlation cases remain intact.

The figures use `PlotFrame`/`WidgetFrame`, source data and library calculations. The source Exercise 1 graphic used inconsistent data; this page draws risk against correlation using the actual exercise data. Figures are explicitly marked as original-data guides. Seeded variants ask the learner to redraw with their new data. Chapters 7–10 do not yet exist on this base; their correct curriculum slugs remain in session metadata for automatic linking when published. No substitute chapters or broken links were added.

Read the TASK-023 and TASK-020 outcomes and accepted DEC-003. Rebased onto `origin/main` (`206d3d3`) without conflicts and stayed on `goal/course-site/task-034`. Verified implementation revision: **4782a62e78627c2d610eae5ee27b901ee25f14f1**. After the rebase, the exact four-command sequence below exited **0**. The outcome-only commit does not change the verified implementation.

```sh
npm test && npm run build && npm run screenshots sesiones && node scripts/clickthrough-sesion03.mjs
```

Final verification tail:

```text
 Test Files  22 passed (22)
      Tests  951 passed (951)
Result (87 files):
- 0 errors
- 0 warnings
- 0 hints
16:05:14 [build] 12 page(s) built in 1.52s
16:05:14 [build] Complete!
✓ sesiones_03-carteras-y-capm-dark-desktop.png
✓ sesiones_03-carteras-y-capm-dark-phone.png
✓ sesiones_03-carteras-y-capm-light-desktop.png
✓ sesiones_03-carteras-y-capm-light-phone.png
✓ Three hints revealed in order
✓ Wrong answer rejected
✓ All nine answers accepted; exercise marked solved
✓ Full stepwise solution renders
✓ New variant resets help and checks recomputed answers
✓ Correlation graph, maths and 360 px layout are clean
```

A separate out-of-scope environment bug was recorded with `agent-note`: upstream tracks an absolute `node_modules` symlink that resolved to a loop in this worktree. Local checks used `npm ci` after temporarily unlinking that worktree symlink. The tracked symlink is restored unchanged before the final push; installed dependencies are preserved outside the repository. Bug note: `~/GitHub/config/agent-inbox/bugs/20261016T140544Z-42095-Tracked-node-modules-symlink-breaks-worktree-dep.md`. Fixing it is a separate task.

## Delivery blocker

PR: https://github.com/jesusvillota/economia-financiera/pull/27. Open draft into `main`, label `goal:course-site`, body contains `Goal-Task: course-site/TASK-034` and `Goal-Blocked: PR build check failed; failure diagnostic unavailable under owner no-Actions rule`.

The PR check summary for implementation revision 4782a62 reports `build: FAILURE`, completed **2026-10-16 14:05:09 UTC**; `deploy` is skipped. The explicit task delivery rule forbids delivery while a check fails. The owner's instruction says to ignore GitHub Actions completely and not read them. Only the PR summary was read to establish delivery eligibility. No Actions logs, annotations, workflow definitions or execution details were read, changed or rerun.

Missing data/access: an owner-provided diagnosis of this failed remote check, or authorization to inspect it. Dependency outcomes describe earlier remote-check access failures, but this session has not verified that the current failure has the same cause. No local implementation failure remains. The PR stays draft, no merge was performed, and the native goal is not marked complete. Proposed follow-up: resolve the remote check, then resume this same PR and mark it ready once checks pass. No material implementation decision is pending.
