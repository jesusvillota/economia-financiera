## Acceptance

- [x] `npm test` passes, including variant tests. Evidence: 5 files, 34 tests passed; `tests/variant.test.ts` covers same seed → same numbers, range/step, tolerance accept/reject (abs and rel), Spanish number parsing.
- [x] `npm run build` passes and the fixture session page renders. Evidence: build complete, routes `/sesiones/index.html` and `/sesiones/00-ejemplo/index.html` generated.
- [x] `npm run screenshots sesiones` is clean in dark/light and desktop/phone. Evidence: 8 ✓ lines (index and fixture page × 2 themes × 2 viewports), no console, KaTeX or overflow problems.
- [x] Playwright click-through shows the behaviours. Evidence: `node scripts/clickthrough-sesiones.mjs` exit 0: wrong answer → "No es correcto" (wrong), right answer → "Correcto" (right), hints append in order, steps reveal in order, `Nueva variante` changed `1000 €|0,05|10` → `1000 €|0,1|12`, the checker accepted the recomputed 3138.43 and rejected the old 1628,89.

## Summary

What: `src/lib/problems/variant.ts` (seeded RNG, variants, number parsing, tolerance, `{{id}}` interpolation); React components `Ejercicio`, `Pista`, `Solucion`, `Respuesta` in `src/components/sesiones/`; progress in `localStorage` (try/catch) with a `Progreso` island; routes `/sesiones/` and `/sesiones/[slug]/`; styles in `widgets.css` (reduced-motion guarded animation, works at 375 px).
How: expected answers always come from the `lib` function named in the exercise (`import.meta.glob` over `src/lib`), evaluated with the variant's parameters. The first view shows the canonical numbers; each `Nueva variante` uses seed + n.
Deviations: the fixture session now uses `{{id}}` placeholders in statement and steps (and a second hint) so variants visibly change the text; `scripts/screenshots.mjs` now also visits `sesiones/` pages. Contract doc not changed: placeholder syntax `{{id}}` is new and should be added to `docs/contracts/problem-session.md` by a later task.
Verified revision: PR head commit.
Follow-ups: document `{{id}}` in the contract; header link to `/sesiones/` (TASK-008); percent display for rate parameters.
