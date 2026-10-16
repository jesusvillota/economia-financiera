---
id: TASK-003
title: Scaffold the Astro site from options-explained (Spanish UI)
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
---

## Why

SC-1: a building, deployable, tested site skeleton that every content task builds on.

## Scope

Create the Astro site by adapting https://github.com/jesusvillota/options-explained (clone it with `gh repo clone jesusvillota/options-explained` into a directory OUTSIDE this worktree, for example `$TMPDIR/oe`; read-only reference). Copy the infrastructure, not the options content: `astro.config.mjs` (base `/economia-financiera`, MDX, KaTeX via remark-math/rehype-katex), `package.json` (same pinned stack: Astro, MDX, React 18, Mafs, KaTeX, Vitest, Playwright), `tsconfig.json`, `src/layouts`, `src/components/{layout,plots,ui}` (PlotFrame, WidgetFrame, Slider, Segmented, Button, Quiz, RichText, Details, useTweened), `src/styles` (colour tokens, dark and light themes), `scripts/screenshots.mjs`, `.github/workflows/ci.yml` (build, test, deploy to Pages). Remove option-specific code (`src/lib/*` pricing and microstructure, option chapters, option colour macros).

Adapt: UI strings and `<html lang>` to Spanish ("Anterior", "Siguiente", "Comprueba lo aprendido", etc.); site title "Economía Financiera"; colour tokens renamed for finance meaning (`--c-rate` interest rate, `--c-pv` present value, `--c-fv` future value, `--c-risk`, `--c-return`); KaTeX macros file `src/lib/katexMacros.ts` reset to a few generic finance macros (`\VA`, `\VF`, `\VAN`, `\TIR`, `\Rate`, `\E`, `\Var`, `\Cov`). Add ONE placeholder chapter `src/content/chapters/00-ejemplo.mdx` with a working slider widget and a quiz, to prove the pipeline. Do not write real course content and do not touch `goals/`. Out of scope: problem-session pages (TASK-006), the style guide (TASK-007).

## Acceptance

- `npm ci && npm test && npm run build` pass on a clean clone.
- `npm run screenshots` renders the placeholder chapter in dark and light, desktop and phone, with no console error, KaTeX error or horizontal overflow.
- `dist/` contains no string "option" in page titles or navigation (grep).
- The placeholder chapter's slider changes its readout (Playwright click-through script committed under `scripts/`).

## Verify

```sh
npm ci && npm test && npm run build
npm run screenshots
grep -ril 'black-scholes\|strike' src dist | head   # must print nothing
```
