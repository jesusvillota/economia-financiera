---
id: TASK-004
title: 'Source audit: coverage map, errors and proposed curriculum'
milestone: M-1
state: approved
depends_on: [TASK-002]
delivery: pr
kind: discovery
---

## Why

SC-5 and the curriculum: the notes are inputs, not truth. This report decides what we keep, fix, add or drop, and feeds DEC-001 and DEC-002.

## Scope

Read `source/` (TASK-002) and, for lecture slides L1 to L10 and the Netscape case, the LOCAL-ONLY files under `~/GitHub/_Other_/Teaching/TA_Financial_Markets/lecture_notes/` and `OCR/` (third-party slides: read, never copy into this repo; if the folder is missing, write `Goal-Blocked`). Write `docs/AUDIT.md` with:

1. **Coverage map**: a table lecture L1..L10 -> class note section(s) -> problem set exercises -> topics with no note yet (expected: fixed income, forwards, futures, options basics from ps4/L9/L10).
2. **Errors and inconsistencies** in notes and problem sets: recompute every numeric answer in ps1..ps4 and the exam (python3, show the check) and list mismatches, with the corrected value. Start from `source/problem_sets/ps2/numerical_errors_report.md`.
3. **Notation inventory**: symbols used across notes, clashes (e.g. the same letter for different things) and a proposed single notation table.
4. **Proposed curriculum**: parts, chapters (about 1,500 to 3,000 words each), prerequisites, planned widget per chapter, and which problem session each chapter feeds. Mark each item `keep`, `rewrite`, `new` or `drop`.
5. **Problem-set inventory**: number of exercises per set, their type (numeric, derivation, conceptual) and which can be parametrised.
Write the audit script as `docs/audit/recompute.py` so numbers are reproducible. No site code.

## Acceptance

- `docs/AUDIT.md` has the five sections above, each non-empty.
- Every numeric answer of ps1 to ps4 and the exam is recomputed in `docs/audit/recompute.py`; running it prints OK/MISMATCH per exercise.
- Each mismatch is listed in section 2 with source line and corrected value.
- Section 4 lists at least one proposed chapter per class note and per problem set.

## Verify

```sh
python3 docs/audit/recompute.py | tail -40
grep -c '^## ' docs/AUDIT.md
```
