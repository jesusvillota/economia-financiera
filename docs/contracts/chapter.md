# Contract: chapter

Collection `chapters`, files `src/content/chapters/*.mdx`. Schema: `src/content.config.ts` (Zod). The build fails if a field is missing or has the wrong type.

## Frontmatter

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Chapter title, in Spanish. |
| `part` | integer 1–16 | Part of the course (see the curriculum in `docs/AUDIT.md` §4). |
| `chapter` | integer ≥ 1 | Chapter number, unique across the site. |
| `difficulty` | 1 \| 2 \| 3 | 1 = intro, 2 = intermediate, 3 = advanced. |
| `prerequisites` | integer[] (default `[]`) | `chapter` numbers to read first. |
| `summary` | string | One-sentence description for the course map and meta tags. |
| `sessions` | string[] (default `[]`) | Slugs (ids) of `sesiones` entries that practise this chapter. Back-link of `sesiones.chapters`. |

## Body

MDX. Sections start with `## <span class="section-tag">Tag</span>Title`. Maths in KaTeX, using the macros in `src/lib/katexMacros.ts`. Short `<Quiz>` blocks go in the chapter (DEC-001); full exercises go in a session.

## Slugs

A chapter slug is its file name without extension (e.g. `00-ejemplo`). Sessions refer to chapters by slug.
