import { z } from 'astro/zod';

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
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  parameters: z.array(parameter).default([]),
  seed: z.number().int().default(1),
  hints: z.array(z.string()).default([]),
  steps: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  answers: z.array(answer).min(1),
  // Slugs of chapters explaining the concept (links from the exercise).
  concepts: z.array(z.string()).default([]),
});

export const sessionSchema = z.object({
  title: z.string(),
  number: z.number().int().min(1),
  source: z.string().regex(/^(ps\d+|examen)$/),
  chapters: z.array(z.string()).default([]),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  summary: z.string(),
  exercises: z.array(exercise).min(1),
});
