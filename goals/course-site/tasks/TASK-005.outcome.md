## Acceptance

- [x] Both contract docs exist and name every frontmatter field with type and meaning. Evidence: `docs/contracts/chapter.md` (7 fields) and `docs/contracts/problem-session.md` (session, exercise, parameter, answer tables); `ls docs/contracts` lists both.
- [x] `npm run build` validates the two fixtures; a broken fixture fails. Evidence: `src/content/chapters/00-ejemplo.mdx` and `src/content/sesiones/00-ejemplo.md` build; a temporary `99-roto.md` with `difficulty: 9` made the build fail with `InvalidContentEntryDataError ... sesiones → 99-roto` and was deleted.
- [x] `npm test` and `npm run build` pass. Evidence: 4 tests passed; build complete.

## Summary

What: Zod collections `chapters` (new field `sessions`) and `sesiones` in `src/content.config.ts`; two contract docs; one session fixture; `tests/sesiones.test.ts` asserts each answer against its `src/lib` function.
How: exercises live in session frontmatter; each answer has `lib: {module, fn, args}`.
Deviations: added devDependencies `yaml` (parse frontmatter in the test) and `@types/node` (type-check the test).
Verified revision: PR head commit.
Follow-ups: TASK-006 components read this schema; seeded-variant generator is left to it.
