# TASK-024 outcome

Status: BLOCKED — GitHub account billing or spending limit prevents the build check from starting. All three acceptance requirements pass locally.

## Acceptance

- [x] `npm run clickthrough:frontier` sets rho and the toggle and the readouts equal `portfolio.ts` values. The final session run exited 0 with 260 readout assertions for two and three assets. It checks rho = -1, 0, 0.2, 0.95 and 1, both short-sale settings, selected return/risk/variance/weights and minimum return/risk/weights. It also verifies dragging, keyboard control, clamping after disabling short sales, no browser errors and no overflow at 360 px.
- [x] `npm run screenshots dev` is clean. The final session run exited 0 for dark/light × desktop/phone. No console errors, KaTeX errors or horizontal overflow were reported. The changed gallery images were visually inspected in both themes and screen sizes.
- [x] `npm test` and `npm run build` pass. The final session run exited 0: 491 tests passed in 15 files; Astro check reported 0 errors, 0 warnings and 0 hints; 7 pages built successfully.
- [ ] Delivery checks pass or none are configured, and the PR is ready for review. The external build check failed before starting because of account billing or spending limits. The PR remains draft as required by the worker protocol.

## Summary

Added `src/components/plots/EfficientFrontier.tsx` using Mafs, `PlotFrame` and `WidgetFrame`. It imports all portfolio calculations from `portfolio.ts`. It draws both frontier branches, marks the individual assets and minimum-variance portfolio, and constrains the draggable selected portfolio to the minimum-risk curve for its target return. Correlation, target-return and short-sale controls update all readouts. The target slider provides keyboard access.

Props support two or three assets, initial settings, a title and an optional Mafs overlay, including a render callback with current portfolio context for future CAL/SML wrappers. Plot coordinates use percentage points. The third asset is uncorrelated with the first two; the slider changes only the first pair. This stated teaching assumption keeps the full slider range valid. Unrestricted plots show a finite target-return window, extended to include the global minimum.

Added two `/dev/widgets` gallery examples and `scripts/clickthrough-frontier.mjs`, exposed through `npm run clickthrough:frontier`. The script loads the actual TypeScript library through Vite so its extensionless imports resolve without changing the library. No task specs, other task outcomes, decisions, routes or policy were changed. No material decision is missing. Proposed follow-up: later chapters can compose their CAL/SML through the overlay prop.

Verified implementation revision: `2f35427c02eba9bca02315665ff3a4a630b8b075`. The branch was rebased onto `origin/main` at `e7a4272e5cd287eef6b652057dae71e8ca51047b` without conflicts, before implementation. The final command sequence was `npm test && npm run build && npm run screenshots dev && npm run clickthrough:frontier`, which exited 0. `git diff --check` passed. The build emitted existing KaTeX euro-glyph messages but completed successfully.

Final verification tail:

```text
✓ 3 assets: rho=0.2, short sales=false, target=0.140000; all readouts match portfolio.ts
✓ 3 assets: rho=0.2, short sales=false, target=0.139000; all readouts match portfolio.ts
✓ 3 assets: drag, keyboard control, toggle clamping and 360px layout
✓ frontier click-through: 260 readout assertions match portfolio.ts
```

PR: https://github.com/jesusvillota/economia-financiera/pull/20, base `main`, label `goal:course-site`. Implementation and this outcome are committed and pushed on `goal/course-site/task-024`. No merge performed.

## Delivery blocker

The build check for the verified implementation concluded `FAILURE` at 2026-10-16 13:48:39 UTC. Check ID: `117005625453`. Its failure annotation states: "The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings". The deploy check was skipped.

The task instruction explicitly makes failed or pending checks block delivery. Only check status and its failure annotation were read to establish this external blocker; no workflow definitions or execution logs were read or changed. Account billing cannot be repaired within this task's authorization. The owner must resolve billing or spending limits, then resume this task and retry the check. The PR remains open and draft with `Goal-Blocked: GitHub account billing or spending limit prevents the build check from starting`.
