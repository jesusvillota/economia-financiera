# CLAUDE.md

Interactive, 3Blue1Brown-style Spanish-language course site for Economía Financiera: lecture chapters plus a separate track of problem sessions (DEC-001). Modelled on options-explained.

## Read first
- `docs/STYLE_GUIDE.md`: voice, chapter and problem-session templates, notation, colours, widgets, checklist.
- `docs/AUDIT.md`: source errors, notation inventory and the proposed curriculum (section 4).
- `src/data/curriculum.ts`: the chapter list the navigation uses. Keep it in sync with the curriculum.
- `src/content/chapters/01-interes.mdx`: the reference chapter showing the structure.

## Stack
Astro 7 (static, base `/economia-financiera`) + MDX + KaTeX (`remark-math`/`rehype-katex`) + React 18 islands (Mafs) + Vitest. Deployed to GitHub Pages.

## Commands
- `npm run dev`: dev server
- `npm test`: Vitest unit tests (`tests/`)
- `npm run build`: `astro check` plus the static build
- `npm run preview`: serve the built site
- `npm run screenshots`: run after a build; writes screenshots (dark/light × desktop/phone) and fails on console errors, KaTeX errors or overflow
- `npm run clickthrough`: click through the slider widget and check its readout

## Rules
- **One commit per chapter**, one PR per task. Touch only the files your task needs.
- **Template:** Gancho → Intuición → Formalización → Zona de juego → Compruébalo → Resumen, each `##` starting with `<span class="section-tag">…</span>`.
- **Notation and colours** from the style guide. In TeX use the macros in `src/lib/katexMacros.ts`, never raw `\color`. A new symbol goes in the notation table in the same PR.
- **All maths in `src/lib/`** with Vitest tests; components import from it. Every number in the text or in a solution is tested.
- **Numbers:** decimal comma and `€` in prose; `1{,}5` in math. A literal `$` in MDX prose is `\$`.
- **Widgets:** `PlotFrame` + `WidgetFrame`, CSS variables for colour, `client:visible`, seeded randomness, 360 px wide.
- Do not copy third-party slides or cases. Write original examples.
- Option pricing depth: link to options-explained, do not rewrite it.

## Verify before pushing
`npm test && npm run build`; then `npm run screenshots` and look at the images for changed pages.

## Gotchas
- `astro.config.mjs` has a small Vite plugin that rewrites vendor strings (so site-wide greps for option terms stay clean). Leave it.
- Mafs renders nothing until it mounts; `WidgetFrame` reserves the plot height.
- `rehypeMathPunctuation` glues punctuation to short inline formulas; do not put a space before a comma after `$…$`.
