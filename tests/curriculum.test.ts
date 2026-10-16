import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parts } from '../src/data/curriculum';

const chapters = parts.flatMap((p) => p.chapters);

// Rows "| n | title | status | prereq | ..." of docs/AUDIT.md section 4.
const audit = readFileSync('docs/AUDIT.md', 'utf8').split('## 4. Proposed curriculum')[1].split('## 5.')[0];
const rows = [...audit.matchAll(/^\| (\d+) \|.*?\|.*?\| ([^|]+?) \|/gm)].map((m) => ({
  number: +m[1],
  prerequisites: m[2].trim() === 'none' ? [] : m[2].split(',').map((x) => +x),
}));

it('matches the chapters and prerequisites of docs/AUDIT.md', () => {
  expect(rows).toHaveLength(21);
  expect(chapters.map(({ number, prerequisites }) => ({ number, prerequisites }))).toEqual(rows);
});

it('every written chapter is in the curriculum (placeholder allowed)', () => {
  const written = readdirSync('src/content/chapters').map((f) => f.replace(/\.mdx$/, ''));
  const known = new Set(chapters.map((c) => c.slug));
  // 00-ejemplo was the template placeholder; it went away with chapter 1.
  expect(written.filter((s) => s !== '00-ejemplo' && !known.has(s))).toEqual([]);
});
