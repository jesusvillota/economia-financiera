## Acceptance

- [x] `npm run build` passes and the home page lists every curriculum entry, marking unwritten ones `Próximamente`. Evidence: `astro check && astro build` built 2 pages; `dist/index.html` has 21 chapter entries, 5 session cards and 25 `Próximamente` badges (20 chapters + 4 sessions + final exam; chapter 1 links the placeholder `00-ejemplo`).
- [x] `npm run screenshots` is clean for the home page (both themes, desktop and phone). Evidence: `npm run screenshots home` exit 0, four ✓ lines (dark/light × desktop/phone); images inspected.
- [x] `src/data/curriculum.ts` matches `docs/AUDIT.md` section 4. Evidence: `tests/curriculum.test.ts` parses the AUDIT table (21 chapters, numbers and prerequisites equal) and checks that every file in `src/content/chapters` is in the curriculum (placeholder `00-ejemplo` allowed); `npm test`: 42 passed.

## Summary

Curriculum now holds the 21 chapters of AUDIT section 4 (DEC-002 option B) with slug, difficulty and prerequisites, plus the session track (4 sessions and a final exam). The home page shows pitch, course map with per-chapter difficulty, prerequisites and `Próximamente` badges, and a separate "Sesiones de problemas" section. Added `public/course-preview.svg`, README rewrite, `LICENSE` (MIT) and `LICENSE-CONTENT.md` (CC BY 4.0).

Deviations: `scripts/screenshots.mjs` now accepts `home` as a filter (the home path is empty, so `screenshots home` matched no page and checked nothing). Session cards are not links: the session routes come from TASK-006. Difficulty per chapter is my estimate. The preview SVG is not referenced by the site, only by the README.

Verified revision: the PR head commit. Follow-ups: remove `00-ejemplo` and the test exception when chapter 1 lands; link session cards after TASK-006.
