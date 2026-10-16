import { readFileSync, existsSync } from 'node:fs';
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { glossary } from '../src/data/glossary';
import { parts } from '../src/data/curriculum';
import { katexOptions } from '../src/lib/katexMacros';

const chapters = parts.flatMap((part) => part.chapters);
const notation = readFileSync('docs/STYLE_GUIDE.md', 'utf8')
  .split('## Notation')[1].split('## Colours')[0]
  .split('\n').filter((line) => line.startsWith('|') && line.split('|')[2].includes('$'))
  .map((line) => ({
    context: line.split('|')[1].trim(),
    symbols: [...line.split('|')[2].matchAll(/\$([^$]+)\$/g)].map((match) => match[1]),
  }));

describe('glosario', () => {
  it('contains at least 60 distinct terms with definitions and unique anchor ids', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(60);
    expect(new Set(glossary.map((entry) => entry.id)).size).toBe(glossary.length);
    expect(new Set(glossary.map((entry) => entry.term)).size).toBe(glossary.length);
    for (const entry of glossary) {
      expect(entry.id).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
      expect(entry.definition.trim().length).toBeGreaterThan(30);
    }
  });

  it('sorts terms alphabetically using Spanish collation', () => {
    const terms = glossary.map((entry) => entry.term);
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('resolves every chapter reference through the curriculum to an existing chapter', () => {
    for (const entry of glossary) {
      expect(entry.chapters.length, entry.term).toBeGreaterThan(0);
      expect(new Set(entry.chapters).size, entry.term).toBe(entry.chapters.length);
      for (const number of entry.chapters) {
        const chapter = chapters.find((candidate) => candidate.number === number);
        expect(chapter, `${entry.term}: chapter ${number}`).toBeDefined();
        expect(existsSync(`src/content/chapters/${chapter!.slug}.mdx`)).toBe(true);
      }
    }
    expect(new Set(glossary.flatMap((entry) => entry.chapters)))
      .toEqual(new Set(chapters.map((chapter) => chapter.number)));
  });

  it('covers every symbol in the style-guide notation table', () => {
    expect(notation.length).toBeGreaterThan(0);
    const symbols = new Set(glossary.flatMap((entry) => entry.symbols ?? []));
    for (const row of notation) {
      for (const symbol of row.symbols) expect(symbols.has(symbol), `${row.context}: ${symbol}`).toBe(true);
    }
  });

  it.each(notation)('keeps the symbols for $context together in a contextual definition', ({ symbols }) => {
    expect(glossary.some((entry) => symbols.every((symbol) => entry.symbols?.includes(symbol)))).toBe(true);
  });

  it('renders every symbol with the shared KaTeX macros without errors', () => {
    for (const entry of glossary) {
      for (const symbol of entry.symbols ?? []) {
        expect(() => katex.renderToString(symbol, { ...katexOptions, throwOnError: true }), `${entry.term}: ${symbol}`)
          .not.toThrow();
      }
    }
  });
});
