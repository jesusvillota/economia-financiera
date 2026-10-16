---
id: TASK-018
title: 'Plan: decompose M-5'
milestone: M-5
state: done
depends_on: [TASK-037, TASK-038, TASK-039, TASK-040, TASK-041]
delivery: manual
kind: plan
route: {platform: claude, model: sonnet, effort: high}
reason: M-5 decomposed into TASK-042..048, 050, 051 with filled specs; goal check ok.
---

## Why

Rolling-wave planning: M-5 is decomposed only once M-4 evidence exists.

## Scope

Run the `goal-setup` skill at the plan root to decompose M-5 into tasks: split code from content, one chapter or one session per task, widgets before chapters that use them, one problem session per source set with its numeric tests, `Plan: decompose` for the next milestone stays. Use `docs/AUDIT.md` section 4 and the lessons from the previous milestone. Then the user marks this task done.

## Acceptance

- Every M-5 node has a filled spec and `goal check --json` has no errors.
- `goal graph` shows parallel chapter waves, no dependency chain longer than 4.

## Verify

```sh
goal check --json
goal graph
```
