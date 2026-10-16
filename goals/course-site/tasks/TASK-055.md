---
id: TASK-055
title: 'Deploy check: clean-checkout build, Pages workflow, base path and content licence'
milestone: M-6
state: approved
depends_on: []
delivery: pr
---

## Why

SC-1: the site must build on a clean checkout and deploy to GitHub Pages at the public URL.

## Scope

On a fresh clone in a temporary directory run `npm ci && npm test && npm run build` and record the result. Review `.github/workflows/ci.yml` (Pages deploy job), `astro.config.mjs` (`site`, `base`) and `LICENSE`/`LICENSE-CONTENT.md`; fix only real defects (wrong base path, missing `.nojekyll` need, node version mismatch with `package.json` engines, absolute asset links). Add a short `## Despliegue` section to `README.md` with the public URL, the build commands and the Pages setting. Do not run or wait for GitHub Actions. Out of scope: making the repository public (TASK-059, owner).

## Acceptance

- Clean-clone `npm ci && npm test && npm run build` exits 0, output pasted in the PR body.
- `dist/index.html` references only `/economia-financiera/` paths (grep shows no root-absolute asset links).
- `README.md` has the `Despliegue` section.

## Verify

```sh
git clone . /tmp/clean-check && cd /tmp/clean-check && npm ci && npm test && npm run build
grep -o 'href="/[^e][^"]*"' dist/index.html | head
```
