---
id: TASK-019
title: 'Plan: decompose M-6'
milestone: M-6
state: done
depends_on: [TASK-050, TASK-051]
delivery: manual
kind: plan
route: {platform: claude, model: sonnet, effort: high}
reason: 'M-6 planned: 8 tasks (glossary, search, a11y, SEO chain; link QA, audit trace, deploy check; owner launch)'
---

## Why

Rolling-wave planning: M-6 is decomposed only once M-5 evidence exists.

## Scope

Run the `goal-setup` skill at the plan root to decompose M-6 into tasks: split code from content, one chapter or one session per task, widgets before chapters that use them, one problem session per source set with its numeric tests, `Plan: decompose` for the next milestone stays. Use `docs/AUDIT.md` section 4 and the lessons from the previous milestone. Then the user marks this task done.

## Acceptance

- Every M-6 node has a filled spec and `goal check --json` has no errors.
- `goal graph` shows parallel chapter waves, no dependency chain longer than 4.

## Verify

```sh
goal check --json
goal graph
```
