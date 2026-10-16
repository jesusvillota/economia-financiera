---
id: TASK-057
title: 'Accessibility pass: axe check on every page, keyboard and focus, contrast, reduced motion'
milestone: M-6
state: approved
depends_on: [TASK-056]
delivery: pr
---

## Why

SC-2: the site must be usable with keyboard and screen readers.

## Scope

Add `axe-core` as a dev dependency and `scripts/a11y.mjs` (`npm run a11y`): after a build, open every page in `dist/` with Playwright (already used by the screenshots script), run axe in dark and light at 360 px and 1280 px, and fail on serious or critical violations. Fix what it finds in layouts and shared components (focus ring, colour contrast via CSS variables, labels for sliders and the search box, landmark roles, `prefers-reduced-motion`, skip link). Chapter text edits only where a violation requires. Out of scope: SEO meta, 404 (TASK-058).

## Acceptance

- `npm run build && npm run a11y` exits 0 and prints pages checked and zero serious or critical violations.
- `npm test` and `npm run screenshots 1` pass.
- The PR body lists the violations found and how each was fixed.

## Verify

```sh
npm test
npm run build
npm run a11y
npm run screenshots 1
```
