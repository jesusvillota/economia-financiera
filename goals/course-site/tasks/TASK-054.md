---
id: TASK-054
title: 'Audit trace: every AUDIT.md fix lists its test, checked by a script'
milestone: M-6
state: approved
depends_on: []
delivery: pr
---

## Why

SC-5: errors in the source notes must be logged in `docs/AUDIT.md`, corrected on the site and tested.

## Scope

Add `scripts/check-audit.mjs` and `npm run check:audit`: parse `docs/AUDIT.md` sections 1 and 2, and for each logged error require a `Test:` reference to an existing test file and test name (grep in `tests/`). Add the missing `Test:` references; when an error has no test, add a Vitest assertion in the matching `tests/*.test.ts` that pins the corrected value. Add `tests/audit.test.ts` for the parser. Touch `docs/AUDIT.md` only to add references. Out of scope: new audit findings (record them with a note in the PR body).

## Acceptance

- `npm run check:audit` exits 0 and prints the count of audited errors, all with a test.
- `npm test` passes.
- `npm run build` passes.

## Verify

```sh
npm test
npm run check:audit
npm run build
```
