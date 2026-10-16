---
id: TASK-010
title: 'Shared widgets: cash-flow timeline and growth curves'
milestone: M-2
state: approved
depends_on: [TASK-007, TASK-009]
delivery: pr
---

## Why

SC-2: the reusable visuals for Part I (hook: a picture before the formula).

## Scope

Build two general components on `PlotFrame`/`WidgetFrame`, reading maths only from `src/lib/finance` (TASK-009 may be in progress: import from its merged exports; if not merged, depend on the signatures in `docs/contracts/chapter.md` and stop). `CashFlowTimeline`: horizontal time axis with arrows up (inflows) and down (outflows), draggable amounts and dates, discounting animation that slides each flow to t=0 at rate r, readout of VA and VF. `GrowthCurves`: simple vs compound growth, sliders for r, n and periods per year, shaded gap between curves, doubling-time marker (rule of 72). Colours via CSS variables, tweened morphs, 360 px width. Add a gallery page `/dev/widgets` not linked from navigation. No chapter prose.

## Acceptance

- `npm test` passes (component maths covered by lib tests, add tests for any new pure helper).
- `npm run build` passes; `/dev/widgets` renders both components.
- `npm run screenshots dev` is clean in both themes, desktop and phone.
- A Playwright click-through changes the rate slider and confirms the readouts match `src/lib/finance` values.

## Verify

```sh
npm test && npm run build
npm run screenshots dev
```
