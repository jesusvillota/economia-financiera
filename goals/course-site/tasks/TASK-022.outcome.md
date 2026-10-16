# TASK-022 outcome

Status: BLOCKED — acceptance requires an outside weight for PS3 Exercise 2, but both source correlations give inside weights.

## Acceptance

- [ ] `npm test` passes with at least 30 new assertions. Baseline only: `npm test` exited 0 with 181 tests in 10 files. No implementation or new assertions were added pending the decision below.
- [ ] Correlation properties and weights summing to 1. The requested outside-weight property contradicts the audited Exercise 2 inputs. Exact arithmetic below proves the conflict. The other properties are not implemented yet.
- [ ] A non-PSD correlation matrix throws. Not implemented pending the acceptance decision.
- [x] `npm run build` passes. Baseline build exited 0: Astro check reported 0 errors, and Astro built 8 pages. This verifies the existing site, not the requested library.

## Summary

Read the task, worker protocol, repository rules, `docs/audit/ps3_findings.md`, the audit script and the original PS3 solution. No portfolio code or task specifications were changed. This outcome records a material acceptance conflict before implementation.

Verified baseline revision: `bb3a185eaa24bfd8dac32850197f920eb3828720` on `goal/course-site/task-022`, after syncing with `origin/main`. Only this outcome file is added by this task. `TASK-016.outcome.md` is absent; the goal decision log records TASK-016 completed by the owner on 2026-10-16 at 12:40 UTC.

Installed the locked dependencies with `npm ci` (exit 0), then ran both required commands successfully. No pages changed, so screenshot verification does not apply. GitHub Actions were not inspected, per the owner's instruction. The PR remains a draft because acceptance is unresolved.

### Evidence

The minimum-variance weight in the first asset is:

```text
wS = (sigmaT² - rho * sigmaS * sigmaT)
     / (sigmaS² + sigmaT² - 2 * rho * sigmaS * sigmaT)
```

Exercise 2 uses `sigmaS = 0.22`, `sigmaT = 0.20` and correlations `0.8` and `-0.2`. See `source/problem_sets/ps3/ps3_solutions.tex:260`, `:268`, `:287` and `:320`. The source explicitly says both weights are inside the permitted range at lines 313 and 348. The audit confirms the same in `docs/audit/ps3.py`, and `docs/audit/ps3_findings.md` recommends a separate variant to make the short-sale cases differ.

Recomputed in this session with Python's exact `fractions.Fraction` arithmetic:

```text
rho=0.8: wS=4/15 = 0.266666666667; wT=0.733333333333; outside [0,1]: False
rho=-0.2: wS=122/265 = 0.460377358491; wT=0.539622641509; outside [0,1]: False
rho=0.95: wS=-3/8 = -0.375000000000; wT=1.375000000000; outside [0,1]: True
```

For these volatilities, the first weight becomes negative only when `rho > 10/11`, approximately `0.90909`. Neither original correlation meets that condition.

Command results:

```text
npm test — exit 0
Test Files  10 passed (10)
Tests       181 passed (181)

npm run build — exit 0
Result (54 files):
0 errors
0 warnings
0 hints
[build] 8 page(s) built in 1.31s
[build] Complete!
```

## Decision request

May TASK-022 keep the audited PS3 Exercise 2 answers and use a separate `rho = 0.95` variant for the outside-weight property?

1. Keep the original PS3 regression cases and add a clearly named variant with the same volatilities and `rho = 0.95`. This preserves the audited answers and tests the difference between unrestricted and long-only portfolios. It requires clarifying the acceptance wording in the task instruction.
2. Correct the acceptance property to require inside weights for the original Exercise 2 correlations. This matches the source directly, but that property alone does not test the effect of forbidding short sales.

### Recommendation

Choose option 1. Retain both audited Exercise 2 cases. Use the separate `rho = 0.95` variant to assert unrestricted `wS = -0.375` and long-only `wS = 0`. The owner or copilot must approve this interpretation before work resumes. No task spec, source exercise, policy, route or decision file was edited.

After approval, implement the portfolio and matrix modules, add at least 30 assertions, run `npm test` and `npm run build`, update this outcome with implementation evidence, and prepare the PR for review. Never merge it.
