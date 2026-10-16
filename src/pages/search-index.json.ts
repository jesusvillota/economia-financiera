import type { APIRoute } from 'astro';
import { getCollection, render } from 'astro:content';
import { glossary } from '../data/glossary';
import { url } from '../data/curriculum';
import { searchPlainText, type SearchEntry } from '../lib/search';

export const prerender = true;

export const GET: APIRoute = async () => {
  const chapters = await getCollection('chapters');
  const sessions = await getCollection('sesiones');
  const entries: SearchEntry[] = await Promise.all([...chapters, ...sessions].map(async (entry) => {
    const { headings } = await render(entry);
    const exercises = entry.collection === 'sesiones' ? entry.data.exercises.flatMap((exercise) => [
      exercise.statement, ...exercise.hints, ...exercise.steps.flatMap((step) => [step.title, step.body]),
    ]) : [];
    return {
      title: entry.data.title,
      headings: headings.map((heading) => searchPlainText(heading.text)),
      excerpt: searchPlainText(entry.data.summary),
      text: searchPlainText([entry.body ?? '', ...exercises].join('\n')),
      url: url(`${entry.collection === 'chapters' ? 'chapters' : 'sesiones'}/${entry.id}/`),
      kind: entry.collection === 'chapters' ? 'chapter' : 'session',
    };
  }));
  for (const term of glossary) entries.push({
    title: term.term, headings: [], excerpt: term.definition, text: term.definition,
    url: url(`glosario/#${term.id}`), kind: 'glossary',
  });
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
