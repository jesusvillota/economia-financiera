# TASK-050 outcome

## Acceptance

- [x] **1. `npm test` passes.** This session passed **43 files and 1,515 tests**, exit 0. `tests/sesion04.test.ts` contributes **147 tests** covering all 12 exercises and 65 answers. Each answer is checked against its frontmatter value and independent arithmetic, then over 20 reproducible random seeds. The seven chapter template tests now expect the PS4 link. Additional assertions cover rounded percentage submissions, variable-maturity YTM roots, margin equality and all requested audit corrections, including the Ex 9c discriminant. The full suite was repeated after the last test assertion; it again passed 1,515 tests.
- [x] **2. Build, session route and reciprocal links pass.** `npm run build` exited 0: **155 files checked, zero errors/warnings/hints, 29 static pages**. `/economia-financiera/sesiones/04-mercados-bonos-derivados/` returned HTTP 200. The browser script verifies continuous exercise numbering and all seven session links to chapters 11, 13 and 17–21, then visits each chapter and checks its link back. Frontmatter tests independently verify the same relationships.
- [x] **3. `npm run screenshots sesiones` is clean.** Exit 0: **24 passing captures**, covering the index, PS1–PS4 and the upstream exam page, dark/light × desktop/phone. No console errors, KaTeX errors or horizontal overflow. Visually inspected all four PS4 captures through header and exercise crops in this session. Images stay in the ignored `screenshots/` directory.
- [x] **4. `node scripts/clickthrough-sesion04.mjs` passes.** Exit 0 in dark/light themes at **360 px**. Reveals all three hints, rejects a wrong answer, accepts all seven correct answers in exercise 1, checks saved progress after reload, rerolls parameters, verifies reset and a recomputed answer. Reveals every hint and solution in all 12 exercises, checks resolved placeholders and mathematical rendering, checks overflow, then verifies all seven reciprocal chapter links. No browser errors.
- [x] **5. Every source exercise is mapped.** The map below and the PR body cover all eight existing source exercises and all 31 subparts. No source exercise is dropped. The absent numbers 5 and 7 are explained; display numbers run continuously from 1 to 12. The last exercise is a new daily futures-margin ledger.

All four Verify commands ran sequentially with `set -e`; the combined process exited **0**:

```sh
npm test
npm run build
npm run screenshots sesiones
node scripts/clickthrough-sesion04.mjs
```

Tail evidence from this session:

```text
Test Files  43 passed (43)
     Tests  1515 passed (1515)
Result (155 files): 0 errors, 0 warnings, 0 hints
[build] 29 page(s) built in 2.44s
[build] Complete!
✓ sesiones_04-mercados-bonos-derivados-dark-desktop.png
✓ sesiones_04-mercados-bonos-derivados-dark-phone.png
✓ sesiones_04-mercados-bonos-derivados-light-desktop.png
✓ sesiones_04-mercados-bonos-derivados-light-phone.png
✓ sesiones_examen-final-dark-desktop.png
✓ sesiones_examen-final-dark-phone.png
✓ sesiones_examen-final-light-desktop.png
✓ sesiones_examen-final-light-phone.png
✓ dark 360px: 3 hints, wrong answer, 7 correct answers, saved progress, seeded variant; all 12 solutions and 7 reciprocal chapter links clean
✓ light 360px: 3 hints, wrong answer, 7 correct answers, saved progress, seeded variant; all 12 solutions and 7 reciprocal chapter links clean
```

## Exercise map

| Source | Session exercise | Coverage |
| --- | --- | --- |
| 1a–d | 1 (`ej1`) | Initial/final capital and margins, maintenance call, capital and price returns. |
| 2a–d | 2 (`ej2`) | Short proceeds, initial deposit, dividend compensation, maintenance and return. |
| 3a–d | 3 (`ej3`) | Spread, best-level mean depth, both order sizes, total and implicit costs. |
| 4a–c | 4 (`ej4`) | Three normal returns, three abnormal returns, CAR and sign interpretation. |
| 6a–c | 5 (`ej6`) | Both theoretical prices, corrected final-payment PV, purchase YTMs, both durations. |
| 6d | 6 (`ej6_curva`) | Exact new spot and both repriced bonds; source-rounded comparison retained in tests. |
| 8a–e | 7 (`ej8`) | Three numeric forwards; borrower comparison and upward-curve explanation in the solution. Future spots remain unknown. |
| 9a–b | 8 (`ej9_compra`) | Weighted clean execution, accrued coupon, dirty outlay, irregular-payment YTM equation and numerical root. |
| 9c | 9 (`ej9_venta`) | Correct sale quote, sale plus accrued coupon, intermediate coupon and annual holding IRR. |
| 10a–b | 10 (`ej10_forward`) | New delivery quote, discount factor and existing-contract value using 1.5 years remaining. |
| 10c–d | 11 (`ej10_opciones`) | Three call profits and joint call/put profit. |
| None | 12 (`futuros`) | New three-day futures exercise: daily variation, top-up, balance and total gain. |
| 5, 7 | None | Absent in the source. No exercise was dropped; display numbering removes the gaps. |

## Summary

Added the Spanish PS4 session, scalar adapters over the existing finance library, independent numerical tests and a browser acceptance script. Reused the existing exercise UI, hint ladder, solution reveal, checker and progress storage. Added only the required `sessions:` link in seven chapter files and updated their expectations. Appended an audit clarification. No finance-core changes, new widgets, task-spec edits, other task edits, decision edits or goal-configuration edits.

All exercises offer reproducible parameter variants, three hints and multiple solution steps. Two-year source bond problems extend to two through five years using the existing root finder. Their variant curve explicitly interpolates annual spots; the repricing exercise explicitly chains annual forwards. Corporate coupons keep the stipulated month fractions and distinguish them from Actual/Actual day counts. Fixed calculation selectors are not exposed as learner inputs. Percentage answers accept rounding to two decimals.

The delivered solutions fix the malformed source `extbf` fragment using plain text and remove numbering gaps. Raw source imports remain unchanged as provenance. No material decision was needed. Full-precision calculations explain two audited rounding differences: Ex 6d keeps the exact implied spot, and Ex 9c gives 8.15% with exact execution cash flows. Explicit regressions reproduce the audit's 8.14% using its source-rounded purchase outlay, and its 1014.03 € by summing separately rounded components. The exercise uses the exact total, which rounds to 1014.02 €. `docs/AUDIT.md` records those conventions.

Verified content/library revision: `b51980e`; this final commit adds the separately verified discriminant assertion and this outcome. Rebased this branch onto `origin/main` without conflicts, including the upstream final-exam page. Local verification above includes that page. Existing Node experimental-type-stripping and KaTeX euro-font metric notices do not affect the successful checks.

Delivery PR: https://github.com/jesusvillota/economia-financiera/pull/44 into `main`, branch `goal/course-site/task-050`, marker `Goal-Task: course-site/TASK-050`, label `goal:course-site`. Local verification is the acceptance gate. GitHub Actions and the PR build check were not inspected, under the explicit owner override returned by `goal rules`. The PR is marked ready after pushing this outcome. Never merge. No proposed follow-up is needed.
