import { describe, expect, it } from 'vitest';
import { normalizeSearch, rankSearch, searchPlainText, type SearchEntry } from '../src/lib/search';

const entry = (title: string, kind: SearchEntry['kind'] = 'chapter', extra: Partial<SearchEntry> = {}): SearchEntry => ({
  title, kind, headings: [], excerpt: '', text: '', url: `/${title}/`, ...extra,
});

describe('Spanish search', () => {
  it('matches case, composed/decomposed accents and whitespace', () => {
    expect(normalizeSearch('  DURACIO\u0301N\n  e INTERÉS ')).toBe('duracion e interes');
    expect(rankSearch([entry('Duración')], 'DURACION')).toHaveLength(1);
    expect(rankSearch([entry('TIR')], 'tir')).toHaveLength(1);
  });
  it('returns no results for empty queries, missing terms or misspellings', () => {
    const entries = [entry('Duración')];
    for (const query of ['', ' \n ', 'durcaion', 'duración inexistente']) expect(rankSearch(entries, query)).toEqual([]);
  });
  it('ranks chapter 19 first for duración, ahead of glossary and incidental mentions', () => {
    const chapter = entry('Duración y riesgo de tipo de interés', 'chapter', { url: '/chapters/19-duracion/' });
    const glossary = entry('Duración de Macaulay', 'glossary');
    const session = entry('Práctica', 'session', { text: 'Calcula la duración del bono.' });
    expect(rankSearch([session, glossary, chapter], 'duración')).toEqual([chapter, glossary, session]);
  });
  it('orders exact titles, title prefixes, titles, headings, summaries and full prose', () => {
    const entries = [
      entry('TIR'), entry('TIR de un bono'), entry('Calcular la TIR'),
      entry('Inversión', 'chapter', { headings: ['La TIR'] }),
      entry('Proyectos', 'chapter', { excerpt: 'Usa la TIR.' }),
      entry('Práctica', 'session', { text: 'Al final, calcula la TIR.' }),
    ];
    expect(rankSearch([...entries].reverse(), 'TIR')).toEqual(entries);
  });
  it('requires all words across fields and handles repeated query words', () => {
    const result = entry('Duración', 'session', { text: 'El bono tiene cupón anual.' });
    expect(rankSearch([result, entry('Duración')], 'bono DURACIÓN duración')).toEqual([result]);
  });
  it('uses substrings without fuzzy matching, with stable ties and a result limit', () => {
    const a = entry('Bono', 'glossary', { url: '/a' });
    const b = entry('Bono', 'glossary', { url: '/b' });
    expect(rankSearch([b, a], 'bon')).toEqual([a, b]);
    expect(rankSearch([b, a], 'bon', 1)).toEqual([a]);
    expect(rankSearch([a], 'bon', 0)).toEqual([]);
    const original = [b, a];
    rankSearch(original, 'bon');
    expect(original).toEqual([b, a]);
  });
});

describe('search prose extraction', () => {
  it('keeps Spanish prose, headings and link labels, excluding code, maths and component props', () => {
    const source = `import Quiz from './Quiz';

## <span class="section-tag">Intuición</span>Un bono
El **cupón** y la [duración](/chapters/19-duracion/) miden cosas distintas.
<Quiz
  options={[{ text: 'private widget configuration' }]}
/>
<details><summary>Más información</summary>El riesgo cambia.</details>
$P=100$ y $$D=5$$
\`\`\`js
throw new Error('code');
\`\`\`
<!-- hidden comment -->`;
    expect(searchPlainText(source)).toBe('Intuición Un bono El cupón y la duración miden cosas distintas. Más información El riesgo cambia. y');
  });
  it('keeps exercise prose while removing parameter placeholders', () => {
    expect(searchPlainText('Invierte {{capital}} € y calcula el **VAN**.')).toBe('Invierte € y calcula el VAN.');
  });
});
