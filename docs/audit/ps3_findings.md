# PS3 audit: ps3_solutions.tex

Script: `python3 docs/audit/ps3.py` (117 checks, 112 OK, 5 MISMATCH, exit 0).

## 1. Mismatches

| Exercise / part | Source line | Document | Corrected | Cause |
|---|---|---|---|---|
| 7a, sd of equal-weight portfolio | ps3_solutions.tex:912 (repeated at :953) | 14.87% | 14.83% (sqrt(0.0220)=0.14832) | Square-root error. Also makes the comparison at :953 read 14.87% instead of 14.83%. |
| 7d, Sharpe of min-variance portfolio | :957 (repeated at :960, :1001) | 0.4856 | 0.4854 (0.07/0.1442 = 0.48544; exact 0.48536) | Division error. Final 7.85% in 7f is unchanged (0.03+0.4854*0.10 = 7.854%). |
| 7f, weight in min-variance portfolio | :989 | 0.6935 | 0.6934 (exact 0.693375) | 0.10/0.1442 = 0.69348, not 0.6935. Rounding slip. |
| 7f, weight in min-variance portfolio (%) | :992 | 69.35% | 69.34% | Follows from the line above. |
| 7f, weight in risk-free asset (%) | :992 | 30.65% | 30.66% | Follows from the line above. |

Minor, not listed as errors: the 6-dp intermediate terms in 1c, 2a, 2c, 7c differ from exact values by at most 6e-6. The document used 4-dp rounded weights. All final answers (sd, mean, weights) agree to the printed digits. Ex 7c var is printed 0.020799 (exact 0.020800); sd 14.42% still correct.

## 2. Inventory

7 exercises, 33 lettered parts.

| Ex | Type | Parts | Parametrisable? |
|---|---|---|---|
| 1 | numeric (a, c) + conceptual/graph (b) | 3 | Yes. Inputs: mu, sigma of two assets, rho list, rho for min-var. Closed formulas. |
| 2 | numeric (a-d) | 4 | Yes. Same two-asset formula. Vary rho so the weight falls inside or outside [0,1] to make the short-sale cases differ (the current b and d are identical to a and c, so variants should choose rho with w outside [0,1]). |
| 3 | numeric (a-c) + conceptual (d) | 4 | Yes. Inputs: mu, sigma, weights, 3x3 correlation matrix (must stay positive semi-definite). |
| 4 | numeric (a, b, d, e) + derivation (c, CAL equation) | 5 | Yes. Inputs: mu_C, sigma_C, rf, w, target sigma. |
| 5 | numeric (a, c) + conceptual/graph (b, d) | 4 | Yes. Inputs: covariances, market variance, rf, E[rM], observed returns. Classification rule is deterministic. |
| 6 | numeric (a-c) + conceptual (d) | 4 | Yes. Inputs: betas, two weight vectors summing to 1, rf, E[rM]. |
| 7 | numeric (a-d, f) + numeric/conceptual (e: compare and judge pricing) | 6 | Yes. Combines the Ex 1/4/5 formulas; inputs mu, sigma, rho, rf, E[rM], betas. |

Totals (33 parts): 24 numeric, 1 derivation (4c), 8 conceptual/graph/interpretation (1b, 3d, 5b, 5d, 6d, 7e, plus the written commentary parts 2b and 2d). All 7 exercises can take seeded numeric variants because every answer follows from closed-form formulas. Graph parts (1b, 5d) also need a plotting step.

## 3. Topics (for the lecture coverage map)

- Portfolio expected return and variance, two assets; effect of correlation on risk; diversification limits (rho = 1, -1).
- Minimum-variance portfolio of two assets, with and without short sales.
- Three-asset portfolio: covariance matrix from correlations and volatilities, portfolio variance.
- Mean-variance (Markowitz) logic and efficient-frontier idea (mentioned in 3d, not computed).
- Risk-free asset: capital allocation line (CAL), Sharpe ratio, leverage (borrowing at rf), target-risk allocation.
- CAPM: beta as Cov/Var, defensive/neutral/aggressive classification, security market line (SML), required vs observed return, over/under-pricing.
- Portfolio beta as weighted average; CAPM return of a portfolio.
- Integrated: min-variance portfolio plus risk-free asset, Sharpe ratio, CAPM valuation check.
