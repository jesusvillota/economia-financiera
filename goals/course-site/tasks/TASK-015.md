---
id: TASK-015
title: Owner review of the reference slice
milestone: M-2
state: done
depends_on: [TASK-011, TASK-012, TASK-013, TASK-014]
delivery: manual
route: {platform: claude, model: sonnet, effort: high}
reason: Owner approved the reference slice on 2026-10-16 ('its good so far'); no follow-up tasks filed.
---

## Why

The vertical slice sets tone, pedagogy and structure for about 25 more chapters and 4 more sessions. The owner must approve before fan-out.

## Scope

The owner reads chapters 1 to 3 and Problem Session 1 on the deployed site or locally, in both themes and on a phone, and decides: tone, depth, widget quality, session format. Requested changes become new tasks (via `goal add`). Out of scope: any edit by an agent.

## Acceptance

- The owner has read the four pages and either approved them or filed follow-up tasks.
- No open follow-up task blocks the approval.

## Verify

Optional: `goal status course-site`.
