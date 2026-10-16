/** Check the built site's links and course navigation. Run after npm run build. */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { parse as parseYaml } from 'yaml';

/** Extract browser-parsed links, anchors and navigation from an HTML document. */
export function readPage(path, html) {
  /** @type {{ path: string, title: string, h1Count: number, ids: Set<string>, links: { href: string, classes: string[], nav: string }[] }} */
  const page = { path, title: '', h1Count: 0, ids: new Set(), links: [] };
  function visit(node, nav = '') {
    const attrs = Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
    if (node.tagName === 'nav') nav = attrs['aria-label'] ?? '';
    if (attrs.id) page.ids.add(attrs.id);
    if (node.tagName === 'a' && attrs.name) page.ids.add(attrs.name);
    if (node.tagName === 'h1') page.h1Count++;
    if (node.tagName === 'title') {
      page.title += (node.childNodes ?? []).map((child) => child.value ?? '').join('');
    }
    if (attrs.href !== undefined) {
      page.links.push({ href: attrs.href, classes: (attrs.class ?? '').split(/\s+/), nav });
    }
    for (const child of node.childNodes ?? []) visit(child, nav);
  }
  visit(parse(html));
  return page;
}

/** Resolve a link within the deployed base; external URLs return null. */
export function resolveLink(href, source, site, base) {
  const root = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '');
  const origin = new URL(site).origin;
  const target = new URL(href, `${origin}${root}${source}`);
  if (!['http:', 'https:'].includes(target.protocol) || target.origin !== origin) return null;
  if (target.pathname !== root && !target.pathname.startsWith(`${root}/`)) {
    // Other projects on the same host are external when explicitly linked by URL.
    if (/^(https?:)?\/\//i.test(href)) return null;
    throw new Error(`link escapes site base ${root || '/'}: ${href}`);
  }
  const path = decodeURIComponent(target.pathname.slice(root.length)) || '/';
  if (path.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error(`invalid path: ${href}`);
  }
  return { path, anchor: decodeURIComponent(target.hash.slice(1)) };
}

/** Match real files, including directory URLs with or without a trailing slash. */
export function findFile(path, files) {
  return [path, `${path.replace(/\/$/, '')}/index.html`].find((candidate) => files.has(candidate));
}

/** Pure validation: files and pages use paths relative to dist, starting with /. */
export function checkSite({ pages, files, chapters, sessions, site, base }) {
  const errors = [];
  const byFile = new Map(pages.map((page) => [page.path, page]));
  let linksChecked = 0;
  function target(page, link) {
    const resolved = resolveLink(link.href, page.path, site, base);
    return resolved && { ...resolved, file: findFile(resolved.path, files) };
  }
  for (const page of pages) {
    if (page.h1Count !== 1) errors.push(`${page.path}: expected one h1, found ${page.h1Count}`);
    if (!page.title.trim()) errors.push(`${page.path}: missing or empty title`);
    for (const link of page.links) {
      try {
        const result = target(page, link);
        if (!result) continue;
        linksChecked++;
        if (!result.file) errors.push(`${page.path}: missing target ${link.href}`);
        else if (result.anchor && byFile.has(result.file) && !byFile.get(result.file).ids.has(result.anchor)) {
          errors.push(`${page.path}: missing anchor ${link.href}`);
        }
      } catch (error) {
        errors.push(`${page.path}: ${error.message}`);
      }
    }
  }
  function navFiles(page, nav, direction) {
    return page.links.filter((link) => link.nav === nav && (!direction || link.classes.includes(direction)))
      .map((link) => {
        try { return target(page, link)?.file ?? link.href; }
        catch { return link.href; }
      });
  }
  function expectLinks(page, nav, expected, direction) {
    const actual = navFiles(page, nav, direction);
    if (actual.length !== expected.length || expected.some((file) => !actual.includes(file))) {
      errors.push(`${page.path}: ${nav}${direction ? ` (${direction})` : ''}: expected [${expected.join(', ')}], found [${actual.join(', ')}]`);
    }
  }
  const chapterFiles = chapters.map(({ slug }) => `/chapters/${slug}/index.html`);
  const sessionFiles = sessions.map(({ slug }) => `/sesiones/${slug}/index.html`);
  for (const page of pages) {
    if (page.path.startsWith('/chapters/') && !chapterFiles.includes(page.path)) {
      errors.push(`${page.path}: chapter is absent from curriculum.ts`);
    }
    if (page.path.startsWith('/sesiones/') && page.path !== '/sesiones/index.html' && !sessionFiles.includes(page.path)) {
      errors.push(`${page.path}: session is absent from curriculum.ts`);
    }
  }
  chapterFiles.forEach((file, i) => {
    const page = byFile.get(file);
    if (!page) { errors.push(`curriculum.ts: missing chapter page ${file}`); return; }
    expectLinks(page, 'Navegación entre capítulos', i ? [chapterFiles[i - 1]] : [], 'prev');
    expectLinks(page, 'Navegación entre capítulos', i < chapterFiles.length - 1 ? [chapterFiles[i + 1]] : [], 'next');
    expectLinks(page, 'Sesiones para practicar', sessions.flatMap((session, j) =>
      session.chapters.includes(chapters[i].number) ? [sessionFiles[j]] : []));
  });
  sessionFiles.forEach((file, i) => {
    const page = byFile.get(file);
    if (!page) { errors.push(`curriculum.ts: missing session page ${file}`); return; }
    const expected = sessions[i].chapters.map((number) => {
      const index = chapters.findIndex((chapter) => chapter.number === number);
      if (index < 0) errors.push(`curriculum.ts: session ${sessions[i].slug} names unknown chapter ${number}`);
      return chapterFiles[index];
    });
    expectLinks(page, 'Capítulos de esta sesión', expected);
    // Exercise and prose links must agree with the session's curriculum coverage too.
    const linkedChapters = new Set(page.links.flatMap((link) => {
      try {
        const file = target(page, link)?.file;
        return chapterFiles.includes(file) ? [file] : [];
      } catch { return []; }
    }));
    for (const chapter of linkedChapters) {
      if (!expected.includes(chapter)) errors.push(`${file}: chapter link outside curriculum coverage: ${chapter}`);
    }
    expectLinks(page, 'Navegación entre sesiones', i ? [sessionFiles[i - 1]] : [], 'prev');
    expectLinks(page, 'Navegación entre sesiones', ['/sesiones/index.html', ...sessionFiles.slice(i + 1, i + 2)], 'next');
  });
  return { errors, pagesChecked: pages.length, linksChecked };
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const dist = join(root, 'dist');
  const files = new Set(walk(dist).map((file) => `/${relative(dist, file)}`));
  const pages = [...files].filter((file) => file.endsWith('.html'))
    .map((file) => readPage(file, readFileSync(join(dist, file), 'utf8')));
  if (!pages.length) throw new Error('No HTML pages found. Run npm run build first.');
  const { parts, sessions, finalExam } = await import('../src/data/curriculum.ts');
  const { default: config } = await import('../astro.config.mjs');
  // Only identify session routes from frontmatter; expected coverage comes from curriculum.ts.
  const entries = readdirSync(join(root, 'src/content/sesiones')).filter((file) => /\.mdx?$/.test(file))
    .map((file) => ({ slug: file.replace(/\.mdx?$/, ''), data: parseYaml(readFileSync(join(root, 'src/content/sesiones', file), 'utf8').split('---')[1]) }));
  const sessionRoutes = sessions.map((session) => {
    const matches = entries.filter(({ data }) => data.source === `ps${session.number}`);
    if (matches.length !== 1) throw new Error(`Expected one content entry for ps${session.number}, found ${matches.length}`);
    return { ...session, slug: matches[0].slug };
  });
  const result = checkSite({ pages, files, chapters: parts.flatMap((part) => part.chapters),
    sessions: [...sessionRoutes, finalExam], site: config.site, base: config.base ?? '/' });
  console.log(`Checked ${result.pagesChecked} pages and ${result.linksChecked} internal links.`);
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    console.error(`${result.errors.length} site defect(s) found.`);
    process.exitCode = 1;
  } else console.log('All site checks passed (links, anchors, headings, curriculum and chapter/session navigation).');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Site check failed: ${error.message}`);
    process.exitCode = 1;
  });
}
