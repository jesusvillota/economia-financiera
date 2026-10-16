/** PS2: tasas y retornos en %, varianzas/covarianzas en tanto por uno al cuadrado.
 * Flujos corporativos y valores totales en millones de euros; precio por acción en euros.
 */
import { dividendPrice, impliedGrowth, gordonPrice, dividendSchedule, multiStageDDM, fcff, fcfe, wacc, terminalValue, discountedCashFlow, pricePerShare } from './finance/valuation.ts';
import { expectedReturn, scenarioVariance, scenarioStandardDeviation, covariance, correlation, holdingPeriodReturn, sampleMean, sampleStandardDeviation, annualizedVolatility } from './finance/risk.ts';
const p = (x: number) => x / 100;

export const finitePrice = (d1: number, d2: number, d3: number, sale: number, r: number) => dividendPrice([d1, d2, d3], p(r), sale);
export const dividendShare = (d1: number, d2: number, d3: number, sale: number, r: number) => 100 * dividendPrice([d1, d2, d3], p(r)) / finitePrice(d1, d2, d3, sale, r);
export const resaleShare = (d1: number, d2: number, d3: number, sale: number, r: number) => 100 - dividendShare(d1, d2, d3, sale, r);
export const growth = (price: number, d1: number, r: number) => 100 * impliedGrowth(price, d1, p(r));
export const revisedPrice = (price: number, d1: number, r: number, change: number) => gordonPrice(d1 * (1 + p(change)), p(r), impliedGrowth(price, d1, p(r)));
export const revisedChange = (price: number, d1: number, r: number, change: number) => 100 * (revisedPrice(price, d1, r, change) / price - 1);
export const twoStagePrice = (d0: number, g1: number, n: number, g2: number, r: number) => multiStageDDM(d0, [{ growth: p(g1), periods: n }], p(r), p(g2));
export const twoStageTerminal = (d0: number, g1: number, n: number, g2: number, r: number) => terminalValue(dividendSchedule(d0, [{ growth: p(g1), periods: n }]).at(-1)!, p(r), p(g2));
export const twoStageYearOne = (d0: number, g1: number, n: number, g2: number, r: number) => twoStagePrice(d0, g1, n, g2, r) * (1 + p(r)) - d0 * (1 + p(g1));
export const dividendYield = (d0: number, g1: number, n: number, g2: number, r: number) => 100 * d0 * (1 + p(g1)) / twoStagePrice(d0, g1, n, g2, r);
export const capitalGain = (d0: number, g1: number, n: number, g2: number, r: number) => 100 * holdingPeriodReturn(twoStagePrice(d0, g1, n, g2, r), twoStageYearOne(d0, g1, n, g2, r));
export const totalReturn = (d0: number, g1: number, n: number, g2: number, r: number) => 100 * holdingPeriodReturn(twoStagePrice(d0, g1, n, g2, r), twoStageYearOne(d0, g1, n, g2, r), d0 * (1 + p(g1)));
export const firmFlow = (ebit: number, tax: number, dep: number, capex: number, wc: number) => fcff(ebit, p(tax), dep, capex, wc);
export const equityFlow = (income: number, dep: number, capex: number, wc: number, debt: number) => fcfe(income, dep, capex, wc, debt);
/** CAPM se da como ecuación en el enunciado; no introduce una API nueva en finance. */
export const equityCost = (rf: number, beta: number, premium: number) => rf + beta * premium;
export const capitalCost = (equity: number, debt: number, rf: number, beta: number, premium: number, kd: number, tax: number) => 100 * wacc(equity, debt, p(equityCost(rf, beta, premium)), p(kd), p(tax));
export const firmValue = (c1: number, c2: number, c3: number, c4: number, c5: number, r: number, g: number) => discountedCashFlow([c1, c2, c3, c4, c5], p(r), terminalValue(c5, p(r), p(g)));
export const firmTerminal = (c5: number, r: number, g: number) => terminalValue(c5, p(r), p(g));
export const equityValue = (c1: number, c2: number, c3: number, r: number, g: number) => discountedCashFlow([c1, c2, c3], p(r), terminalValue(c3, p(r), p(g)));
export const equityPrice = (c1: number, c2: number, c3: number, r: number, g: number, shares: number) => pricePerShare(equityValue(c1, c2, c3, r, g), shares);
export const flowPV = (flow: number, r: number, t: number) => discountedCashFlow(Array.from({ length: t }, (_, i) => i === t - 1 ? flow : 0), p(r));
export const projectNPV = (c1: number, c2: number, c3: number, c4: number, investment: number, equity: number, debt: number, rf: number, beta: number, premium: number, kd: number, tax: number, g: number, shift: number) => {
  const r = p(capitalCost(equity, debt, rf, beta, premium, kd, tax) + shift);
  return discountedCashFlow([c1, c2, c3, c4], r, terminalValue(c4, r, p(g))) - investment;
};
const probs = (p1: number, p2: number) => [p1, p2, 1 - p1 - p2];
export const mean = (a: number, b: number, c: number, p1: number, p2: number) => 100 * expectedReturn([a, b, c].map(p), probs(p1, p2));
export const variance = (a: number, b: number, c: number, p1: number, p2: number) => scenarioVariance([a, b, c].map(p), probs(p1, p2));
export const deviation = (a: number, b: number, c: number, p1: number, p2: number) => 100 * scenarioStandardDeviation([a, b, c].map(p), probs(p1, p2));
export const cov = (a: number, b: number, c: number, x: number, y: number, z: number, p1: number, p2: number) => covariance([a, b, c].map(p), [x, y, z].map(p), probs(p1, p2));
export const corr = (a: number, b: number, c: number, x: number, y: number, z: number, p1: number, p2: number) => correlation([a, b, c].map(p), [x, y, z].map(p), probs(p1, p2));
export const beta = (a: number, b: number, c: number, x: number, y: number, z: number, p1: number, p2: number) => cov(a, b, c, x, y, z, p1, p2) / variance(x, y, z, p1, p2);
export const periodReturn = (start: number, end: number, dividend: number) => 100 * holdingPeriodReturn(start, end, dividend);
const historical = (prices: number[], firstDividend: number, lastDividend: number) => prices.slice(1).map((price, i) => holdingPeriodReturn(prices[i], price, i < 4 ? firstDividend : lastDividend));
export const historicalMean = (p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, d: number, dl: number) => 100 * sampleMean(historical([p0, p1, p2, p3, p4, p5, p6], d, dl));
export const historicalDeviation = (p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, d: number, dl: number) => 100 * sampleStandardDeviation(historical([p0, p1, p2, p3, p4, p5, p6], d, dl));
export const historicalAnnual = (p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, d: number, dl: number) => annualizedVolatility(historicalDeviation(p0, p1, p2, p3, p4, p5, p6, d, dl), 12);
