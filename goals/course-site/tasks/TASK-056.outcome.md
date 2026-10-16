# TASK-056 outcome

## Acceptance

- [x] `npm test` passes with the search tests. On implementation revision `f7baa48ea2ae66f4aca98ed5a3f809eb5ddad53f`, all 47 test files and 1,655 tests passed. Eight new search tests cover Spanish accent and case matching, substring ranking, title/heading/prose priority, multiword queries, stable ties, result limits, empty/missing queries, and plain-text extraction.
- [x] `npm run build` passes and `dist/search-index.json` exists. Astro checked 167 files with zero errors, warnings or hints. The build completed, and `test -f dist/search-index.json && echo ok` printed `ok`. The 246,249-byte index contains all 21 chapters, five sessions and 119 glossary terms. The browser script verifies all 145 destinations, including glossary anchors.
- [x] `node scripts/clickthrough-search.mjs` passes in dark/light at 1280 px and 360 px with no console errors. In each combination, `duración` returns chapter 19 first and `TIR` returns results. The script also checks accent-free uppercase queries, lazy index loading, `/`, arrows, Enter, Esc, blank/missing queries, session results, glossary navigation, mobile visibility, and page/search overflow. All four search screenshots were visually inspected.

The exact Verify sequence ran with `&&` and exited 0 after the rebase:

```sh
npm test
npm run build
test -f dist/search-index.json && echo ok
node scripts/clickthrough-search.mjs
```

Selected output and the final lines:

```text
 Test Files  47 passed (47)
      Tests  1655 passed (1655)
Result (167 files):
- 0 errors
- 0 warnings
- 0 hints
00:55:19 [build] 30 page(s) built in 3.46s
00:55:19 [build] Complete!
ok
✓ static index: 145 entries; all chapters, sessions and glossary anchors resolve
✓ dark 1280px: duración → chapter 19 first; TIR results; accents, /, arrows, Enter, Esc; no console errors or overflow
✓ dark 360px: duración → chapter 19 first; TIR results; accents, /, arrows, Enter, Esc; no console errors or overflow
✓ light 1280px: duración → chapter 19 first; TIR results; accents, /, arrows, Enter, Esc; no console errors or overflow
✓ light 360px: duración → chapter 19 first; TIR results; accents, /, arrows, Enter, Esc; no console errors or overflow
```

## Summary

Added the static Astro endpoint `src/pages/search-index.json.ts`, indexing chapter prose and headings, session exercise statements/hints/solution steps, and glossary definitions with their existing URLs. Pure normalisation, prose extraction and ranking live in `src/lib/search.ts`. Titles rank above headings, summaries and body prose. Every query word must match a substring. No dependency was added.

Added a `SearchBox` React island to `CourseNav.astro` with `client:idle`, one shared index request on first use, Spanish loading/error/empty states, and keyboard controls. `/` selects the visible navigation instance and opens the phone menu. Added one layout rule that disables the header backdrop filter while the mobile menu is open: that filter otherwise confines the fixed menu to the header and clips search results. The click-through script checks the actual visibility of the input and first result after arrow-key navigation.

The plan was implemented as scoped: static index, navigation island, unit tests and browser checks. The mobile header rule is the only extra layout change needed to make the specified phone search usable. No task specs, other outcomes, decisions or goal configuration were changed.

Verified implementation revision: `f7baa48ea2ae66f4aca98ed5a3f809eb5ddad53f`, after a conflict-free rebase onto `origin/main`. This outcome is a subsequent documentation-only commit. Local acceptance checks pass. GitHub Actions and the PR build check were not inspected, as required by the owner rules.

PR: https://github.com/jesusvillota/economia-financiera/pull/49 into `main`, labelled `goal:course-site`. No merge performed. No material decisions or follow-ups are needed.
