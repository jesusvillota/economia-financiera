import { describe, expect, it } from 'vitest';
import { checkSite, findFile, readPage, resolveLink } from '../scripts/check-site.mjs';

const site = 'https://example.org';
const base = '/course';
const link = (href: string, nav = '', direction = '') => ({ href, nav, classes: [direction] });
const chapter = '/chapters/one/index.html';
const session = '/sesiones/practice/index.html';
function fixture() {
  const pages = [readPage(chapter, '<title>Chapter</title><h1>One</h1><h2 id="idea">Idea</h2>'),
    readPage(session, '<title>Session</title><h1>Practice</h1>'),
    readPage('/sesiones/index.html', '<title>Sessions</title><h1>Sessions</h1>')];
  pages[0].links.push(link('/course/sesiones/practice/', 'Sesiones para practicar'));
  pages[1].links.push(link('/course/chapters/one/#idea', 'Capítulos de esta sesión'),
    link('/course/sesiones/', 'Navegación entre sesiones', 'next'));
  return { pages, files: new Set(pages.map((page) => page.path)),
    chapters: [{ number: 1, slug: 'one' }], sessions: [{ slug: 'practice', chapters: [1] }], site, base };
}

describe('HTML extraction and URL resolution', () => {
  it('uses HTML parsing for entities, quote styles, legacy anchors and navigation', () => {
    const page = readPage('/index.html', `<!-- <h1>ignored</h1> --><title>A &amp; B</title><h1>Real</h1>
      <script>const text = '<a href="bad">';</script><h2 id='a&amp;b'>Idea</h2><a name=old></a>
      <nav aria-label='Course'><a class='prev extra' href='?x=1&amp;y=2#a%26b'>Back</a></nav>`);
    expect(page.title).toBe('A & B');
    expect(page.h1Count).toBe(1);
    expect([...page.ids]).toEqual(['a&b', 'old']);
    expect(page.links).toEqual([{ href: '?x=1&y=2#a%26b', nav: 'Course', classes: ['prev', 'extra'] }]);
  });

  it.each([
    ['#a%26b', '/chapters/one/index.html', '/chapters/one/index.html', 'a&b'],
    ['../two/?q=1#idea', '/chapters/one/index.html', '/chapters/two/', 'idea'],
    ['/course/file%20name.pdf', '/index.html', '/file name.pdf', ''],
    ['https://example.org/course/', '/index.html', '/', ''],
    ['//example.org/course/', '/index.html', '/', ''],
    ['', '/index.html', '/index.html', ''],
  ])('resolves %s', (href, source, path, anchor) => {
    expect(resolveLink(href, source, site, base)).toEqual({ path, anchor });
  });

  it.each(['https://elsewhere.org/course/', 'mailto:hello@example.org', 'tel:123',
    'https://example.org/other-project/', 'data:text/plain,hello'])('skips external URL %s', (href) => {
    expect(resolveLink(href, '/index.html', site, base)).toBeNull();
  });

  it('rejects missing base paths, base-prefix lookalikes and malformed escapes', () => {
    for (const href of ['/chapters/one/', '/course-other/', '/course/%ZZ', '/course/%2e%2e%2fsecret']) {
      expect(() => resolveLink(href, '/index.html', site, base)).toThrow();
    }
    expect(resolveLink('/chapter/#x', '/index.html', site, '/')).toEqual({ path: '/chapter/', anchor: 'x' });
  });

  it('matches HTML routes and assets, and rejects absent files', () => {
    const files = new Set(['/index.html', chapter, '/asset.svg']);
    expect(findFile('/', files)).toBe('/index.html');
    expect(findFile('/chapters/one', files)).toBe(chapter);
    expect(findFile('/chapters/one/', files)).toBe(chapter);
    expect(findFile('/asset.svg', files)).toBe('/asset.svg');
    expect(findFile('/missing/', files)).toBeUndefined();
  });
});

describe('built site consistency', () => {
  it('passes a consistent site and reports counts', () => {
    expect(checkSite(fixture())).toEqual({ errors: [], pagesChecked: 3, linksChecked: 3 });
  });

  it('reports broken pages, assets, anchors and base paths with the source', () => {
    const data = fixture();
    data.pages[0].links.push(...['/course/missing/', '/course/missing.svg', '#absent', '/wrong/', '/course/%ZZ']
      .map((href) => link(href)));
    const result = checkSite(data);
    expect(result.errors).toHaveLength(5);
    expect(result.errors.every((error: string) => error.startsWith(chapter))).toBe(true);
    expect(result.errors.join('\n')).toContain('missing anchor #absent');
  });

  it('rejects zero or multiple h1 headings and empty titles', () => {
    const data = fixture();
    data.pages[0].h1Count = 0;
    data.pages[1].h1Count = 2;
    data.pages[1].title = '  ';
    expect(checkSite(data).errors).toHaveLength(3);
  });

  it('checks curriculum coverage in both directions', () => {
    const data = fixture();
    data.chapters.push({ number: 2, slug: 'missing' });
    data.pages.push(readPage('/chapters/unlisted/index.html', '<title>Extra</title><h1>Extra</h1>'));
    const errors = checkSite(data).errors.join('\n');
    expect(errors).toContain('missing chapter page /chapters/missing/index.html');
    expect(errors).toContain('chapter is absent from curriculum.ts');
  });

  it('does not let sidebar links conceal broken previous/next navigation', () => {
    const data = fixture();
    data.chapters.push({ number: 2, slug: 'two' });
    const second = readPage('/chapters/two/index.html', '<title>Two</title><h1>Two</h1>');
    data.pages.push(second);
    data.files.add(second.path);
    data.pages[0].links.push(link('/course/chapters/two/', 'Contenidos del curso'));
    second.links.push(link('/course/chapters/one/', 'Navegación entre capítulos', 'prev'));
    expect(checkSite(data).errors).toEqual([expect.stringContaining('Navegación entre capítulos (next)')]);
    data.pages[0].links.push(link('/course/chapters/two/', 'Navegación entre capítulos', 'next'));
    expect(checkSite(data).errors).toEqual([]);
    second.links.push(link('/course/chapters/one/', 'Navegación entre capítulos', 'next'));
    expect(checkSite(data).errors).toEqual([expect.stringContaining('(next): expected []')]);
  });

  it('requires chapter back-links in the practice navigation', () => {
    const data = fixture();
    data.pages[0].links[0].nav = 'Unrelated';
    expect(checkSite(data).errors).toEqual([expect.stringContaining('Sesiones para practicar')]);
  });

  it('detects session coverage drift and missing or unlisted sessions', () => {
    const data = fixture();
    data.pages[1].links = data.pages[1].links.filter((entry) => entry.nav !== 'Capítulos de esta sesión');
    expect(checkSite(data).errors).toEqual([expect.stringContaining('Capítulos de esta sesión')]);
    data.sessions.push({ slug: 'missing', chapters: [] });
    data.pages.push(readPage('/sesiones/extra/index.html', '<title>Extra</title><h1>Extra</h1>'));
    const errors = checkSite(data).errors.join('\n');
    expect(errors).toContain('missing session page');
    expect(errors).toContain('session is absent from curriculum.ts');
  });

  it('checks exercise and prose chapter links against session coverage', () => {
    const data = fixture();
    data.sessions[0].chapters = [];
    data.pages[0].links = [];
    data.pages[1].links[0].nav = '';
    expect(checkSite(data).errors).toEqual([expect.stringContaining('chapter link outside curriculum coverage')]);
  });

  it('checks session previous/next links as well as the index link', () => {
    const data = fixture();
    data.pages[1].links = data.pages[1].links.filter((entry) => entry.nav !== 'Navegación entre sesiones');
    expect(checkSite(data).errors).toEqual([expect.stringContaining('Navegación entre sesiones (next)')]);
  });
});
