import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parse } from 'yaml';
import { sessionSchema } from '../src/schemas/problem-session';

const entries = (dir: string) => readdirSync(dir).filter((file) => /\.mdx?$/.test(file)).map((file) => ({
  slug: file.replace(/\.mdx?$/, ''),
  data: parse(readFileSync(`${dir}/${file}`, 'utf8').split('---')[1]),
}));

it('ps1 links to all three real chapters and each chapter links back', () => {
  const chapters = entries('src/content/chapters');
  const sessions = entries('src/content/sesiones');
  const ps1 = sessions.find((session) => session.slug === '01-interes-y-rentas')!;
  const data = sessionSchema.parse(ps1.data);
  expect(data.chapters).toEqual(['01-interes', '02-valor-actual', '03-van-tir']);
  for (const slug of data.chapters) {
    expect(chapters.find((chapter) => chapter.slug === slug)?.data.sessions).toContain(ps1.slug);
  }
  for (const exercise of data.exercises) {
    expect(exercise.concepts.length).toBeGreaterThan(0);
    for (const slug of exercise.concepts) expect(data.chapters).toContain(slug);
  }
  expect(new Set(sessions.map((session) => session.data.number)).size).toBe(sessions.length);
  expect(sessions.some((session) => session.slug === '00-ejemplo')).toBe(false);
});
