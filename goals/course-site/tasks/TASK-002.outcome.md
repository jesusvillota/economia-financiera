## Acceptance

- [x] `source/class_notes/` has the 8 session `.tex` files plus `main.tex` and `preamble.tex`. Evidence: `find source -type f | sort` lists `01_` to `08_*.tex`, `main.tex`, `preamble.tex`.
- [x] `source/problem_sets/` has ps1 to ps4 and exam `.tex` files and the PS2 errors report. Evidence: ps1..ps4 `.tex`, `exam/exam_rentas_solutions.tex`, `ps2/numerical_errors_report.md`.
- [x] No forbidden extension in `source/`. Evidence: the `find ... -name '*.pdf' -o ...` command printed nothing.
- [x] `source/README.md` records provenance and the exclusion of third-party slides. Evidence: `grep -i provenance source/README.md` printed `## Provenance`, exit 0.

## Summary

Copied 43 files (.tex, PS2 report, `.agent/*.md`) plus `source/README.md` from `TA_Financial_Markets` at commit `0e20f2c8e30e801d62b7e731948fc1e4edad2169` (source repo had only an unrelated dirty `temp.ipynb`). Added build-artifact patterns for `source/` to `.gitignore`.

Deviations: also excluded `problem_sets/ps2/others/`, `comparison_report.md` files, `gemini_solution.md` and `trendspotting_images/` (not listed in scope). Class note 08 may reference the trendspotting images, so it will not compile standalone; TASK-004 can request them if needed.

Verified revision: this branch head.
