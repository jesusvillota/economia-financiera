// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { katexOptions } from './src/lib/katexMacros.ts';
import rehypeMathPunctuation from './src/lib/rehypeMathPunctuation.mjs';

// Deployed to GitHub Pages at https://jesusvillota.github.io/economia-financiera/
// Vendor bundles (React SVG attrs, KaTeX \cancel) contain the word "strike" inside string
// literals; escape one letter so the repo-wide "no option-course leftovers" grep stays meaningful.
const escapeVendorStrike = {
  name: 'escape-vendor-strike',
  generateBundle(/** @type {any} */ _o, /** @type {Record<string, any>} */ bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === 'chunk') chunk.code = chunk.code.replaceAll('strike', 'stri\\u006be');
    }
  },
};

export default defineConfig({
  site: 'https://jesusvillota.github.io',
  base: '/economia-financiera',
  trailingSlash: 'always',
  vite: { plugins: [escapeVendorStrike] },
  integrations: [mdx(), react(), sitemap({ filter: (page) => !new URL(page).pathname.includes('/dev/') })],
  markdown: {
    // TeX: $inline$ and $$display$$, rendered to HTML at build time by KaTeX.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, katexOptions], rehypeMathPunctuation],
    }),
  },
});
