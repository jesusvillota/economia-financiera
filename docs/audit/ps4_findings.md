# Audit of ps4 (source/problem_sets/ps4/ps4_solutions.tex)

Script: `python3 docs/audit/ps4.py` (exit 0). 89 checks. Lines tagged MISMATCH below come from that run.
Tolerance: 0.006 for 2-dp values, half a unit of the last printed digit otherwise.

## 1. Mismatches

Substantive errors (change the answer):

| Ex/part | Line | In document | Corrected | Cause |
|---|---|---|---|---|
| 10 b | 629 | (1.04)^-1.5 = 0.9426; PV(K) = 45.24; F = 4.76 | 0.9429; 45.26; **4.74** | Discount factor miscomputed (0.94287 is correct). Also lines 632 (4.76, 45.24). |
| 9 c | 492 | avg sale price 99.01% | **98.99%** (34,645,000/350,000 = 98.9857) | Wrong division. Line 579 "perdida 2,15%" only holds with 98.99. |
| 9 c | 494 | 990.14 EUR per bond | **989.86** | Follows from the 98.99 price (and 990.14 does not match 99.01 either). |
| 9 c | 509 (also 507-509 flows) | sale + accrued = 1,014.31 | **1,014.03** (989.86 + 24.17) | Follows from the sale price. |
| 9 c | 534, 539, 549 | constant 1,014.17 in the quadratic | 1,014.31 in text, 1,014.03 corrected | Inconsistent constant: 1,014.17 vs 1,014.31 (lines 509, 521, 544 use .31). |
| 9 c | 551 | discriminant 4,154,507.78 (also "1,314,06" typo) | 4,154,629.5 with 1,014.31; 4,154,056.2 with 1,014.17; 4,153,483.0 with the corrected 1,014.03 | Arithmetic does not match either constant; 36.25^2 = 1,314.06 printed as "1,314,06". |
| 9 c | 576, 579 | TIR = 8.24% | **8.14%** with corrected sale price (8.23% even with the document's own flows) | Propagation of the sale-price error; 8.2347% with printed flows rounds to 8.23. |
| 9 b | 480 | "TIR cercana pero algo inferior al 14,5%" | YTM = **14.76%** (effective annual) | Claim is false: solving the 12-flow equation gives 14.76%; quarterly 14.5% nominal is already 15.3% effective. |
| 8 b | 369-371 | f_{2,1} = 1.0500 = 5.00% | 1.050073 = **5.01%** | Rounding to 2 dp (1.124864/1.071225). Cascades to 8 d (385-389) "5,00%": 5.01%. Conclusion unchanged. |

Rounding only (conclusions unchanged):

| Ex/part | Line | In document | Corrected | Cause |
|---|---|---|---|---|
| 6 a | 214 | 980.18; P_B = 1,028.72 | 980.19; **1,028.73** | 1050/1.071225 = 980.186; sum of rounded parts. Also repeated at 321 (1,028.72). |
| 6 b | 224-226 | sqrt(1.081081) = 1.03976; TIR_A = 3.976% | 1.03975; **3.975%** | 5th-digit rounding. |
| 9 c | 554 | sqrt(Delta) = 2,038.26 | 2,038.29 | Follows from the discriminant error. |
| 9 a | 443 | 354,060 clean cost | 354,050 using the unrounded 101.157% | Uses the rounded 101.16. Total 358,288 is consistent with the rounded price. Not flagged by the script. |

Non-numeric LaTeX bug (not a mismatch): line 579 starts with a TAB then `extbf{Conclusión:}`; the `\t` of `\textbf` was turned into a tab, so the text compiles wrong. Fix: restore `\textbf{`.

All other numbers match: Ex1 (all), Ex2 (all), Ex3 (all), Ex4 (all), Ex6 b (Bond B TIR 3.17%, D_B 1.953), 6 c, 6 d (4.0%, 924.56, 1,019.09), 8 a/c, Ex9 a (101.16%, 12.08, 358,288), Ex9 b outlay 1,023.68, Ex10 a/c/d.

## 2. Inventory

Exercise numbers present: 1, 2, 3, 4, 6, 8, 9, 10 (5 and 7 do not exist). 8 exercises, 31 parts.

| Ex | Topic | Type | Parts | Parametrisable? |
|---|---|---|---|---|
| 1 | Margin purchase, margin call | numeric | 4 | Yes: shares, price, loan, rate, new price, maintenance %. Closed-form. |
| 2 | Short sale, dividend, margin call | numeric | 4 | Yes: same style; parameters shares, price, margin %, dividend, new price. |
| 3 | Limit order book, transaction cost | numeric | 4 | Yes: random book levels and order sizes; walk the book. |
| 4 | CAPM, abnormal return, CAR | numeric | 3 | Yes: beta, market returns, observed returns. |
| 6 | Zero vs coupon bond: price, YTM, Macaulay duration, new curve | numeric (b has a short comment) | 4 | Yes: spots, coupon, purchase prices. Quadratic YTM works for 2 years only; keep maturity 2. |
| 8 | Spot curve to forwards (f11, f21, f12) | numeric (a-d), conceptual (e) | 5 | Yes (a-d): random increasing curve; e stays fixed text. d is a numeric comparison with a verbal judgement. |
| 9 | Order book bond (AirBaltic), accrued coupon, YTM | numeric (a, c), derivation (b) | 3 | Partly: a and c are parametrisable (books, dates, coupon). b is an equation set-up; it can be auto-checked by solving numerically, but the date schedule needs care. |
| 10 | Forward valuation, call/put payoffs | numeric | 4 | Yes: S0, r, K, premiums, scenarios, T and elapsed time. |

Counts by part: numeric 29, derivation 1 (9 b), conceptual 1 (8 e). By exercise: 5 purely numeric (1, 2, 3, 4, 10), 3 mixed (6, 8, 9), 0 purely conceptual or derivation. 7 of 8 exercises are fully parametrisable for seeded numeric variants; Ex 9 is partly parametrisable.

## 3. Topics covered (for the lecture map)

- Market microstructure: margin purchase and margin calls (1), short sales with dividends (2), limit order book, bid-ask spread, market-order execution, implicit transaction cost (3), corporate bond order book and accrued coupon (9).
- Market efficiency and event studies: CAPM expected return, abnormal return, CAR (4).
- Fixed income: spot-curve pricing, zero-coupon and coupon bonds, YTM, Macaulay duration, effect of a curve shift (6); bond YTM with irregular first period and sale before maturity (9).
- Forwards: implied forward rates from the spot curve (8); forward price by no arbitrage and value of an existing forward (10).
- Options: call and put payoffs and profit, straddle (10).
- Futures: not covered (no exercise uses futures or margining of futures despite the section title "forwards, futures y opciones").
