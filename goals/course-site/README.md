# Economía Financiera: 3Blue1Brown-style course site

Goal `course-site` · format `goal/v2`. Live status is derived from GitHub and git and is
never written here: run `goal status course-site` or `goal tui`.

Build an interactive, Spanish-language, 3Blue1Brown-style website for the Economía Financiera course, covering lectures and problem-set sessions, modeled on options-explained.

## Context, scope and non-goals

<what exists today, what is included, what is explicitly out of scope>

## Risks and open questions

<risks, assumptions, and unknowns; material unknowns become discovery tasks or DEC nodes>

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
  end
  subgraph M_2["M-2 · Reference slice (Part I + PS1)"]
  end
  subgraph M_3["M-3 · Valuation"]
  end
  subgraph M_4["M-4 · Markets"]
  end
  subgraph M_5["M-5 · Fixed income"]
  end
  subgraph M_6["M-6 · Polish and launch"]
  end
  TASK_004 --> DEC_001
  TASK_004 --> DEC_002
  TASK_001 --> TASK_002
  TASK_001 --> TASK_003
  TASK_002 --> TASK_004
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
