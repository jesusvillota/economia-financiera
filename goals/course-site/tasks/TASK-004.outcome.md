## Acceptance

- [x] `docs/AUDIT.md` has the five sections, each non-empty. Evidence: `grep -c '^## ' docs/AUDIT.md` prints 5 (Coverage map, Errors, Notation, Curriculum, Inventory).
- [x] Every numeric answer of ps1 to ps4 and the exam is recomputed in `docs/audit/recompute.py`. Evidence: it runs 414 checks and prints OK/MISMATCH per check (ps1+exam 49 OK/20 MISMATCH, ps2 117/22, ps3 112/5, ps4 71/18).
- [x] Each mismatch is listed in section 2 with source line and corrected value. Evidence: tables per set in `docs/AUDIT.md` section 2; rounding-only items grouped, with detail in `docs/audit/ps{2,3,4}_findings.md`.
- [x] Section 4 lists at least one proposed chapter per class note and per problem set. Evidence: 21 chapters; notes 01 to 08 map to chapters 1 to 16; PS1 to PS4 plus a final-exam page in the problem-session table.

## Summary

What: `docs/AUDIT.md`, `docs/audit/{common,ps1,ps2,ps3,ps4,recompute}.py`, and per-set findings files.
How: ps2 to ps4 were recomputed by three subagents, ps1, exam, coverage, notation and curriculum by the main agent. Slides L1 to L10 were read locally for topic titles only. Nothing was copied.
Deviations: the OCR folder was not read (slide PDFs were enough for topics). The Netscape case was only read at question level.
Key findings: `numerical_errors_report.md` is wrong (the P0 = 31.00 error it reports is not in the file). Real errors: ps1 Ex 4, 6, 8 (PRD); ps2 Ex 5c, 7c, appendix; ps3 Ex 7; ps4 Ex 9c, 10b, 9b text. Notes 06/07 duplicate 03, `main.tex` duplicates 01. Fixed income, forwards, futures, options have no note.
Verified revision: see PR head commit.
Follow-ups: fix the source errors in the site library tests (TASK-009); DEC-002 on Part V scope; add a futures exercise.
