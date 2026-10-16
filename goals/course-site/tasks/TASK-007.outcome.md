## Acceptance

- [x] `docs/STYLE_GUIDE.md` has sections Voice, Chapter template, Problem-session template, Notation, Colours, Widgets, Checklist. Evidence: file written with these seven `##` headings.
- [x] Every notation macro is in `src/lib/katexMacros.ts`; a Vitest test renders each with KaTeX. Evidence: added `\rf \rM \rstar \ke \kd`; `tests/compound.test.ts` renders every macro with `throwOnError: true`; `npm test`: 16 passed.
- [x] `CLAUDE.md` exists and lists the real npm scripts. Evidence: lists dev, test, build, preview, screenshots, clickthrough, same as `package.json`.
- [x] `npm test && npm run build` pass. Evidence: 16 tests passed; `astro check && astro build` built 2 pages; `ls docs/STYLE_GUIDE.md CLAUDE.md` exit 0.

## Summary

Added the style guide (Spanish voice, template with Spanish section-tags, problem-session template per DEC-001, resolved notation table from AUDIT section 3, colour tokens from `theme.css`, widget rules, checklist), repo `CLAUDE.md`, five new macros and a per-macro render test.

Deviations: the problem-session section fixes voice and structure only; the schema comes from TASK-005/006. Docs are written in English for authors, with Spanish examples. Macros `\ke`, `\kd`, `\rf`, `\rM`, `\rstar` use the rate colour. Chapter-level macros for `r_p`, `w_j`, `\beta_j`, `\rho_{jk}` are plain TeX (no macro needed).

Verified revision: the PR head commit. Follow-up: when TASK-005 lands, align the problem-session section with its schema.
