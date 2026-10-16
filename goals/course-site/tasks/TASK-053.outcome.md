# TASK-053 outcome

## Acceptance

- [x] `npm run build && npm run check:site` exits 0 and prints page/link counts. After rebasing onto `origin/main`, the build completed with 0 errors, 0 warnings and 0 hints, producing 29 pages. The checker printed `Checked 29 pages and 1194 internal links.` and `All site checks passed (links, anchors, headings, curriculum and chapter/session navigation).`
- [x] `npm test` passes. The same verification run passed all 44 test files and 1538 tests, including 23 new pure-helper tests in `tests/site-links.test.ts`.
- [x] The PR body lists each defect fixed. PR #48 enumerates both broken Session 1 URLs, each of four missing Session 3 back-links, each of eight missing exam back-links, and three stale descriptions of Session 3 as unpublished.

## Summary

Added `scripts/check-site.mjs` and `npm run check:site`. The checker walks every built HTML page using an HTML parser. It checks internal URL targets and fragments, one h1, a nonempty title, complete chapter coverage, chapter previous/next order, session navigation, session chapter coverage and reciprocal practice links. It uses the deployed site/base configuration and `curriculum.ts`, including the exam. Exercise and prose chapter links must also match session coverage.

Fixed the link defects with small chapter content/frontmatter edits. Updated five existing tests that asserted the old missing-link state. Added focused regression tests for HTML parsing, URL/base handling, missing pages/assets/anchors, headings, curriculum drift and navigation defects.

Verified revision: `77d9f8bcbaa85faa3832ab6ec09e5afdbf878039` on `goal/course-site/task-053`, after a conflict-free rebase onto `origin/main`. Ran `npm test`, `npm run build`, and `npm run check:site` sequentially; all exited 0. The outcome commit changes documentation only.

No material decisions or scope deviations. GitHub Actions and the PR build check are excluded by the owner's explicit override; local Verify commands determine readiness. No follow-up work is required for link and curriculum consistency.

Verification output tail:

```text
 Test Files  44 passed (44)
      Tests  1538 passed (1538)
[build] 29 page(s) built in 4.84s
[build] Complete!
Checked 29 pages and 1194 internal links.
All site checks passed (links, anchors, headings, curriculum and chapter/session navigation).
```
