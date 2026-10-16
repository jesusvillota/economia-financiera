---
id: TASK-024
title: 'Shared widget: efficient-frontier plot'
milestone: M-3
state: approved
depends_on: [TASK-022]
delivery: pr
---

## Why

Chapters 7 to 10 all draw the risk-return plane; one shared widget avoids four copies.

## Scope

Add `src/components/plots/EfficientFrontier.tsx` (Mafs, `PlotFrame` + `WidgetFrame`): plots the frontier of 2 or 3 assets from `portfolio.ts`, marks individual assets, the minimum-variance portfolio, a draggable portfolio point, correlation slider, short-sale toggle, optional overlay slot for a CAL or SML (props, so chapters 9 and 10 extend it). Gallery entry in `/dev/widgets` and a click-through script `npm run clickthrough:frontier`. Only calls the library.

## Acceptance

- `npm run clickthrough:frontier` sets rho and the toggle and the readouts equal `portfolio.ts` values.
- `npm run screenshots dev` is clean.
- `npm test` and `npm run build` pass.

## Verify

```sh
npm test
npm run build
npm run screenshots dev
npm run clickthrough:frontier
```
