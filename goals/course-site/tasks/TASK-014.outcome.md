## Acceptance

- [x] `npm test` passes, including `tests/sesion01.test.ts` over every exercise. Evidence: 6 files, 151 tests passed; `sesion01.test.ts` checks all 34 answers of the 10 exercises: default-seed value equals the library and the frontmatter value, and an independent closed form (brute-force sum for Ex 4c) agrees on 20 random seeds. It also asserts the corrected `docs/AUDIT.md` numbers.
- [x] `npm run build` passes and `/sesiones/01-interes-y-rentas` renders. Evidence: build complete, route `/sesiones/01-interes-y-rentas/index.html` generated.
- [x] `npm run screenshots sesiones` is clean (both themes, desktop and phone). Evidence: 12 ✓ lines including the 4 `sesiones_01-interes-y-rentas-*` images; the desktop-light image was viewed.
- [x] Each ps1 exercise maps to an exercise or is dropped with a reason. Evidence: table below.
- [x] Playwright click-through solves one exercise via hints, wrong answer and right answer. Evidence: `node scripts/clickthrough-sesion01.mjs` exit 0: 2 hints in order, 150000 rejected, `181.500,00` accepted, first solution step shows 181500.

### Exercise map

| ps1 | Session | Notes |
|---|---|---|
| Ex 1 a, b, c, d | ej1 | b asks one period (k=4) instead of six; d keeps only the first case (10 years, 5 %). The 3 % semestral case is dropped: same formula, only the unit changes. |
| Ex 2 a, b, c, d | ej2 | b one period (k=12); d keeps case ii (fractional years); case i is dropped: same formula as 2a. |
| Ex 3 a, b, c | ej3 | Alternatives A and B become answers c and d; the simple-equivalent rate in 3b is dropped (only the compound one is asked). |
| Ex 4 a, b, c | ej4 | Corrected values (27,674; 30,354; 28,522). |
| Ex 5 a, b, c | ej5 | 5c is 31,309. |
| Ex 6 a, b, c, d | ej6 | Corrected values (48,083; 14,989; 63,073; 48,430). |
| Ex 7 | ej7 | VAN 28,685. |
| Ex 8 a, b | ej8 | PRD is 3.24, not 3.46. |
| Ex 9 a, b | ej9 | b asks the VAN, so the decision is numeric. |
| Ex 10 a to d | ej10 | Numbers changed: B pays 100 and 1,300, so VAN(B) > VAN(A) while TIR(A) > TIR(B). The source had equal VANs and no clear decision. Answers: VANs, difference, PR and PRD of B, both TIR. PR and PRD of A are dropped (trivial). |

## Summary

- **What:** `src/content/sesiones/01-interes-y-rentas.mdx` (10 exercises, 2 to 3 hints each, stepwise solutions), `src/lib/sesion01.ts` (numeric wrappers over `src/lib/finance`; rates in %), `tests/sesion01.test.ts`, `scripts/clickthrough-sesion01.mjs`.
- **How:** every answer has a `lib` entry in module `sesion01`. The contract passes only numbers, so project exercises take the flows as parameters.
- **Deviations:** `Ejercicio.tsx` now lets solution steps use `{{answer_id}}` (answer rounded for display), so steps stay right in variants. The contract has no `pendiente` field: chapters 1 to 3 are linked by assumed slugs (`01-interes-simple-y-compuesto`, `02-valor-actual-rentas`, `03-van-tir-criterios`) and flagged with a YAML comment. The session has `number: 1`, as does the fixture `00-ejemplo`.
- **Verified revision:** PR head commit.
- **Follow-ups:** document `{{answer_id}}` in `docs/contracts/problem-session.md`; set the real chapter slugs once TASK-011 to 013 merge; remove or renumber the fixture session.
