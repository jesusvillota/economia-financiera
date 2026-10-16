---
id: TASK-053
title: 'Link and consistency QA: internal links, anchors, chapter-session cross-links, curriculum sync checked on the built site'
milestone: M-6
state: approved
depends_on: []
delivery: pr
---

## Why

SC-2 and SC-3: 21 chapters, 4 sessions and the exam page were written by many workers; links and cross-references must agree on the built site.

## Scope

Add `scripts/check-site.mjs` and `npm run check:site`: after a build it walks `dist/`, and for every HTML page checks that each internal link and `#anchor` resolves, each page has one `h1` and a `<title>`, prev/next links form the `curriculum.ts` order, every session links to chapters that link back, and every chapter listed in `curriculum.ts` has a page. Add `tests/site-links.test.ts` for the pure helpers. Fix every defect found with the smallest edit (typo, broken link, missing back-link) in the PR and list them in the PR body. Out of scope: new content, layout redesign.

## Acceptance

- `npm run build && npm run check:site` exits 0 and prints the number of pages and links checked.
- `npm test` passes.
- The PR body lists each defect fixed, or says none were found.

## Verify

```sh
npm test
npm run build
npm run check:site
```
