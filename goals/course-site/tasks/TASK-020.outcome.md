# TASK-020 outcome

## Acceptance

- [x] Two `npm run screenshots` runs at the same time on different builds both pass. Two independently built roots ran concurrently on OS-assigned ports **57429** and **57428**. Both processes exited **0**, with **28 passing screenshots and zero failures each**. Session logs: `/tmp/task020-screenshots-a-final.log` and `/tmp/task020-screenshots-b-final.log`. The second build root was `/private/var/folders/_j/7j25pgqd5z3dh647gtb8vmbw0000gn/T/task020-build-b-3lyq_llx`. A separate probe confirmed that an occupied explicit `PORT` fails instead of serving another build; invalid `PORT` values are rejected.
- [x] `npm test` passes, including `source: examen` and per-exercise `difficulty`. **12 test files, 190 tests passed**. `tests/session-schema.test.ts` parses the production schema, retains levels 1/2/3, accepts legacy sessions without exercise difficulty, and rejects invalid sources and difficulty values.
- [x] `npm run build` passes and ps1 links resolve to all three chapters and back. Astro reports **0 errors, 0 warnings, 0 hints**, and builds **7 pages**. `node scripts/clickthrough-sesiones.mjs` exited **0**, clicking ps1 → each of `01-interes`, `02-valor-actual`, `03-van-tir` → ps1. It also verifies answers, hints, solution placeholders and new variants. `tests/session-links.test.ts` checks real chapter slugs, chapter backlinks, exercise concepts and unique session numbers. The published fixture is gone; test data remains in `tests/fixtures/session.md`.
- [x] `docs/AUDIT.md` section 2 lists the note-01 growing-annuity error: **7.710 €** versus **7.439,81 €**. It names `tests/annuities.test.ts` and the existing regression test of `growingAnnuityPV(1000, 0.1, 0.05, 10)` against `7439.81`.

## Summary

Preview scripts share `scripts/preview.mjs`, which binds port 0 directly through Astro and uses the actual bound port. `PORT` remains available for an explicit port. No free-port reservation race or polling against another build remains.

The session schema is shared between Astro and tests in `src/schemas/problem-session.ts`. Exercise difficulty is optional for compatibility. The contract documents exam sources, exercise levels and computed `{{answer_id}}` solution placeholders. The schema stays outside `src/lib` so the exercise component's eager maths imports do not bundle it into browser widgets.

Ps1 uses the real chapter slugs. All three chapters carry the actual session slug. Page templates now render these links. The fixture moved outside the published content collection, and the former fixture clickthrough entry point now checks the real session.

Verified code revision: **d91ce644357fe812042f272462be28202b9b8617**, rebased onto `origin/main` without conflicts. The upstream changes were goal metadata only. TASK-016 has no outcome file; its spec records manual completion, and its completion commit was present. No task specs, other outcomes, decisions or goal configuration were edited.

The exact verification sequence `npm test && npm run build && npm run screenshots sesiones` exited **0** after the rebase. Its final output was:

```text
✓ sesiones-dark-desktop.png
✓ sesiones-dark-phone.png
✓ sesiones-light-desktop.png
✓ sesiones-light-phone.png
✓ sesiones_01-interes-y-rentas-dark-desktop.png
✓ sesiones_01-interes-y-rentas-dark-phone.png
✓ sesiones_01-interes-y-rentas-light-desktop.png
✓ sesiones_01-interes-y-rentas-light-phone.png
```

All four other clickthrough commands also exited **0**: `npm run clickthrough`, `npm run clickthrough:widgets`, `npm run clickthrough:cap2`, and `npm run clickthrough:van-tir`. Changed-page screenshots were inspected in both themes. An initial concurrent screenshot attempt overlapped a rebuild and hit one transient asset 404; both final runs used stable builds and passed completely.

## Blocker

**PR build check is not passing; owner rules prohibit GitHub Actions diagnosis.**

PR #15 is open as a draft into `main`, with `Goal-Task: course-site/TASK-020` and label `goal:course-site`. Its `build` check reported `FAILURE` on verified revision d91ce64; `deploy` was skipped. The task and worker protocol explicitly prohibit delivery with failed or pending checks. The owner's instructions also say to ignore GitHub Actions completely and not read them. Only the PR check summary was inspected; no Actions logs or workflows were read or run.

Missing data: the reason for the remote build-check failure. Local verification is complete. The owner must provide that diagnostic or change the no-Actions constraint before this check can be diagnosed. No code failure was reproduced locally. The PR stays a draft, and the native goal is not marked complete. Proposed follow-up: resolve the remote check, then mark this same PR ready after checks pass. No merge was performed.
