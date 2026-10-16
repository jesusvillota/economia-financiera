## Acceptance

- [x] `npm run build` passes (`astro check`: 0 errors) and `/chapters/03-van-tir/` is built. Sections in order: Gancho, Intuición, Formalización, Zona de juego, Compruébalo (3 `<Quiz>`), Resumen. 1.616 words in the MDX file (`wc -w`, includes frontmatter and imports).
- [x] `npm run screenshots 03` is clean: 4/4 ✓ (dark/light × desktop/phone), no console, KaTeX or overflow errors. Images checked by eye: dark phone (quizzes, readout) and light desktop (NpvProfile plot); the other two were not opened, only checked by the script.
- [x] Every number in the chapter comes from `src/lib/finance` and is tested in `tests/appraisal.test.ts` ("chapter 3 examples"): VAN 227,65 €, TIR 21,65 %, payback 2,17 and 2,50 (discounted), IR 1,23, A/B VAN 181,82 € and 202,10 €, TIR 30 % and 16,96 %, crossover 10,94 %, two TIR 10 % and 20 %, VAN(15 %) 0,19 €. New lib code: `crossoverRate` (appraisal.ts) and `examples.ts`. Components only call lib functions.
- [x] `npm run clickthrough:van-tir` (Playwright, new script) moves each widget and compares the readouts with the lib: timeline VA at r = 20 % (-24,96 €) before and after "Descontar a t = 0"; NPV profile slider and the three presets (VAN, TIR, payback, crossover). 13/13 ✓.
- [x] No claim contradicts `docs/AUDIT.md`: examples are original (not the note's), the ps1 Ex 7 to 10 numbers are not reused (they belong to Problem Session 1), and the unsupported reinvestment-rate claim from the note was left out.

## Summary

- **What:** `src/content/chapters/03-van-tir.mdx`, `NpvProfile.tsx` (NPV curve, draggable rate, TIR marked, A/B crossover, 3 presets), reuse of `CashFlowTimeline`, `examples.ts`, `crossoverRate`, tests, `scripts/clickthrough-van-tir.mjs` and npm script.
- **Deviations:** `curriculum.ts` needed no edit (slug `03-van-tir` was already listed; status derives from the MDX file). No new notation. The link to Problem Session 1 points to `/sesiones/` because ps1 does not exist yet (TASK-014); `sessions:` frontmatter left empty for the same reason. The `Callout` component has no "try" type, so "Prueba esto" uses `type="note"` with that title.
- **Caveat:** `npm run screenshots` uses fixed port 4329. If another worktree leaves a preview server on it, the run shows 404 console errors. Seen once in this session (stale servers present); the same command passes once the port serves this build.
- **Verified revision:** final commit of this PR (after this outcome file), no stale preview servers on port 4329. Final run `npm test && npm run build && npm run screenshots 03` exit 0.
- **Follow-ups:** make the screenshot script pick a free port.
