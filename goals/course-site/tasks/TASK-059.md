---
id: TASK-059
title: 'Owner launch: make the repository public, enable Pages, final read-through of the live site'
milestone: M-6
state: approved
depends_on: [TASK-053, TASK-054, TASK-055, TASK-058]
delivery: manual
---

## Why

SC-1: the course is only useful when students can open it at the public URL.

## Scope

Owner steps: (1) read the live site once on phone and desktop; (2) make the repository public (decide whether the committed notes under `source/` (course notes and problem sets) may be public; third-party material must not be); (3) Settings → Pages → Source: GitHub Actions; (4) open https://jesusvillota.github.io/economia-financiera/ and confirm the landing page, one chapter, one session and the exam page load. Out of scope: further content.

## Acceptance

- The owner confirms the public URL loads the landing page and one chapter, session and the exam page.
- `git ls-files source` lists only material the owner agrees to publish.

## Verify

```sh
git ls-files source | head
curl -sI https://jesusvillota.github.io/economia-financiera/ | head -1
```
