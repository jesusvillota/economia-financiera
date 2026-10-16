# Source audit: coverage, errors, notation and proposed curriculum

Result: the notes and problem sets are mostly sound. We recomputed **414 checks** and found **65 differences** (`python3 docs/audit/recompute.py`). The material errors are in ps1 Ex 4/6/8, ps2 Ex 5c/7c, ps3 Ex 7, ps4 Ex 9c/10b (section 2). The rest are rounding. The old `numerical_errors_report.md` is itself wrong. Fixed income, forwards, futures and options have no class note.

How to reproduce: `python3 docs/audit/recompute.py`. It prints `OK` or `MISMATCH` per check. Per-set detail and extra tables: `docs/audit/ps{2,3,4}_findings.md`.
Slides L1 to L10 were read locally for topics only. Nothing from them is copied here.

## 1. Coverage map

Lecture topics come from the slide titles. Note numbers are the folders in `source/class_notes/`.

| Lecture | Topic | Class note section(s) | Problem set | Gap |
|---|---|---|---|---|
| L1 | Time value of money, simple/compound interest, annuities, perpetuities | 01 §2 to §3 | ps1 Ex 1 to 6; exam (rentas) | None |
| L2 | Project appraisal: NPV, IRR, payback | 01 §4 | ps1 Ex 7 to 10 | None |
| L3 | Valuation of shares and firms (DDM, FCFF/FCFE, WACC); return and risk of one asset and of a portfolio; diversification | 02 §1 to §3 and appendix | ps2 Ex 1 to 9 | None. Notes 02 and 03 overlap on portfolio risk |
| L4 | Two-asset portfolios, Markowitz model, minimum variance, efficient frontier | 03 §2 to §3; 06 | ps3 Ex 1 to 3 | Note 06 duplicates 03 |
| L5 | CAL, tangent portfolio, separation theorem, CAPM start | 03 §4 to §6; 06 §6 to §7; 07 §2 to §3 | ps3 Ex 4 | Three notes repeat the same material |
| L6 | CML, SML, beta, extensions (event studies, Fama-French, Carhart, APT); IPOs | 03 §6, §9; 07 §4 to §8; 04 (IPOs) | ps3 Ex 5 to 7; ps4 Ex 4 (CAR) | Netscape case has no note; IPO has no exercise |
| L7 | Market microstructure: orders, margin, short sales, venues, OTC | 05 | ps4 Ex 1 to 3 | Slide exercise series 7 is not in a problem set |
| L8 | Market efficiency and behavioural finance | 08 | ps4 Ex 4 (event study) | No exercise on behavioural topics |
| L9 | Fixed income: bonds, YTM, duration, term structure (ETTI), credit risk | none | ps4 Ex 6, 8, 9 | **No note** |
| L10 | Derivatives and structured products: forwards, futures, options | 05 §OTC (mention only) | ps4 Ex 10 | **No note.** Futures: no exercise either |

Topics with no note: bond pricing and YTM, duration, forward rates and the term structure, forwards (pricing, value), futures (margining), option payoffs, structured products.
Topics in notes with no lecture: none found. Note 04 and the Netscape case belong to the IPO session (L6 second half).
Duplicates: `class_notes/main.tex` is almost identical to note 01 (36 differing lines). Note 06 and 07 repeat sections of 03. `source/` should treat 03 as the merged version and 06/07 as splits.

## 2. Errors and inconsistencies

Method: every numeric answer was recomputed in Python (`docs/audit/ps1.py` to `ps4.py`). Tolerance is half a unit of the last printed digit (one unit for numbers marked "aprox."). Line numbers refer to the `*_solutions.tex` file of each set.

**The existing `ps2/numerical_errors_report.md` is wrong.** It reports P0 = 31.00 in Ex 3(b); the file already says 30.00 (line 129). It reports 4.96% in Ex 3(c); the file says 5.01%. It misses the errors below in Ex 5, Ex 7 and the appendix.

### Note 01: growing annuity

`source/class_notes/01_fundamentos_basicos/01_fundamentos_basicos.tex:464` reports **7.710 €** for ten growing payments. With first payment 1.000 € at year 1, growth 5 % and discount rate 10 %, the correct present value is **7.439,81 €**: `1000 * (1 - (1.05 / 1.10) ** 10) / (0.10 - 0.05)`. The source overstates the value by 270,19 €. Chapter 2 uses the corrected value. Regression test: `tests/annuities.test.ts`, “growing annuity 1.000 €, g = 5 %, r = 10 %, n = 10 (the source says 7.710: wrong)”, checks `growingAnnuityPV(1000, 0.1, 0.05, 10)` against `7439.81` to two decimals.

### Note 02: incomplete FCFE example

`source/class_notes/02_valoracion_activos/02_valoracion_activos.tex:255–275` asks for year-2 FCFE but supplies neither net income nor interest. EBIT 140, tax 25 %, depreciation 32, capex 60 and working-capital increase 8 determine FCFF = 69. Net borrowing is −2. FCFE is therefore `67 - interest * 0.75`, not a unique number. For interest 0 or 20, FCFE is 67 or 52. Do not silently assume zero interest. Chapter 5 supplies both interest and net income in its original example. Regression test: `tests/capitulo5.test.ts`, “source note FCFE example is underdetermined”.

### Note 02: infinite-horizon dividend valuation

`source/class_notes/02_valoracion_activos/02_valoracion_activos.tex:90` claims that a positive discount rate alone makes the discounted resale price tend to zero. This also requires a restriction on the future price: `P_N / (1+r)^N → 0`. A counterexample is `P_N = 50(1.10)^N` at `r = 10 %`: its discounted value stays at 50, even as N grows. Chapter 4 states the limit as an additional assumption before replacing finite-horizon valuation with the infinite dividend sum. Regression test: `tests/capitulo4.test.ts`, “audit note 02 §1.1”, checks the counterexample with `dividendPrice` at four horizons and verifies that a Gordon-consistent discounted tail shrinks when `r > g`.

### Note 03: beta does not rank total volatility

`source/class_notes/03_teoria_carteras/03_teoria_carteras.tex:1007` says beta below 1 implies lower total volatility than the market. This fails when specific risk is large (also repeated in the portfolio interpretation at line 1133). With market variance 0.04, asset beta 0.6 and asset variance 0.09, systematic variance is 0.0144 and residual variance is 0.0756. Asset volatility is 30 %, above the market’s 20 %, despite beta below 1. Beta measures linear market sensitivity, not a ranking of total volatility. Chapter 10 uses this distinction. Regression test: `tests/capitulo10.test.ts`, “audit note 03: low beta can coexist with higher total volatility”.

### ps1 (20 differences; Ex 4 and Ex 6 are wrong, Ex 8 PRD is wrong)

| Ex / part | Line | In document | Corrected | Note |
|---|---|---|---|---|
| 4a, annuity PV | 147 | 29,269 | **27,674** | Material. 5,000 x 5.5348 |
| 4b, growing annuity PV | 148 | 31,885 | **30,354** | Material |
| 4c, tranche 1 | 150 | 12,674 | **12,657** | Material (small) |
| 4c, V at t=3 | 152 | 21,351 | **20,546** | Material |
| 4c, tranche 2 at t=0 | 153 | 16,466 | **15,865** | Material |
| 4c, total | 154 | 29,140 | **28,522** | Material |
| 6a, monthly annuity PV | 194 | 55,612 | **48,083** | Material |
| 6b, growing annuity PV | 195 | 16,756 | **14,989** | Material |
| 6c, total | 196 | 72,368 | **63,073** | Material |
| 6d, annuity-due PV | 198 | 56,013 | **48,430** | Material |
| 8b, cumulative discounted CF | 228 | 69.55; 94.20; 112.95 | **73.55; 111.12; 148.69** | Material |
| 8b, PRD | 228 | 3.46 years | **3.24 years** | Follows from the line above (2 + (120-73.55)/37.57) |
| 5c, PV of deferred perpetuity | 172 (also 173) | 31,318 | **31,309** | Small |
| 2b, i_6 | 84 | 1.2913% | **1.2909%** | Digit slip |
| 2b, i_3 | 86 | 2.5981% | **2.5986%** | Digit slip |
| 2d ii, PV | 94 | 9,165 | **9,163** | Rounding of the 18-month factor |
| 3c, alt. B amount | 130 | 119,500 | **119,509** | Document rounds 1.02^9 to 1.195 |
| 7, VAN | 213 | 28,684 | **28,685** | Terms truncated, not rounded |

Exam (rentas): option (b) is correct. A brute-force sum of 20,000 growing payments matches it; option (a) does not.

### ps2 (22 differences; the real ones are in Ex 5c, Ex 7c and the appendix)

| Ex / part | Line | In document | Corrected |
|---|---|---|---|
| 5c, PV FCFE_3 | 231 | 72.17 | **72.13** |
| 5c, equity total | 243 | 1,143.44 | **1,143.39** (price per share 19.06 stays) |
| 7c low WACC, PV_2', PV_3', PV_4' | 294, 296 | 55.53; 60.54; 64.42 | **55.57; 60.61; 64.33** |
| 7c low WACC, NPV' | 310 | 2,715.13 | 2,715.14 |
| 7c high WACC, PV_2'', PV_3'', PV_4'' | 317, 319 | 53.52; 57.33; 59.52 | **53.49; 57.24; 59.60** |
| 7c high WACC, NPV'' | 333 | 826.41 | 826.37 (decrease 619.92, not 619.88) |
| Appendix, E[r_B] | 671 | 5.3% | **5.1%** |
| Rounding only (Ex 1, 3b, 3c, 5c TV, 7b) | 67, 69, 131, 135, 142, 239, 284 | see `ps2_findings.md` | e.g. 3b increase 4.61 |

Line 338 calls the sensitivity "exponencial"; it is a convex 1/(r-g) effect.
Exercises 10 to 14 exist only as commented-out LaTeX; there is no Ex 6.

### ps3 (5 differences, all in Ex 7)

| Ex / part | Line | In document | Corrected |
|---|---|---|---|
| 7a, sd equal-weight portfolio | 912, 953 | 14.87% | **14.83%** |
| 7d, Sharpe ratio | 957, 960, 1001 | 0.4856 | **0.4854** |
| 7f, min-variance weight | 989 | 0.6935 | 0.6934 |
| 7f, weights in % | 992 | 69.35% / 30.65% | 69.34% / 30.66% |

Ex 2 parts (b) and (d) give the same numbers as (a) and (c) because the weight is inside [0,1]. The "short sales" case is not exercised.

### ps4 (18 differences; Ex 9c and Ex 10b matter)

| Ex / part | Line | In document | Corrected |
|---|---|---|---|
| 10b, discount factor / forward value | 629, 632 | 0.9426; F = 4.76 | **0.9429; F = 4.74** |
| 9c, average sale price | 492 | 99.01% | **98.99%** |
| 9c, sale per bond; sale + accrued | 494, 509 | 990.14; 1,014.31 | **989.86; 1,014.03** |
| 9c, constants in the quadratic | 534, 539, 549 | 1,014.17 and 1,014.31 mixed | one value, 1,014.03 |
| 9c, discriminant | 551 | 4,154,507.78 | **4,153,483** (with 1,014.03) |
| 9c, TIR | 576, 579 | 8.24% | **8.14%** |
| 9b, YTM statement | 480 | "algo inferior al 14,5%" | **14.76%** |
| 8b, f_{2,1} | 369 to 371, 385 to 389 | 5.00% | **5.01%** |
| 6a, price | 214, 321 | 980.18; 1,028.72 | 980.19; **1,028.73** |
| 6b, TIR_A | 224 to 226 | 3.976% | 3.975% |
| LaTeX bug | 579 | `<TAB>extbf{Conclusión:}` | `\textbf{Conclusión:}` |

Ex 9a: clean cost 354,060 uses the rounded price 101.16%; unrounded gives 354,050.
Numbers 5 and 7 are missing. Futures are not covered although the section title says so.

### Other inconsistencies

- Notes 03, 06 and 07 give the same derivations three times (same subsection titles). Pick one source per chapter.
- Note 02 (portfolio return and risk) and note 03 §2 overlap.
- Notation clashes: see section 3.

## 3. Notation inventory

Counts are occurrences in `class_notes/*.tex`.

| Concept | Symbols used (notes) | Clash or issue | Proposed symbol |
|---|---|---|---|
| Interest / discount rate | `i` (01), `r` (02, 03, 07), `i_k`, `i_{12}` | `i` also used as asset index | `r` for rate; `r_k` for the k-times-a-year rate; asset index `j` |
| Risk-free rate | `r_f` (01, 02, 03, 06, 07), `R_f` (03, 07, 08) | Two cases | `r_f` |
| Market return | `r_M` (02, 03, 07), `R_M` (03, 07), `R_m` (08), `r_m` (02) | Four spellings | `r_M` |
| Asset return | `r_i` (02, 03, 07), `R_i` (03, 06, 07, 08), `R_e` (02, cost of equity) | `R_e` also means cost of equity | return `r_i`; cost of equity `k_e`; cost of debt `k_d` |
| Portfolio return | `r_p` (02, 03, 07), `R_p` (03, 06, 07, 08) | Two cases | `r_p` |
| Weights | `w_i` (02, 03, 06, 07), `x_i` (02, 03, 06) | Same thing, two letters | `w_i` |
| Growth rate | `g` (02, 05) and growth of payments in 01 | `g` also used for the growth of annuities in ps1 | `g` |
| Expectation | `\E[...]` (02, 03, 06, 07), `E(R)` (08) | Brackets differ | `\E[\cdot]` |
| Variance | `\V(...)`, `\mathrm{Var}`, `\sigma^2` | Three forms | `\sigma^2`, with `\mathrm{Var}` only in definitions |
| Covariance | `\Cov`, `Cov(` | Two forms | `\mathrm{Cov}` |
| Capital and cash flow | `C_0`, `C_t` (01 capital), `CF_t` (01 project), `FCF*` (02), `A` (annuity, 01, ps1) | `C` is capital, `CF` is cash flow, `A` is payment | `C_t` for cash flows; `A` for a constant payment |
| Present value | `V_0` (01), `P_0` (02 price) | Value vs price | `V_0` for annuities, `P_0` for share price |
| NPV / IRR | VAN, TIR (Spanish, 01) vs NPV/IRR in lecture slides and options-explained | Language | VAN, TIR (Spanish site); symbol `\text{VAN}`, `r^*` for TIR |
| Beta | `\beta` (02, 03, 07, 08) | None | `\beta_i` |
| Correlation | `\rho` (02, 03, 06, 07) | None | `\rho_{ij}` |
| Mean of a sample | `\bar{r}` (02), `\mu` (03) | Sample vs population | `\bar{r}` sample; `\mu` population |

Note: the preamble defines macros `\E`, `\V`, `\Cov`; the problem sets do not use them.

## 4. Proposed curriculum

Rule from DEC-001 (accepted): problem sessions are a separate track; chapters carry only short quizzes. Four sessions (ps1 to ps4) and one final-exam page with mixed exercises (the rentas exercise goes there).
Length target: 1,500 to 3,000 words per chapter. Status: `keep` (use the note content), `rewrite` (same topic, new structure), `new` (no source note), `drop`.

### Part I. Value of money over time (note 01, L1/L2)

| # | Chapter | Status | Prereq | Planned widget | Feeds |
|---|---|---|---|---|---|
| 1 | Interest: simple vs compound; fractional rates | rewrite (note 01 §2) | none | Growth-curve compare simple vs compound; slider for k per year | ps1 Ex 1 to 3 |
| 2 | Present value, annuities, perpetuities | rewrite (note 01 §3) | 1 | Cash-flow timeline with draggable payments | ps1 Ex 4 to 6; exam |
| 3 | NPV, IRR and other criteria | rewrite (note 01 §4) | 2 | NPV-vs-rate curve with IRR marker | ps1 Ex 7 to 10 |

### Part II. Valuing shares and firms (note 02, L3)

| # | Chapter | Status | Prereq | Planned widget | Feeds |
|---|---|---|---|---|---|
| 4 | Valuing a share: dividend discount model | keep (note 02 §1.1) | 2 | Price vs g and r surface | ps2 Ex 1 to 3 |
| 5 | Valuing a firm: FCFF, FCFE, WACC | keep (note 02 §1.2) | 4 | DCF bar builder | ps2 Ex 4, 5, 7 |
| 6 | Return and risk of one asset (moments appendix merged here) | keep (note 02 §2) | 4 | Scenario table with live E, sigma | ps2 Ex 8, 9 |

### Part III. Portfolios and CAPM (notes 03, 06, 07, L4/L5/L6)

| # | Chapter | Status | Prereq | Planned widget | Feeds |
|---|---|---|---|---|---|
| 7 | Two assets: correlation and diversification | keep (note 03 §2; note 06 dropped as duplicate) | 6 | Frontier with rho slider | ps3 Ex 1, 2 |
| 8 | Markowitz: many assets, minimum variance, efficient frontier | rewrite (note 03 §3) | 7 | 3-asset weight explorer | ps3 Ex 3 |
| 9 | Risk-free asset: CAL, tangent portfolio, separation | rewrite (note 03 §4 to §5) | 8 | CAL with draggable portfolio | ps3 Ex 4 |
| 10 | CAPM: CML, SML and beta | rewrite (note 03 §6; note 07 §3 to §6 dropped as duplicate) | 9 | SML with mispriced assets | ps3 Ex 5 to 7 |
| 11 | Beyond CAPM: event studies, Fama-French, Carhart, APT | keep (note 07 §7, note 03 §9) | 10 | Event-window CAR plot | ps4 Ex 4 |

### Part IV. Markets (notes 04, 05, 08, L6/L7/L8)

| # | Chapter | Status | Prereq | Planned widget | Feeds |
|---|---|---|---|---|---|
| 12 | Market structure: venues, participants, OTC | keep (note 05 §2, §4, §5) | none | Venue classification sorter | Quiz only |
| 13 | Trading: orders, margin, short sales, costs | rewrite (note 05 §3) | 12 | Order-book simulator; margin account | ps4 Ex 1 to 3 |
| 14 | Initial public offerings (incl. Netscape-style valuation discussion) | keep (note 04) | 5 | Book-building price chooser | Quiz; final-exam page |
| 15 | Market efficiency | keep (note 08 §2 to §3) | 11 | Random-walk vs trend demo | Quiz only |
| 16 | Behavioural finance | keep (note 08 §4) | 15 | Bias examples quiz | Quiz only |

### Part V. Fixed income and derivatives (no notes; L9, L10, ps4)

| # | Chapter | Status | Prereq | Planned widget | Feeds |
|---|---|---|---|---|---|
| 17 | Bonds: price, yield to maturity, accrued coupon | new | 2 | Price-yield curve | ps4 Ex 6, 9 |
| 18 | Term structure and forward rates | new | 17 | Spot-to-forward curve builder | ps4 Ex 8 |
| 19 | Duration and interest-rate risk | new | 17 | Duration slider on a bond | ps4 Ex 6 |
| 20 | Forwards and futures | new (futures: no exercise exists) | 18 | Payoff and value of a forward | ps4 Ex 10 |
| 21 | Options: payoffs and strategies (link to options-explained for pricing) | new | 20 | Payoff diagram with strategy picker | ps4 Ex 10 |

### Problem-session track (DEC-001)

| Session | Source | Status | Chapters it uses |
|---|---|---|---|
| PS1 | ps1 (10 exercises) | rewrite (fix Ex 4, 6, 8) | 1 to 3 |
| PS2 | ps2 (8 exercises) | rewrite (fix Ex 5c, 7c) | 4 to 6 |
| PS3 | ps3 (7 exercises) | rewrite (fix Ex 7; add a short-sale variant for Ex 2) | 7 to 10 |
| PS4 | ps4 (8 exercises) | rewrite (fix Ex 9c, 10b; add a futures exercise) | 11, 13, 17 to 21 |
| Final-exam page | exam rentas + chosen exercises of graded difficulty | new | 2, 3, 17 |

Dropped: `class_notes/main.tex` (duplicate of 01), note 06 (duplicate of 03), note 07 §2 and §3 repeats, commented-out ps2 Ex 10 to 14, `numerical_errors_report.md` (wrong).
Open question for DEC-002: scope of Part V (21 chapters total; Part V is 5 of them).

## 5. Problem-set inventory

| Set | Exercises | Parts | Numeric | Derivation | Conceptual / graph | Parametrisable |
|---|---|---|---|---|---|---|
| ps1 | 10 (Ex 1 to 10) | 30 | 28 | 1 (9a, quadratic) | 1 (10d, decision) | All 10 |
| ps2 | 8 (1 to 5, 7 to 9) | 19 | 19 | 0 | 0 (comments inside 2b, 3b, 3c, 7c) | All 8 |
| ps3 | 7 (1 to 7) | 33 | 24 | 1 (4c) | 8 | All 7 (1b, 5d need a plot) |
| ps4 | 8 (1 to 4, 6, 8, 9, 10) | 31 | 29 | 1 (9b) | 1 (8e) | 7 fully; Ex 9 partly (date schedule) |
| exam (rentas) | 1 (multiple choice a/b/c) | 1 | 0 | 1 (symbolic) | 0 | Yes: vary periodicities, check option by brute-force sum |

Parametrisation rules found: need r > g for growing annuities and DDM; probabilities sum to 1; correlation matrices must be positive semi-definite; Ex 2 of ps3 needs a correlation whose minimum-variance weight is outside [0,1]; Ex 6 of ps4 uses a quadratic YTM that works for 2 years only.
