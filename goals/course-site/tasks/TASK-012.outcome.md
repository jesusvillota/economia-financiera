## Acceptance

- [x] `npm run build` passes (`astro check` 0 errors) and `/chapters/02-valor-actual/` is built with the six sections in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo, Resumen (about 1.700 words, 3 `<Quiz>`).
- [x] `npm run screenshots 02`: 4/4 ✓ (dark/light × desktop/phone), no console, KaTeX or overflow errors.
- [x] Every number in the chapter is tested in `tests/annuities.test.ts` against `src/lib/finance` (`pv`, `annuityPV`, `annuityDuePV`, `perpetuityPV`, `growingAnnuityPV`, new `annuities.ts`). `AnnuityBuilder` only calls the lib.
- [x] `npm run clickthrough:cap2` (Playwright): timeline VA at r = 20 % -24,96 €; builder VA 772,17 € = sum of discounted payments, prepagable 810,78 €, growing due 1105,11 €, perpetuity 2000,00 € / 2200,00 €, and `r ≤ g` when g = r. All equal the lib values and change after each click.
- [x] No claim contradicts `docs/AUDIT.md`. The chapter uses the recomputed figures, not the source ones (see Summary).

## Summary

- **What:** `src/content/chapters/02-valor-actual.mdx`; new widget `AnnuityBuilder` (payment arrow beside its PV arrow; sliders A, r, n, g; end/start of year; readouts formula, sum, perpetuity); `src/lib/finance/annuities.ts`; tests; `scripts/clickthrough-cap2.mjs`; widget also in `/dev/widgets`. `CashFlowTimeline` (TASK-010) is reused for discounting.
- **Deviations:** no change to `curriculum.ts` (status comes from the MDX file existing; `tests/curriculum.test.ts` passes) or to the notation table (no new symbols). `sessions:` frontmatter is empty and the link to ps1 is plain, because ps1 does not exist yet (TASK-014).
- **Source error found (not in AUDIT.md):** note 01's growing-annuity example gives 7,710 €. Correct value is 7439,81 € ((1,05/1,10)^10 = 0,628, not 0,6145). Fixed in the chapter. Proposed follow-up: add it to `docs/AUDIT.md` section 2.
- **Known limit:** KaTeX prints a non-fatal "No character metrics for €" warning in the build log when `€` is in math mode; screenshots report no KaTeX error.
- **Verified revision:** see the PR head commit.
- **Note on screenshots:** `scripts/screenshots.mjs` uses fixed port 4329. When another worktree's preview server holds it, the run reports 404s for a page that exists; run again once the port is free. Last run on this branch: 4/4 ✓; `npm test` 64 passed; `npm run build` exit 0.
- **CI:** the GitHub `build` check fails before running any code (account billing refusal; `main` fails the same way). Per the owner's rule, Actions are ignored; local checks are the verification: `npm test && npm run build && npm run screenshots 02` exited 0.

## Blocked

The work is done and verified locally (`npm test && npm run build && npm run screenshots 02` exit 0). The goal says failing checks block delivery, and the GitHub `build` check cannot pass: the Actions job is refused with "recent account payments have failed or your spending limit needs to be increased" (re-run confirmed; `main` fails the same way). Only the repo owner can fix billing. After that, re-run the check and mark the PR ready. If the owner decides the billing failure should not block delivery, mark the PR ready as it is.
