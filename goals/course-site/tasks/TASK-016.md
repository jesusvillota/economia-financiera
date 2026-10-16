---
id: TASK-016
title: 'Plan: decompose M-3'
milestone: M-3
state: approved
depends_on: [TASK-015]
delivery: manual
kind: plan
---

## Why

Rolling-wave planning: M-3 is decomposed only once M-2 evidence exists.

## Scope

Run the `goal-setup` skill at the plan root to decompose M-3 into tasks: split code from content, one chapter or one session per task, widgets before chapters that use them, one problem session per source set with its numeric tests, `Plan: decompose` for the next milestone stays. Use `docs/AUDIT.md` section 4 and the lessons from the previous milestone. Then the user marks this task done.

## Acceptance

- Every M-3 node has a filled spec and `goal check --json` has no errors.
- `goal graph` shows parallel chapter waves, no dependency chain longer than 4.

## Verify

```sh
goal check --json
goal graph
```
