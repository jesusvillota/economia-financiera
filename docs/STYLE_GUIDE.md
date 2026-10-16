# Guía de estilo / Style guide

House style for every chapter and problem session of the course. Written in English for the authors; all course text is Spanish. Adapted from options-explained. Decisions: DEC-001 (problem sessions are a separate track), DEC-002 (new chapters on fixed income and basic derivatives, written from scratch). The notation comes from `docs/AUDIT.md` section 3.

## Voice

- **Spanish, tuteo.** Write to one reader as "tú". Keep sentences short (about 20 words). One idea per section.
- **Picture first, then the formula.** Show the shape before the algebra. A formula summarises what the reader has already seen.
- **Start from a question the reader has.** Example: "¿Qué prefieres: 100 € hoy o 105 € dentro de un año?"
- **Honest simplifications.** Simplify, never say false things. Say it when you simplify ("ignoramos impuestos hasta el capítulo 9").
- **Explain a term the first time it appears** and link the chapter that introduced it. Use the Spanish term of the course (VAN, TIR, tipo de interés); give the English one once in parentheses if students meet it in the slides.
- **Do not skip steps in derivations.** Pure algebra may go in a `<details>` block, but it must be there.
- **Numbers.** In prose: decimal comma and euro after a non-breaking space: `1,5 %`, `1.250,50 €` (thin dot for thousands from 5 digits: `12.500 €`, `1250 €`). In math: `1{,}5\,\%`, `1{.}250{,}50\,€`; always put `{,}` around a decimal comma so KaTeX does not add a space. The euro sign is a unit, so no `\$` escaping is needed. Percent: space before `%`.
- **Rigour grows gradually.** Parts I-II use arithmetic; later parts bring in probability and linear algebra. Always give a plain reading next to a formula.
- Do not copy the third-party lecture slides or the Netscape case. Write your own examples.

## Chapter template

One MDX file per chapter in `src/content/chapters/NN-slug.mdx`, sections in this order. Each `##` heading starts with a Spanish `section-tag` span.

| # | Section | `section-tag` | Purpose |
|---|---|---|---|
| 1 | Hook | `Gancho` | A concrete question or surprising fact. 1-3 paragraphs. |
| 2 | Intuition | `Intuición` | The picture, interactive if possible. Little notation. |
| 3 | Formalisation | `Formalización` | The TeX, colour-coded to match the picture. Derivations go here. |
| 4 | Playground | `Zona de juego` | A free widget, ending with 1-2 "Prueba esto" prompts. |
| 5 | Check yourself | `Compruébalo` | 2-3 short `<Quiz>` questions, each with an explanation. |
| 6 | Recap & next up | `Resumen` | 3-5 bullets and a one-line teaser. |

```mdx
## <span class="section-tag">Gancho</span>Dinero que crece solo
```

Frontmatter (schema in `src/content.config.ts`):

```yaml
---
title: "Interés simple y compuesto"
part: 1
chapter: 1
difficulty: 1          # 1 intro, 2 intermediate, 3 advanced
prerequisites: []
summary: "Cómo crece el dinero cuando los intereses cobran intereses."
---
```

Length: 1.500-3.000 words. Longer: split. Chapters carry only short quizzes; long practice lives in problem sessions.

## Problem-session template

Per DEC-001, problem sessions are a separate track ("Sesiones de problemas"): four sessions (ps1-ps4) and one final-exam preparation page with mixed exercises of graded difficulty. The exact schema and routes come from TASK-005 and TASK-006; this section fixes the voice and structure.

- **One exercise = statement, parameters, hint ladder, stepwise solution, numeric checker.**
- **Statement:** realistic, short, in Spanish, with the numbers as seeded parameters. Each visit can show a new seeded variant; the default seed shows the numbers of the original problem set.
- **Hint ladder:** 3 levels. Level 1 names the concept ("¿Qué fórmula de renta aplica?"). Level 2 sets up the equation. Level 3 gives the first numeric step. Never give the final answer in a hint.
- **Stepwise solution:** each step has a sentence of reasoning and the formula with numbers. Same notation as the chapters. Reveal one step at a time.
- **Checker:** numeric answer with a stated tolerance (state units: `€`, `%`, years). Every answer must be computed in `src/lib` and tested by Vitest for the default seed.
- **Link back:** each exercise links to the chapters it uses, and the chapters link to the exercises.
- **Voice:** same as chapters (tuteo, short sentences), but more direct: say what to compute, no storytelling beyond two sentences.
- If the source problem set has an error (see `docs/AUDIT.md` section 2), use the corrected numbers.

## Notation

Use these symbols everywhere. New symbol? Add it here in the same PR. Rows with a macro are defined in `src/lib/katexMacros.ts` (tested in `tests/compound.test.ts`).

| Concept | Symbol | Macro | Note |
|---|---|---|---|
| Interest / discount rate | $r$ | `\Rate{r}` | `r_k`: rate compounded k times a year |
| Risk-free rate | $r_f$ | `\rf` | Never `R_f` |
| Market return | $r_M$ | `\rM` | Never `R_M`, `R_m`, `r_m` |
| Asset return | $r_j$ | | Asset index is `j`, never `i` (`i` is not used for rates either) |
| Portfolio return | $r_p$ | | |
| Cost of equity / debt | $k_e$, $k_d$ | `\ke`, `\kd` | Never `R_e` |
| Weights | $w_j$ | | Never `x_j` |
| Risky fund / tangent fund | $c$, $T$ | | Returns $r_c$, $r_T$ and volatilities $\sigma_c$, $\sigma_T$ |
| Risky fund / risk-free allocation | $w_c$, $w_f$ | | $w_f=1-w_c$; these allocate wealth between a fund and cash |
| Fund Sharpe ratio / risk-free volatility | $S_c$, $\sigma_f$ | | $S_c=(\E[r_c]-r_f)/\sigma_c$ for positive volatility; $\sigma_f=0$ |
| Asset count / second asset index | $n$, $k$ | | In portfolio sums, indices are `j`, `k`; `n` counts assets |
| Covariance matrix / entry | $\Sigma$, $\Sigma_{jk}$ | | Entry is $\Cov(r_j,r_k)$; diagonal is $\sigma_j^2$ |
| Target expected portfolio return | $m$ | | Constraint $\E[r_p]=m$ in Markowitz optimisation |
| Expected dividend per share at t | $D_t$ | | $D_0$ just paid; $D_1$ next payment |
| Share price after the dividend at t | $P_t$ | | $P_N$ continuation or resale price at horizon $N$ |
| Projection horizon | $N$ | | Years of explicit dividends before continuation value |
| Geometric-series ratio | $q$ | | In DDM: $(1+g)/(1+r)$ |
| Geometric-series sum | $S$ | | In the Gordon derivation only |
| Growth rate | $g$ | | Also for growing annuities |
| Present value | $\VA$, $V_0$ | `\VA` | `V_0` for annuities; `P_0` for a share price |
| Future value | $\VF$ | `\VF` | |
| Net present value | $\VAN$ | `\VAN` | Spanish, not NPV |
| Internal rate of return | $\TIR$, $r^*$ | `\TIR`, `\rstar` | `\rstar` is the number, `\TIR` the name |
| Cash flow at t | $C_t$ | | Not `CF_t`. Constant payment: $A$ |
| Expectation | $\E[\cdot]$ | `\E` | Square brackets, not `E(R)` |
| Variance | $\sigma^2$ | `\Var` | Write `\Var` only in definitions |
| Covariance | $\Cov(\cdot,\cdot)$ | `\Cov` | |
| Proposed expected return / Jensen alpha | $\widehat r_j$, $\alpha_j$ | | Forecast input / forecast less CAPM required return |
| Market allocation / perturbation | $w_M$, $h$ | | Market weight / small debt-financed position in the SML derivation |
| Market-model residual / residual variance | $\varepsilon_j$, $\sigma_{\varepsilon_j}^2$ | | Mean zero and uncorrelated with the market |
| Beta | $\beta_j$ | | |
| Market-model intercept / residual / normal prediction | $a_j$, $\varepsilon_{j,t}$, $\widehat r_{j,t}$ | | Raw daily returns in chapter 11; hats mark estimated parameters |
| Abnormal / cumulative abnormal return | $\mathrm{AR}_{j,t}$, $\mathrm{CAR}_j[T_a,T_b]$ | | Inclusive event window; sum ARs without compounding |
| Event-window endpoints | $T_a$, $T_b$ | | Relative trading days; announcement at $t=0$ |
| Factor-model alpha / exposures | $\alpha_j$, $\beta_{j,M}$, $\beta_{j,S}$, $\beta_{j,H}$, $\beta_{j,U}$ | | Excess-return intercept; market, SMB, HML, UMD slopes |
| Factor returns | $\mathrm{SMB}_t$, $\mathrm{HML}_t$, $\mathrm{UMD}_t$ | | Small minus big, high minus low book-to-market, winners minus losers |
| APT exposure / premium / factor count | $b_{j,k}$, $\lambda_k$, $K$ | | Factor index $k$; premium is an expectation, not a realised factor return |
| Portfolio standard deviation | $\sigma_p$ | | Square root of portfolio variance $\sigma_p^2$ |
| Correlation | $\rho_{jk}$ | | |
| Sample mean / population mean | $\bar r$, $\mu$ | | |
| Asset price / dividend | $P_{j,t}$, $D_{j,t}$ | | Asset `j`, date `t`; initial price is $P_{j,t-1}$ |
| Scenario / scenario count / probability | $s$, $S$, $p_s$ | | $r_{j,s}$ is the return of asset `j` in scenario `s` |
| Population / sample standard deviation | $\sigma_j$, $s_j$ | | Sample variance $s_j^2$ uses $n-1$ for $n$ observations |
| Affine scale / shift | $a$, $b$ | | Constants in $a r_j+b$; shift is in return units |
| Operating value / excess cash | $V_{\mathrm{op}}$, $X$ | | Operations exclude excess cash and its income |
| Equity / debt market value | $E$, $D$ | | Financing weights $w_E$, $w_D$; $\Delta D$ is borrowing less principal repayments |
| Corporate tax rate / interest | $T_c$, $I_t$ | | Interest expense during period t |
| Free cash flow: firm / equity | $\mathrm{FCFF}_t$, $\mathrm{FCFE}_t$ | | Discount at WACC / $k_e$ respectively |
| Operating / net income | $\mathrm{EBIT}_t$, $\mathrm{BN}_t$ | | Before interest and taxes / after both |
| Depreciation / capital expenditure | $\mathrm{Dep}_t$, $\mathrm{Capex}_t$ | | Dep is a noncash accounting expense |
| Operating working capital change | $\Delta\mathrm{WC}_t$ | | Excludes cash and financial debt |
| Weighted average cost of capital | $\mathrm{WACC}$ | | After corporate tax adjustment on debt only |
| Terminal value / explicit horizon | $\mathrm{VT}_N$, $N$ | | Value at N of flows from N+1 onward |
| Share price / number of shares | $P_0$, $n_{\mathrm{acc}}$ | | Equity value divided by shares |
| Behavioural change / subjective value | $x$, $x_s$, $v(x)$, $V$ | | Euro change from a fixed reference / dimensionless subjective score; $V=\sum_s w(p_s)v(x_s)$ |
| Prospect curvature / loss aversion | $\alpha$, $\beta$, $\lambda$ | | Chapter 16: $0<\alpha,\beta\leq1$, $\lambda\geq1$; not CAPM alpha or beta, nor an APT premium |
| Probability weight / curvature | $w(p)$, $\gamma$ | | Decision weight, not a portfolio weight; $\gamma=1$ gives $w(p)=p$; chapter 16 optionally uses $0{,}61$ |
| Monetary gamble / expected payoff | $X$, $\E[X]$ | | Random euro change; scenario probabilities $p_s$ sum to one |
| Executed shares / fill size and price / average execution | $n_{\mathrm{ej}}$, $q_k$, $p_k$, $\overline P$ | | Chapter 13: level index $k$; weighted average over executed shares only |
| Execution reference / implicit cost | $P_{\mathrm{ref}}$, $K_{\mathrm{imp}}$ | | Positive for buying above or selling below the stated reference |
| Margin account capital / margin ratio / maintenance | $E$, $E_0$, $m$, $m_{\mathrm{mant}}$ | | Chapter 13: account capital, not company equity; $m$ is not a target portfolio return here |
| Account shares / final debt / own-capital return | $n$, $D$, $r_E$ | | Chapter 13: fixed share count; debt includes period interest |
| Short account assets / call threshold prices | $A_{\mathrm{corto}}$, $P^*_{\mathrm{compra}}$, $P^*_{\mathrm{corto}}$ | | Assets after dividend compensation; strict inequality triggers a call |
| IPO offer shares / offer price / first-day close | $n_{\mathrm{of}}$, $P_{\mathrm{of}}$, $P_c$ | | Offer size differs from total company shares; close is not fundamental value |
| IPO limit request / demand | $p_j$, $q_j$, $Q(p)$ | | Incremental requests; accumulate limits at or above the offer price |
| IPO gross / fee / net | $G$, $F$, $N_{\mathrm{OPI}}$, $f$ | | Net after proportional placement fee only |
| IPO initial return / money left | $u$, $M$ | | Close relative to offer; both may be negative |
| Log return / sample mean | $\ell_t$, $\bar\ell$ | | $\ell_t=\ln(P_t/P_{t-1})$; use simple returns $r_t$ for wealth |
| Log-return persistence / shock | $\phi$, $z_t$, $\sigma$ | | AR(1) persistence; independent standard-normal shocks; shock standard deviation |
| Lag-one sample autocorrelation / variance ratio | $\widehat\rho_1$, $\mathrm{VR}(q)$ | | $q$ sessions per overlapping window; daily returns in chapter 15 |
| Momentum position / switching cost | $w_t$, $c$ | | Position is zero or one; cost deducted from return on each switch |
| Bond face / annual coupon rate / coupon payment | $F$, $c$, $A$ | | Chapter 17: $A=Fc/m$; face repaid at maturity; $c$ is not a fund here |
| Bond maturity / payments per year / period count | $T$, $m$, $n$ | | Chapter 17: $n=mT$ at a coupon boundary; $T$ is not a tangent fund here |
| Yield to maturity | $y$ | `\Rate{y}` | Annual effective for annual payments; nominal annual compounded $m$ times when explicitly stated |
| Clean / dirty bond price / accrued coupon | $P_{\mathrm{limpio}}$, $P_{\mathrm{sucio}}$, $CC$ | | Euros; dirty equals clean plus accrued; no ex-coupon period in chapter 17 |
| Days elapsed / days in coupon period | $d$, $D$ | | Chapter 17 Actual/Actual coupon-period day counts; $D$ is not corporate debt here |

Conventions: time `t` in years; rates annual effective unless the text says otherwise; default example 1.000 € at 5 % for 10 years.

## Colours

Each quantity keeps its colour in plots, TeX and prose. Tokens live in `src/styles/theme.css` (dark default, light via `data-theme="light"`). Use the CSS variables, never hex.

| Quantity | Token | Dark | Light |
|---|---|---|---|
| Present value, price, spot | `--c-pv` | `#58c4dd` | `#1f7fa3` |
| Future value | `--c-fv` | `#f4d345` | `#a8860b` |
| Return, gain | `--c-return` | `#83c167` | `#3e7f2a` |
| Risk, loss | `--c-risk` | `#fc6255` | `#c0392b` |
| Time | `--c-time` | `#5cd0b3` | `#1e8c72` |
| Rate (r, TIR, k) | `--c-rate` | `#ff862f` | `#c25e12` |

In TeX use the macros (`\VA`, `\VF`, `\VAN`, `\TIR`, `\Rate{}`, `\rf`...), never raw `\color`. Colour a term only where it helps match formula to plot. Colour is never the only cue: pair gains/losses with a sign or word.

## Widgets

- Build on `PlotFrame` and `WidgetFrame`; controls from `src/components/ui/controls.tsx` (`Slider`, `Segmented`, `Button`, `Select`); `useTweened` for morphs. Hydrate with `client:visible`.
- **Widgets compute, they do not hard-code.** All maths comes from `src/lib`, unit-tested. Never re-implement a formula in a component.
- Label axes with units, show the value next to each slider, start at the default example.
- Seed all randomness and offer a re-roll button. Respect `prefers-reduced-motion`.
- Keyboard-usable, `aria-label` on each figure, touch targets of 44 px, works at 360 px width (controls below the plot).
- A short "Prueba esto" prompt after each widget.
- Literal euro sign needs no escaping. A literal `$` in MDX prose is written `\$`; never inside math.
- Reuse shared widgets before writing new ones.

## Checklist

Before opening the PR for a chapter or session:

1. `npm test && npm run build` pass.
2. `npm run screenshots` runs clean (no console error, no KaTeX error, no overflow); look at the images, both themes, desktop and phone.
3. Click through every new widget (`npm run clickthrough` shows how) and check readouts.
4. Frontmatter matches the schema; sections in template order with Spanish `section-tag`s.
5. Notation matches this guide; new symbols added to the table; colours via macros.
6. Numbers: decimal comma, euro format, tests in `src/lib` for every number in the text.
7. Re-read the Voice section against your prose.
8. One commit per chapter (or session), message `chapter NN: <title>`; touch only files that chapter needs.
