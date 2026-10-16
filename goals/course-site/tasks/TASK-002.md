---
id: TASK-002
title: Import own LaTeX sources into source/ with provenance
milestone: M-1
state: approved
depends_on: [TASK-001]
delivery: pr
route: {platform: claude, model: sonnet, effort: high}
---

## Why

SC-5 and every later task: workers run in clean worktrees and see only this repo, so the course's own LaTeX sources must live here (contract first).

## Scope

Copy the author's own LaTeX sources from `~/GitHub/_Other_/Teaching/TA_Financial_Markets/` (local machine only) into `source/`:

- `class_notes/NN_*/NN_*.tex`, `class_notes/main.tex`, `class_notes/preamble.tex`
- `problem_sets/ps1..ps4/*.tex`, `problem_sets/exam/*.tex`, `problem_sets/ps2/numerical_errors_report.md`
- `tikz/*.tex`, `.agent/*.md` (the old generation prompts, as history)

Keep the directory layout. Do NOT copy build artifacts (`.aux .log .fls .fdb_latexmk .synctex.gz .toc`), compiled PDFs, `.venv`, `lecture_notes/` (third-party slides, copyright of their authors), `OCR/` (derived from those slides) or `problem_sets/archive/`. Add `source/README.md` stating provenance (origin repo, copy date, commit hash of the source repo), that these files are inputs and not the source of truth, and that third-party slides are intentionally excluded. Add `source/` build artifact patterns to `.gitignore`. No site code in this task.

## Acceptance

- `source/class_notes/` has the 8 session `.tex` files plus `main.tex` and `preamble.tex`.
- `source/problem_sets/` has ps1 to ps4 and exam `.tex` files and the PS2 errors report.
- No file in `source/` has the extension `.pdf .aux .log .fls .fdb_latexmk .synctex.gz .toc .xls .pptx`.
- `source/README.md` records provenance and the exclusion of third-party slides.

## Verify

```sh
find source -type f | sort
find source -type f \( -name '*.pdf' -o -name '*.aux' -o -name '*.log' -o -name '*.fls' -o -name '*.fdb_latexmk' -o -name '*.synctex.gz' -o -name '*.toc' -o -name '*.xls' -o -name '*.pptx' \)  # must print nothing
test -f source/README.md && grep -i provenance source/README.md
```
