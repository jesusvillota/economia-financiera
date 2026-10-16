---
id: TASK-001
title: Create GitHub repo, push main, enable Pages (Actions source)
milestone: M-1
state: done
depends_on: []
delivery: manual
route: {platform: claude, model: sonnet, effort: high}
reason: Created private repo jesusvillota/economia-financiera, origin set, main pushed (3e984e5), Pages source = GitHub Actions (build_type workflow).
---

## Why

Everything else needs a remote: task PRs, GitHub Pages and the deploy workflow (SC-1).

## Scope

The owner creates the GitHub repository `economia-financiera` (public or private, owner's choice), adds it as `origin` in this checkout, and pushes `main`. In Settings, Pages, the source is set to GitHub Actions. No code changes.

## Acceptance

- `git remote get-url origin` prints the GitHub URL.
- `git ls-remote origin main` shows the same commit as local `main`.
- Settings, Pages, Source reads "GitHub Actions".

## Verify

Optional for a manual task:

```sh
git remote get-url origin && git ls-remote origin main
```
