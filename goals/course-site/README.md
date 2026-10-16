# Economía Financiera: 3Blue1Brown-style course site

Goal `course-site` · format `goal/v2`. Live status is derived from GitHub and git and is
never written here: run `goal status course-site` or `goal tui`.

Build an interactive, Spanish-language, 3Blue1Brown-style website for the Economía Financiera course, covering lectures and problem-set sessions, modeled on options-explained.

## Context, scope and non-goals

**Today.** The course material is LaTeX: 8 class notes (`class_notes/`), 4 problem sets with solutions plus a rentas exam, TikZ figures, and third-party lecture slides L1 to L10 (not ours; not copied). They live in `~/GitHub/_Other_/Teaching/TA_Financial_Markets/`. The reference for the target is `options-explained` (Astro + MDX + KaTeX + React widgets, 73 chapters, house style guide, screenshot QA).

**In scope.** A new repo `economia-financiera` with a Spanish-language 3Blue1Brown-style site: lecture chapters (picture first, interactive widgets, quizzes) and a second track of interactive problem sessions (seeded variants, hint ladder, stepwise solutions, numeric checkers). All maths in `src/lib` with Vitest tests. The notes and problem sets are inputs, not the source of truth: notation, exercises and explanations may change, and errors found are logged in `docs/AUDIT.md`.

**Non-goals.** Copying third-party slides. Rewriting option pricing depth (link to options-explained). A backend, accounts or grading server. Video.

**Assumptions (change me).**
1. Language is Spanish only (the class is taught in Spanish).
2. Repo name `economia-financiera`, local at `~/GitHub/economia-financiera`; GitHub remote and Pages are created by the owner (TASK-001).
3. Same stack and versions as options-explained; deployed to GitHub Pages.
4. Problem sessions are a separate track (DEC-001, proposed).
5. Policy and routes are unchanged from defaults; `plan_commits: push` will start pushing once `origin` exists.

## Risks and open questions

- Copyright: slides L1 to L10 and the Netscape case are third-party; the audit reads them locally and the site must not reproduce them.
- Source errors: the notes and problem sets contain numeric mistakes (see `problem_sets/ps2/numerical_errors_report.md`); every answer is recomputed in TASK-004 and tested in the library.
- Scope unknown: fixed income and derivatives appear in ps4 and the exam but have no class note (DEC-002).
- Visual QA is manual (screenshots + owner review in TASK-015); Pages needs the owner to enable it.
- Open question: should chapters ship a printable PDF of each problem set? Not planned.
- Later milestones M-3 to M-6 hold only a `Plan: decompose` task (rolling wave).

## Plan structure

<!-- goal:graph:start -->
```mermaid
flowchart TD
  subgraph M_1["M-1 · Foundation"]
    DEC_001{{"DEC-001 Presentation model for problem sessions"}}
    DEC_002{{"DEC-002 Course scope: sessions and topics beyond the class notes"}}
    TASK_001["TASK-001 Create GitHub repo, push main, enable Pages (Actions source)"]
    TASK_002["TASK-002 Import own LaTeX sources into source/ with provenance"]
    TASK_003["TASK-003 Scaffold the Astro site from options-explained (Spanish UI)"]
    TASK_004["TASK-004 Source audit: coverage map, errors and proposed curriculum"]
    TASK_005["TASK-005 Contract: chapter and problem-session schemas"]
    TASK_006["TASK-006 Problem-session components and routes"]
    TASK_007["TASK-007 Style guide, notation table and repo CLAUDE.md"]
    TASK_008["TASK-008 Landing page and course map"]
  end
  subgraph M_2["M-2 · Reference slice (Part I + PS1)"]
    TASK_009["TASK-009 Finance maths library: time value, annuities, NPV, IRR"]
    TASK_010["TASK-010 Shared widgets: cash-flow timeline and growth curves"]
    TASK_011["TASK-011 Chapter 1: interest, simple vs compound"]
    TASK_012["TASK-012 Chapter 2: present value, annuities, perpetuities"]
    TASK_013["TASK-013 Chapter 3: NPV, IRR and investment criteria"]
    TASK_014["TASK-014 Problem Session 1 (ps1) as an interactive session"]
    TASK_015["TASK-015 Owner review of the reference slice"]
  end
  subgraph M_3["M-3 · Valuation"]
    TASK_016["TASK-016 Plan: decompose M-3"]
    TASK_020["TASK-020 M-2 follow-ups: screenshots port, contract docs, ps1 links, audit entry"]
  end
  subgraph M_4["M-4 · Markets"]
    TASK_017["TASK-017 Plan: decompose M-4"]
  end
  subgraph M_5["M-5 · Fixed income"]
    TASK_018["TASK-018 Plan: decompose M-5"]
  end
  subgraph M_6["M-6 · Polish and launch"]
    TASK_019["TASK-019 Plan: decompose M-6"]
  end
  TASK_004 --> DEC_001
  TASK_004 --> DEC_002
  TASK_001 --> TASK_002
  TASK_001 --> TASK_003
  TASK_002 --> TASK_004
  DEC_001 --> TASK_005
  TASK_003 --> TASK_005
  TASK_005 --> TASK_006
  TASK_003 --> TASK_007
  DEC_001 --> TASK_007
  DEC_002 --> TASK_007
  TASK_007 --> TASK_008
  TASK_003 --> TASK_009
  TASK_004 --> TASK_009
  TASK_007 --> TASK_010
  TASK_009 --> TASK_010
  TASK_010 --> TASK_011
  TASK_010 --> TASK_012
  TASK_010 --> TASK_013
  TASK_006 --> TASK_014
  TASK_009 --> TASK_014
  TASK_011 --> TASK_015
  TASK_012 --> TASK_015
  TASK_013 --> TASK_015
  TASK_014 --> TASK_015
  TASK_015 --> TASK_016
  TASK_016 --> TASK_017
  TASK_017 --> TASK_018
  TASK_018 --> TASK_019
  TASK_016 --> TASK_020
  classDef draft stroke-dasharray: 4 3
  classDef cancelled opacity:0.45
  classDef decision fill:#f3e8ff,stroke:#7c3aed
  class DEC_001 decision
  class DEC_002 decision
```
<!-- goal:graph:end -->

## Worker protocol

For an agent executing exactly one task of this goal:

1. Work only on your task, in your own branch and worktree, branched from `origin/main`.
2. Read `tasks/TASK-NNN.md` (the spec), the outcomes of the tasks it depends on, and the
   accepted decisions it depends on. Never edit specs, other tasks, decisions or `goal.yaml`.
3. After your first commit, open a draft PR into `main` whose body contains the line
   `Goal-Task: course-site/TASK-NNN`. Write the body with real newlines.
   Use `gh pr create --body-file FILE` or `gh pr edit --body-file FILE`.
   If the repo has several remotes, resolve `origin` with `git remote get-url origin`.
   For a GitHub origin, use `gh pr create --repo <origin OWNER/NAME> --body-file FILE`.
   Pass the same `--repo <origin OWNER/NAME>` to every other `gh pr` command.
4. Do the work and run the spec's Verify commands.
5. Write `tasks/TASK-NNN.outcome.md` with an `## Acceptance` checklist (each item followed by
   its evidence) and a `## Summary` (what, how, deviations, verified revision, proposed
   follow-ups). Commit it in the same PR.
6. Mark the PR ready for review when checks pass or none are configured.
   Failing or pending checks block delivery. Never merge.
7. Blocked by a missing decision, access or data? Explain it in the outcome, add the line
   `Goal-Blocked: <reason>` to the draft PR body, and stop. For a material decision, also
   write `## Decision request` in the outcome with the question, options and trade-offs,
   and your recommendation under `### Recommendation` (omit it if you have none). Add
   `Goal-Decision: <one-line question>` to the draft PR body, commit and push, then stop
   through exit (B). Refresh or `goal sync` creates a decision in the Inbox. Under
   `decide: experts`, the committee advises. The owner or the copilot
   accepts or rejects it, never a headless orchestrator. After acceptance,
   the Resume task action in `:` resumes the task with the decision in its resume note.
