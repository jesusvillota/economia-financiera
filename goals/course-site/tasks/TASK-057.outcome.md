# TASK-057 outcome

## Acceptance

- [x] `npm run build && npm run a11y` exits 0 and reports pages checked with zero serious or critical violations. On implementation revision `e6f2f34a772fb6b20d0d2519d68ac58d7dd38d84`, Astro checked 169 files with zero errors, warnings or hints and built 30 pages. Axe checked all 30 built HTML pages in dark/light at 360 px and 1280 px, plus answered quizzes and open search in each combination: 128 scans, zero serious violations, zero critical violations.
- [x] `npm test` and `npm run screenshots 1` pass. All 47 test files and 1,655 tests passed. All 52 screenshot combinations selected by `1` passed, with no console errors, KaTeX errors or horizontal overflow. Chapter 1 and search screenshots were visually inspected in dark/light and desktop/phone.
- [x] The PR body lists the violations found and how each was fixed. PR #50 records `color-contrast`, `aria-prohibited-attr`, `scrollable-region-focusable`, and `nested-interactive`, with concrete fixes. It also records the skip-link, radio-keyboard and phone-menu focus findings and their fixes.

The full required sequence ran with `&&` on the verified implementation revision and exited 0:

```sh
npm test && npm run build && npm run a11y && npm run screenshots 1
```

Selected output and the final screenshot tail:

```text
 Test Files  47 passed (47)
      Tests  1655 passed (1655)
Result (169 files):
- 0 errors
- 0 warnings
- 0 hints
01:20:58 [build] 30 page(s) built in 3.87s
01:20:58 [build] Complete!
Pages checked: 30; axe scans: 128; serious violations: 0; critical violations: 0
✓ sesiones_01-interes-y-rentas-dark-desktop.png
✓ sesiones_01-interes-y-rentas-dark-phone.png
✓ sesiones_01-interes-y-rentas-light-desktop.png
✓ sesiones_01-interes-y-rentas-light-phone.png
```

## Summary

Added `axe-core` as a dev dependency and `npm run a11y`. The script discovers HTML files recursively in `dist`, serves the built site through the existing preview helper, hydrates every island, waits for fonts, and opens chapter disclosures before scanning. It prints each page/theme/width and a final count, then fails on any serious or critical finding. Browser and preview resources close even when an assertion fails.

Fixed four axe finding types:

- `color-contrast`: darkened all six light-theme semantic colour variables and updated the style-guide table. Existing gold text measured 3.30:1, blue 4.34:1 and time-green 3.97:1 on the page background. Selected controls and widget readouts also failed. Removed opacity from unselected quiz answers so their text stays readable after an answer.
- `aria-prohibited-attr`: gave labelled SVG groups valid group roles in the frontier, capital-allocation and spot-curve widgets. Chart containers expose interactive children as labelled groups. Cash-flow handles have named groups with arrow-key instructions.
- `scrollable-region-focusable`: added responsive keyboard focus to overflowing chapter tables and display equations through a shared ResizeObserver. A separate browser check confirmed ArrowRight scrolls the Chapter 11 table and Chapter 19 equation at 360 px; resizing to 1280 px removes their extra tab stops.
- `nested-interactive`: moved each search result's option role, selected state and active-descendant ID onto its link. This removes the nested interactive element while preserving link navigation. Updated the existing search browser checks for the new structure; all four search combinations passed.

Fixed the keyboard findings: every main landmark is now a programmatic focus target for its skip link, the skip link stays visible while the page is scrolled, and scroll padding keeps focused targets clear of the sticky header. Segmented radio controls now support arrows, Home and End with one tab stop per group. Escape closes search first, then the phone menu and returns focus to its summary. Tab closes the menu when focus leaves its overlay.

The audit checks the skip link on every page. In each theme/width combination it also checks slider keyboard input and the visible focus ring, radio selection and focus, search result navigation, phone-menu Escape/Tab behavior, answered-quiz contrast, and reduced motion. Reduced-motion cash-flow actions schedule zero tween animation frames. Existing slider/search labels, landmarks and reduced-motion CSS/JavaScript behavior were retained after verification.

An earlier verification attempt stopped on a skip-link visibility assertion late in the scan, with no axe violations. Eight isolated checks of that page passed. The checker now explicitly activates each browser page and waits for visible focus; the complete required sequence then passed. The initial exploratory baseline was stopped after collecting the finding types so fixes could be built.

Verified implementation revision: `e6f2f34a772fb6b20d0d2519d68ac58d7dd38d84`, after a conflict-free rebase onto `origin/main`. This outcome is a subsequent documentation-only commit. Scope followed the task; no material decision or follow-up is required. Local task checks pass. GitHub Actions and the PR build check were not inspected, as required by the owner rules.

PR: https://github.com/jesusvillota/economia-financiera/pull/50 into `main`, labelled `goal:course-site`. No merge performed.
