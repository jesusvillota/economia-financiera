export interface SearchEntry {
  title: string;
  headings: string[];
  excerpt: string;
  text: string;
  url: string;
  kind: 'chapter' | 'session' | 'glossary';
}

/** Case, Spanish accents and repeated whitespace do not affect matching. */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

/** Extract prose from our Markdown/MDX sources, without executable component props. */
export function searchPlainText(source: string): string {
  return source
    .replace(/^import\s[\s\S]*?;\s*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[A-Z][\s\S]*?\/>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]*?(?<!\\)\$/g, ' ')
    .replace(/\{\{[^}]*\}\}/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\([\\$*_{}])/g, '$1')
    .replace(/^[\s#>*+-]+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

/** Every query word must be a substring; title matches outrank headings and prose. */
export function rankSearch(entries: readonly SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const normalized = normalizeSearch(query);
  if (!normalized || limit <= 0) return [];
  const terms = [...new Set(normalized.split(' '))];
  const kindOrder = { chapter: 0, session: 1, glossary: 2 };
  return entries.map((entry) => {
    const fields = [entry.title, entry.headings.join(' '), entry.excerpt, entry.text].map(normalizeSearch);
    let score = 0;
    for (const term of terms) {
      const field = fields.findIndex((value) => value.includes(term));
      if (field === -1) return { entry, score: 0 };
      score += [100, 30, 10, 1][field];
    }
    if (fields[0] === normalized) score += 200;
    else if (fields[0].startsWith(normalized)) score += 50;
    return { entry, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || kindOrder[a.entry.kind] - kindOrder[b.entry.kind]
      || a.entry.url.localeCompare(b.entry.url, 'es'))
    .slice(0, limit).map(({ entry }) => entry);
}
