import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Contracts: docs/contracts/chapter.md and docs/contracts/problem-session.md.
// Keep schema and docs in sync.

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    part: z.number().int().min(1).max(16),
    chapter: z.number().int().min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    prerequisites: z.array(z.number().int()).default([]),
    summary: z.string(),
    // Slugs of sesiones whose exercises practise this chapter (back-links).
    sessions: z.array(z.string()).default([]),
  }),
});

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);

const parameter = z.object({
  id,
  label: z.string(),
  default: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  unit: z.string().optional(),
});

const answer = z.object({
  id,
  label: z.string(),
  unit: z.string().optional(),
  // Expected value at the default parameters.
  value: z.number(),
  tolerance: z.object({ kind: z.enum(['abs', 'rel']), value: z.number().positive() }),
  // Ties the answer to a function exported by src/lib/<module>.ts; tests call
  // fn(...args.map(id => parameters[id])) and compare with `value`.
  lib: z.object({
    module: z.string(),
    fn: z.string(),
    args: z.array(id),
  }),
});

const exercise = z.object({
  id,
  statement: z.string(),
  parameters: z.array(parameter).default([]),
  seed: z.number().int().default(1),
  hints: z.array(z.string()).default([]),
  steps: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  answers: z.array(answer).min(1),
  // Slugs of chapters explaining the concept (links from the exercise).
  concepts: z.array(z.string()).default([]),
});

const sesiones = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sesiones' }),
  schema: z.object({
    title: z.string(),
    number: z.number().int().min(1),
    source: z.string().regex(/^ps\d+$/),
    chapters: z.array(z.string()).default([]),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    summary: z.string(),
    exercises: z.array(exercise).min(1),
  }),
});

export const collections = { chapters, sesiones };
