import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sessionSchema } from './schemas/problem-session';

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

const sesiones = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sesiones' }),
  schema: sessionSchema,
});

export const collections = { chapters, sesiones };
