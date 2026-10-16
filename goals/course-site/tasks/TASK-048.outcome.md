# TASK-048 outcome

## Acceptance

- [x] `npm test` passes, including `tests/capitulo21.test.ts` covering every number in the text. On 2026-10-16: 37 test files and 1,210 tests passed, exit 0. The chapter tests check the call, put, spread and straddle examples and quiz answers against `derivatives.ts`; a numeric inventory detects newly introduced figures. Further tests cover all strategy legs, signs, default costs, breakevens and zero-profit intervals.
- [x] `npm run build` passes and `/chapters/21-opciones/` renders six sections in order. Astro checked 135 files with zero errors, warnings or hints and built 23 pages, exit 0. The browser script received HTTP 200 and asserted Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen in all four theme/viewport combinations.
- [x] `npm run screenshots 21` passes, exit 0. All four captures (dark/light × desktop 1280 px/phone 375 px) report no console, KaTeX or overflow errors. Files: `screenshots/chapters_21-opciones-{dark,light}-{desktop,phone}.png`. Additional header and widget captures were visually inspected in both themes at 1280 px and 360 px; text, controls and readouts fit.
- [x] `npm run clickthrough:cap21` passes, exit 0. Playwright made 3,220 readout comparisons against `derivatives.ts`, exercising all 11 strategy choices, every slider's limits, signed legs, finite and unbounded zero-profit intervals, keyboard operation, reset and all three quizzes' wrong-answer/retry/correct-answer paths. Both themes passed at 1280 px and 360 px with no console, KaTeX or overflow errors.
- [x] No claim contradicts `docs/AUDIT.md`. Reviewed the chapter against audit sections 2 and 4 and PS4 Exercise 10. The chapter distinguishes gross payoff, nominal profit and an existing forward's present value, states that premiums are not compounded, and links to options-explained for pricing depth. The audit regression in `tests/capitulo21.test.ts` verifies the corrected PS4 discount factor 0.9429 and forward value 4.74 (rather than 4.76), plus nominal option profits. No new source errors were found, so no audit amendment was needed.

## Summary

Delivered an original Spanish Chapter 21 with six sections, three quizzes and a payoff explorer for long/short calls and puts, covered calls, protective puts, bull/bear spreads, straddles, strangles and collars. The explorer displays signed legs, strikes, premiums, initial cost, terminal payoff, nominal profit and exact breakeven points or intervals. All financial readouts call the existing derivatives library. Added notation rows and the `clickthrough:cap21` package script. The prerequisite is chapter 20 and `sessions: []` remains available for PS4 integration.

Resumed the existing implementation on `goal/course-site/task-048`; no implementation changes were needed after inspection and verification. Merged `origin/main` without conflicts as required by the task. Only task-specific content, widget/data files, tests, browser script, append-only shared-file additions and this outcome differ from the base. No task specifications, other task outcomes, decisions or goal configuration were authored or changed for this task.

Verified implementation revision: `198b67c` (including chapter commit `1fcf9e9`), on 2026-10-16. This outcome is a documentation-only addition after that verification. All four Verify commands above ran successfully in this resumed session. The build emitted existing Node experimental type-stripping and KaTeX euro-font notices; Astro diagnostics and browser KaTeX checks were clean.

PR: https://github.com/jesusvillota/economia-financiera/pull/40 into `main`, with `Goal-Task: course-site/TASK-048` and label `goal:course-site`. No review threads or PR comments were present when inspected. Local Verify commands determine readiness under the explicit owner rule returned by `goal rules`; GitHub Actions and the PR build check were not inspected. Never merge.

Deviations: none. Proposed follow-ups: the already planned PS4 session will add its exercise links; no additional task or decision is required.
