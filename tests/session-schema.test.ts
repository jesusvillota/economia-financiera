import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { sessionSchema } from '../src/schemas/problem-session';

const fixture = parse(readFileSync('tests/fixtures/session.md', 'utf8').split('---')[1]);

// Parse the same schema used by Astro, including defaults and retained fields.
describe('problem-session schema', () => {
  it('accepts source: examen and retains each exercise difficulty', () => {
    const result = sessionSchema.parse({
      ...fixture,
      source: 'examen',
      exercises: [1, 2, 3].map((difficulty) => ({ ...fixture.exercises[0], difficulty })),
    });
    expect(result.source).toBe('examen');
    expect(result.exercises.map((exercise) => exercise.difficulty)).toEqual([1, 2, 3]);
  });

  it('keeps existing ps sessions valid without exercise difficulty', () => {
    const result = sessionSchema.parse(fixture);
    expect(result.source).toBe('ps1');
    expect(result.exercises[0].difficulty).toBeUndefined();
    expect(result.exercises[0].seed).toBe(1);
  });

  it.each(['exam', 'ps', 'examen1'])('rejects unsupported source %s', (source) => {
    expect(sessionSchema.safeParse({ ...fixture, source }).success).toBe(false);
  });

  it.each([0, 4, 1.5, '2'])('rejects invalid exercise difficulty %s', (difficulty) => {
    expect(sessionSchema.safeParse({
      ...fixture, exercises: [{ ...fixture.exercises[0], difficulty }],
    }).success).toBe(false);
  });
});
