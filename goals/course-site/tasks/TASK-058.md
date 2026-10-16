---
id: TASK-058
title: 'SEO and polish: page meta and social card, 404 page, sitemap, landing page, README'
milestone: M-6
state: approved
depends_on: [TASK-057]
delivery: pr
---

## Why

SC-1: the deployed site must look finished when shared or opened by a wrong URL.

## Scope

Add a page `<meta>` description and Open Graph / Twitter tags in `BaseLayout.astro` (title, description from frontmatter or default, `public/og.png` social card made from the existing `public/course-preview.svg`), `src/pages/404.astro` in house style with links to the index and the glossary, a sitemap (`@astrojs/sitemap` or a small endpoint, `site` already set), a polished landing page (`src/pages/index.astro`: course summary, the five parts, the four sessions and the exam, last-updated), and a `README.md` front section. Test the meta helper in `tests/seo.test.ts`. Out of scope: new chapters or search changes.

## Acceptance

- `npm test` passes.
- `npm run build` passes; `dist/404.html` and `dist/sitemap-index.xml` (or `sitemap.xml`) exist.
- `dist/index.html` has `og:title`, `og:description` and `og:image`.
- `npm run screenshots` for the landing page shows no console, KaTeX or overflow error.

## Verify

```sh
npm test
npm run build
test -f dist/404.html && ls dist | grep -i sitemap
grep -c 'og:image' dist/index.html
npm run screenshots dev
```
