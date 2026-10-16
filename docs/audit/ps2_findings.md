# Audit of problem set ps2

Script: `python3 docs/audit/ps2.py` (exit 0; 139 checks: 117 OK, 22 MISMATCH). All lines refer to `source/problem_sets/ps2/ps2_solutions.tex`.

## 0. Status of `numerical_errors_report.md`

The report is stale or wrong. It says Ex 3(b) prints P0 = 31.00 (+5.60, 22.0%). The document already prints 30.00, +4.60, 18.1% (lines 129-131), and recomputation confirms 30.00 (30.005). It also says Ex 3(c) prints 4.96%. The document prints 5.01% (line 142). The report missed the real errors in Ex 5(c), Ex 7(c) and the appendix (below).

## 1. Mismatches (recomputed, python3)

Real errors first, then rounding-level differences (value off by more than half a unit of the last printed digit).

| Ex / part | Line | In document | Corrected | Cause |
|---|---|---|---|---|
| 5(c) PV FCFE_3 | 231 | 72.17 | 72.13 (96/1.331 = 72.126) | Arithmetic slip. |
| 5(c) Equity (total) | 243 | 1,143.44 | 1,143.39 | Follows from the 72.17 slip and from the PV of TV_3 below. Price per share 19.06 is unchanged (19.057). |
| 5(c) PV of TV_3 | 239 | 919.62 | 919.61 (1224/1.331 = 919.609) | Rounding. |
| 7(c) low WACC, PV_2' | 294 | 55.53 | 55.57 | Arithmetic slip. |
| 7(c) low WACC, PV_3' | 296 | 60.54 | 60.61 | Arithmetic slip. |
| 7(c) low WACC, PV_4' | 296 | 64.42 | 64.33 | Arithmetic slip (the document value looks swapped with the terms before it). |
| 7(c) low WACC, PV total | 309 | 3,665.13 | 3,665.14 | Follows from the PV slips (they partly cancel). |
| 7(c) low WACC, NPV' | 310 | 2,715.13 | 2,715.14 | Same. The increase becomes 1,268.85 (line 338 prints 1,268.84). |
| 7(c) high WACC, PV_2'' | 317 | 53.52 | 53.49 | Arithmetic slip. |
| 7(c) high WACC, PV_3'' | 319 | 57.33 | 57.24 | Arithmetic slip. |
| 7(c) high WACC, PV_4'' | 319 | 59.52 | 59.60 | Arithmetic slip. |
| 7(c) high WACC, PV total | 332 | 1,776.41 | 1,776.37 | Follows from the PV slips. |
| 7(c) high WACC, NPV'' | 333 | 826.41 | 826.37 | Same. The decrease becomes 619.92 (line 338 prints 619.88); 42.9% is unchanged. |
| Appendix, E[r_B] in the covariance example | 671 | 5.3% | 5.1% (0.3(.08)+0.5(.05)+0.2(.01) = 0.051) | Wrong mean. The printed covariance 0.00118 happens to match the exact covariance (0.001178), so only the stated mean is wrong. |
| 1, share of value from dividends | 69 | 18.87% (resale 81.13%) | 18.88% (81.12%) | Rounding (5.785/30.65 uses rounded inputs; exact 18.879). |
| 1, PV of D_3 | 67 | 1.871 | 1.872 | Truncated, not rounded (1.87185). |
| 3(b) increase in price | 131 | 4.60 | 4.61 (exact 30.005 - 25.396 = 4.609) | Rounding of 25.40 and 30.00 before subtracting. 18.1% is correct. |
| 3(c) PV of (D_3+P_3) at t=1 | 135 | 25.3471 | 25.3479 | Typo in the 4th decimal. P_1 = 26.67 is correct. |
| 3(c) capital gain | 142 | 5.01% | 5.02% (exact 5.019%) | Uses rounded P_0 = 25.397 and P_1 = 26.67. Total return is 10.00% exactly, so the "9.99%" on line 144 is only a rounding artefact. |
| 7(b) sum of PVs | 284 | 2,396.29 | 2,396.28 when you add the printed terms; exact total is 2,396.29 | Rounding only. NPV 1,446.29 is correct. |

Checked and correct: Ex 1 P0; Ex 2 (all); Ex 3 P0(a) = 25.40, P0(b) = 30.00, D1-D3, P3, dividend yield 4.98%; Ex 4 (FCFF = 90, FCFE = 50); Ex 5(a) Re = 10.2%, WACC = 7.52%; Ex 5(b) all PVs, TV = 3,418.14, EV = 2,871.93; Ex 5(c) price 19.06; Ex 7(a) WACC = 4.912%; Ex 7(b) all PVs, TV, NPV = 1,446.29; Ex 7(c) both terminal values, PV(TV) and the percentages; Ex 8 (all moments, covariances, rho = 0.964, betas 1.67 and 0.60); Ex 9 (all returns, mean 2.97%, s = 3.39%, annual 11.74%); appendix examples other than the E[r_B] above.

Note (not a numeric mismatch): line 338 says sensitivity grows "exponencialmente"; the effect is a convex 1/(r-g) effect, not exponential.

## 2. Inventory

Active exercises: 8 (numbered 1, 2, 3, 4, 5, 7, 8, 9; there is no Ex 6). Exercises 10-14 exist only as commented-out LaTeX in the solutions file (and 10-14 in the wordings); they are not part of the set. The numbering gap and the commented blocks are worth cleaning up.

| Ex | Parts | Type | Parametrisable? |
|---|---|---|---|
| 1 | 1 | numeric (finite-horizon DDM) | Yes. Inputs D1-D3, P3, r; closed form. |
| 2 | 2 | numeric (a includes a one-line derivation of g = r - D1/P0) | Yes. P0, D1, r, % change. |
| 3 | 3 | numeric (two-stage DDM; (c) is a verification) | Yes. D0, g1, years, g2, r. Needs r > g2. |
| 4 | 2 | numeric (FCFF, FCFE) | Yes. Any consistent set of items. |
| 5 | 3 | numeric (CAPM, WACC, FCFF DCF with terminal value, FCFE DCF, per-share price) | Yes. Keep WACC > g and r_e > g. |
| 7 | 3 | numeric (WACC, NPV); (c) is numeric plus a short comment | Yes. Same constraints; the sensitivity step is formula-driven. |
| 8 | 3 | numeric (scenario moments, covariance, beta) | Yes. Random probabilities summing to 1 and returns; avoid rho near 1 by design. |
| 9 | 2 | numeric (returns from price/dividend, sample mean, std, annualisation) | Yes. Random price paths and dividends. |

Totals: 8 exercises, 19 parts; 8 numeric, 0 pure derivation, 0 pure conceptual. Short conceptual commentary exists inside 2(b), 3(b), 3(c), 7(c). All 8 can be parametrised: each solution is a closed-form chain of arithmetic, so seeded variants with an answer computed by the same formulas are straightforward. This audit script is the basis for the answer functions. Constraints: discount rate above growth rate; probabilities sum to 1.

## 3. Topics covered (for the lecture coverage map)

- Dividend discount model: finite horizon with terminal price (Ex 1).
- Gordon growth model, implied growth, sensitivity of price to D1 (Ex 2).
- Two-stage DDM, terminal value, sensitivity to g, return decomposition into dividend yield + capital gain (Ex 3).
- FCFF and FCFE definitions and reconciliation (Ex 4).
- CAPM cost of equity, after-tax cost of debt, WACC (Ex 5, 7).
- Enterprise-value DCF with Gordon terminal value; FCFE equity valuation and per-share price (Ex 5).
- Project NPV and sensitivity of NPV to WACC (Ex 7).
- Scenario analysis: expected return, variance, standard deviation, covariance, correlation (Ex 8).
- Beta as Cov(r, r_M)/Var(r_M) (Ex 8).
- Holding-period returns with dividends; sample mean, sample standard deviation (n-1), annualisation by sqrt(12) (Ex 9).
- Appendix: formulas for moments in discrete scenarios.
- Commented-out (not active): CAPM alphas, two-asset and three-asset portfolios, minimum variance, Sharpe ratio, correlation and diversification, diversification limit.
