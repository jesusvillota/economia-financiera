# Contract: problem session

Collection `sesiones` (DEC-001: a separate track from chapters), files `src/content/sesiones/*.{md,mdx}`. Schema: `src/content.config.ts`. The exercises live in the frontmatter, so components (TASK-006) and tests read the same data. The body is optional intro text.

## Session frontmatter

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Session title, in Spanish. |
| `number` | integer ≥ 1 | Session order (1–4 for ps1–ps4). |
| `source` | string `ps<N>` | Source problem set, e.g. `ps1`. |
| `chapters` | string[] (default `[]`) | Slugs of the chapters this session practises. |
| `difficulty` | 1 \| 2 \| 3 | 1 = intro, 2 = intermediate, 3 = advanced. |
| `summary` | string | One-sentence description. |
| `exercises` | Exercise[] (min 1) | Ordered exercises. |

## Exercise

| Field | Type | Meaning |
|---|---|---|
| `id` | string `[a-z][a-z0-9_]*` | Unique within the session. |
| `statement` | string | Problem text (Markdown + KaTeX). Refers to parameters by their `id`. |
| `parameters` | Parameter[] (default `[]`) | Values that can vary between variants. |
| `seed` | integer (default `1`) | Seed for the variant generator; the same seed gives the same numbers. |
| `hints` | string[] (default `[]`) | Hint ladder, from the vaguest to the most explicit. |
| `steps` | `{title, body}[]` (min 1) | Ordered solution steps, shown stepwise. |
| `answers` | Answer[] (min 1) | Final numeric answers. |
| `concepts` | string[] (default `[]`) | Chapter slugs that explain the concept. |

### Parameter

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Name used in the statement and in `answers[].lib.args`. |
| `label` | string | Human label. |
| `default` | number | Value of the canonical variant (the one in the source set). |
| `min`, `max` | number, optional | Range for seeded variants. |
| `step` | number > 0, optional | Granularity of variants. |
| `unit` | string, optional | Display unit (`€`, `%`, `años`). |

### Answer

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique within the exercise. |
| `label` | string | What is asked (e.g. "Valor futuro"). |
| `unit` | string, optional | Display unit. |
| `value` | number | Expected value **at the default parameters**. |
| `tolerance` | `{kind: 'abs' \| 'rel', value: number > 0}` | Accepted error: absolute, or relative to `value`. Used by the checker and the tests. |
| `lib` | `{module, fn, args}` | Ties the answer to code: `fn` is exported by `src/lib/<module>.ts`; `args` lists parameter `id`s in call order. |

## Answer ↔ `src/lib` link

`tests/sesiones.test.ts` reads every session, calls `lib.fn(...lib.args.map(id => parameter default))` and asserts the result is within `tolerance` of `value`. The same function computes the answer for any seeded variant, so the checker and the tests never disagree. Every new answer must have a `lib` entry; do not hard-code numbers in components.

## Cross-links

`sesiones.chapters` and `exercise.concepts` point to chapter slugs; `chapters.sessions` points back. A chapter slug is its file name without extension.
