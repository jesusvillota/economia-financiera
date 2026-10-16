---
id: TASK-056
title: 'Search: client-side full-text search over chapters, sessions and glossary'
milestone: M-6
state: approved
depends_on: [TASK-052]
delivery: pr
---

## Why

SC-2: with 21 chapters, a reader needs to find a topic fast.

## Scope

Build a static search index at build time (a small Astro endpoint `src/pages/search-index.json.ts` listing title, section headings, plain-text excerpt and URL for every chapter, session and glossary term), and a `SearchBox` React island in `CourseNav.astro` (`client:idle`) with fuzzy-free substring ranking, keyboard support (`/` focuses, arrows, Enter, Esc) and Spanish accent-insensitive matching. No new dependency. Pure ranking and normalisation functions in `src/lib/search.ts` with tests in `tests/search.test.ts`. Add `scripts/clickthrough-search.mjs`: type `duración`, expect the chapter 19 hit first; type `TIR`, expect results. Out of scope: glossary content (TASK-052), accessibility audit.

## Acceptance

- `npm test` passes with the search tests.
- `npm run build` passes and `dist/search-index.json` exists.
- `node scripts/clickthrough-search.mjs` passes in dark/light, 1280 px and 360 px with no console error.

## Verify

```sh
npm test
npm run build
test -f dist/search-index.json && echo ok
node scripts/clickthrough-search.mjs
```
