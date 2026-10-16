---
id: TASK-006
title: Problem-session components and routes
milestone: M-1
state: approved
depends_on: [TASK-005]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

SC-3: the feature that makes the problem sessions interactive.

## Scope

Implement the components and routes of DEC-001's accepted model, per `docs/contracts/problem-session.md`: `<Ejercicio>` (statement, parameters with a seeded `Nueva variante` button), `<Pista>` (hint ladder), `<Solucion>` (stepwise reveal, steps with KaTeX), `<Respuesta>` (numeric input with tolerance, immediate feedback), plus a sessions index page and `/sesiones/[slug]` page with navigation and progress kept in `localStorage` (guarded by try/catch). Seeded variants come from a tested helper `src/lib/problems/variant.ts` (seeded RNG, parameter ranges, rounding). Reuse existing UI primitives. Widgets work at 360 px and honour `prefers-reduced-motion`. Use the fixture session from TASK-005, no real exercises.

## Acceptance

- `npm test` passes, including variant tests (same seed gives the same numbers; answer checker accepts values inside tolerance and rejects outside).
- `npm run build` passes and the fixture session page renders.
- `npm run screenshots sesiones` is clean in dark/light and desktop/phone.
- A Playwright click-through script shows: wrong answer gives negative feedback, right answer positive, hint ladder reveals in order, `Nueva variante` changes numbers and keeps the checker consistent.

## Verify

```sh
npm test && npm run build
npm run screenshots sesiones
node scripts/clickthrough-sesiones.mjs
```
