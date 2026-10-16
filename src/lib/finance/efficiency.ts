import { rng } from '../problems/variant';
import { abnormalReturnTStatistic, marketModelAbnormalReturns } from './eventStudy';
import { expectedReturn, sampleMean, sampleStandardDeviation } from './risk';

/** Eficiencia de mercado y finanzas conductuales. Rentabilidades en tanto por uno. */
function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Inputs must be finite');
}
function series(values: readonly number[], minimum = 1): void {
  if (values.length < minimum) throw new RangeError(`Series needs at least ${minimum} observations`);
  finite(...values);
}

export interface PriceSimulation {
  /** Initial price P_0 > 0. */
  p0: number;
  /** Mean log return per period. */
  drift: number;
  /** Standard deviation of the shock per period. */
  sigma: number;
  steps: number;
  seed: number;
}

/** Log returns r_t = mu + phi (r_{t-1} - mu) + sigma z_t with r_0 = mu before the first step.
 * phi = 0 is a random walk; 0 < phi < 1 makes returns persist (trend). Normal shocks by Box-Muller
 * from the seeded mulberry32 stream, so the same inputs always give the same path.
 */
function simulate({ p0, drift, sigma, steps, seed }: PriceSimulation, phi: number): number[] {
  finite(p0, drift, sigma, seed, phi);
  if (p0 <= 0 || sigma < 0 || !Number.isInteger(steps) || steps < 1 || Math.abs(phi) >= 1) {
    throw new RangeError('Need p0 > 0, sigma >= 0, integer steps >= 1 and |phi| < 1');
  }
  const rand = rng(seed);
  const prices = [p0];
  let r = drift;
  for (let t = 1; t <= steps; t++) {
    const z = Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    r = drift + phi * (r - drift) + sigma * z;
    prices.push(prices[t - 1] * Math.exp(r));
  }
  return prices;
}

/** Seeded random-walk prices (steps + 1 values, starting at p0): log returns are i.i.d. */
export const randomWalkPrices = (options: PriceSimulation): number[] => simulate(options, 0);

/** Seeded trend-following prices: log returns follow an AR(1) with persistence phi in (-1, 1). */
export const trendPrices = (options: PriceSimulation & { phi: number }): number[] => simulate(options, options.phi);

/** r_t = ln(P_t / P_{t-1}). */
export function logReturns(prices: readonly number[]): number[] {
  series(prices, 2);
  if (prices.some(p => p <= 0)) throw new RangeError('Prices must be positive');
  return prices.slice(1).map((p, i) => Math.log(p / prices[i]));
}

/** Simple returns for wealth backtests; log returns must not be compounded as simple returns. */
export function simpleReturns(prices: readonly number[]): number[] {
  series(prices, 2);
  if (prices.some(p => p <= 0)) throw new RangeError('Prices must be positive');
  return prices.slice(1).map((p, i) => p / prices[i] - 1);
}

/** Sample autocorrelation at lag k: sum (r_t - m)(r_{t-k} - m) / sum (r_t - m)^2. */
export function autocorrelation(returns: readonly number[], lag = 1): number {
  series(returns, 2);
  if (!Number.isInteger(lag) || lag < 1 || lag >= returns.length) throw new RangeError('Lag must be an integer in [1, n-1]');
  const m = sampleMean(returns);
  const d = returns.map(r => r - m);
  const denominator = d.reduce((s, x) => s + x * x, 0);
  if (denominator === 0) throw new RangeError('Autocorrelation of a constant series is undefined');
  let numerator = 0;
  for (let t = lag; t < d.length; t++) numerator += d[t] * d[t - lag];
  return numerator / denominator;
}

/** VR(q) = var of overlapping q-period sums / (q var of one-period returns), both around the
 * one-period mean m (q-sums around q m). A random walk gives about 1; trends give > 1.
 */
export function varianceRatio(returns: readonly number[], q: number): number {
  series(returns, 2);
  if (!Number.isInteger(q) || q < 2 || q > returns.length) throw new RangeError('q must be an integer in [2, n]');
  const m = sampleMean(returns);
  const one = returns.reduce((s, r) => s + (r - m) ** 2, 0) / returns.length;
  if (one === 0) throw new RangeError('Variance ratio of a constant series is undefined');
  let multi = 0;
  for (let t = 0; t + q <= returns.length; t++) {
    let sum = 0;
    for (let j = t; j < t + q; j++) sum += returns[j];
    multi += (sum - q * m) ** 2;
  }
  return multi / (returns.length - q + 1) / (q * one);
}

export interface RunsTest {
  runs: number;
  positives: number;
  negatives: number;
  /** Expected runs if signs are in random order: 2 n+ n- / n + 1. */
  expected: number;
  variance: number;
  /** (runs - expected) / sqrt(variance); null when the variance is zero. Negative = trends. */
  z: number | null;
}

/** Wald-Wolfowitz runs of return signs. Zero returns are dropped before counting. */
export function runsTest(returns: readonly number[]): RunsTest {
  series(returns);
  const signs = returns.filter(r => r !== 0).map(Math.sign);
  if (!signs.length) throw new RangeError('Need at least one nonzero return');
  const runs = signs.reduce((s, x, i) => s + (i > 0 && x === signs[i - 1] ? 0 : 1), 0);
  const positives = signs.filter(x => x > 0).length;
  const negatives = signs.length - positives;
  const n = signs.length;
  const expected = (2 * positives * negatives) / n + 1;
  const variance = n > 1 ? (2 * positives * negatives * (2 * positives * negatives - n)) / (n * n * (n - 1)) : 0;
  return { runs, positives, negatives, expected, variance, z: variance > 0 ? (runs - expected) / Math.sqrt(variance) : null };
}

export interface Backtest {
  /** 1 = hold the asset during period t, 0 = cash (earning 0). */
  positions: number[];
  /** Strategy simple return in t: position * r_t less cost on every switch in or out. */
  strategyReturns: number[];
  trades: number;
  strategyWealth: number;
  buyAndHoldWealth: number;
}

/** Momentum rule on simple returns: hold in t when the sum of the previous `lookback` returns is
 * positive, otherwise cash. Starts in cash, so the first `lookback` periods are in cash.
 * Each switch costs `cost` (fraction of wealth). Buy and hold pays the cost once, in period 0.
 * Wealth starts at 1.
 */
export function momentumBacktest(returns: readonly number[], lookback = 1, cost = 0): Backtest {
  series(returns);
  finite(cost);
  if (!Number.isInteger(lookback) || lookback < 1 || lookback >= returns.length) throw new RangeError('Lookback must be an integer in [1, n-1]');
  if (cost < 0 || cost >= 1 || returns.some(r => r <= -1)) throw new RangeError('Need 0 <= cost < 1 and returns > -1');
  const positions = returns.map((_, t) => {
    if (t < lookback) return 0;
    let past = 0;
    for (let j = t - lookback; j < t; j++) past += returns[j];
    return past > 0 ? 1 : 0;
  });
  let trades = 0;
  const strategyReturns = returns.map((r, t) => {
    const switched = positions[t] !== (t ? positions[t - 1] : 0);
    if (switched) trades++;
    return positions[t] * r - (switched ? cost : 0);
  });
  const grow = (rs: readonly number[]) => rs.reduce((w, r) => w * (1 + r), 1);
  return { positions, strategyReturns, trades, strategyWealth: grow(strategyReturns),
    buyAndHoldWealth: grow(returns.map((r, t) => (t ? r : r - cost))) };
}

/** AR_t = r_t - r_benchmark,t (market model with intercept 0 and beta 1). */
export const benchmarkAbnormalReturns = (returns: readonly number[], benchmark: readonly number[]): number[] =>
  marketModelAbnormalReturns(returns, benchmark, 0, 1);

export interface ActiveAlpha {
  activeReturns: number[];
  /** Mean active return per period. */
  alpha: number;
  /** Sample standard deviation of active returns. */
  trackingError: number;
  /** alpha / (trackingError / sqrt(n)). */
  tStatistic: number;
}

/** Active-management alpha against a benchmark and its one-sample t-statistic. */
export function activeAlpha(returns: readonly number[], benchmark: readonly number[]): ActiveAlpha {
  const activeReturns = benchmarkAbnormalReturns(returns, benchmark);
  if (activeReturns.length < 2) throw new RangeError('Need at least two periods');
  return { activeReturns, alpha: sampleMean(activeReturns), trackingError: sampleStandardDeviation(activeReturns),
    tStatistic: abnormalReturnTStatistic(activeReturns) };
}

export interface ProspectParameters {
  /** Curvature for gains, 0 < alpha <= 1. */
  alpha: number;
  /** Curvature for losses, 0 < beta <= 1. */
  beta: number;
  /** Loss aversion lambda >= 1. */
  lambda: number;
  /** Probability weighting gamma in (0.28, 1]; 1 means no weighting (w is monotone above 0.28). */
  gamma: number;
}

/** Tversky and Kahneman (1992) median estimates. */
export const TK1992: ProspectParameters = { alpha: 0.88, beta: 0.88, lambda: 2.25, gamma: 0.61 };

function checkParameters({ alpha, beta, lambda, gamma }: ProspectParameters): void {
  finite(alpha, beta, lambda, gamma);
  if (alpha <= 0 || alpha > 1 || beta <= 0 || beta > 1 || lambda < 1 || gamma <= 0.28 || gamma > 1) {
    throw new RangeError('Need 0 < alpha, beta <= 1, lambda >= 1 and 0.28 < gamma <= 1');
  }
}

/** v(x) = x^alpha for gains, -lambda (-x)^beta for losses; x is a change from the reference point. */
export function prospectValue(x: number, p: ProspectParameters = TK1992): number {
  finite(x);
  checkParameters(p);
  return x >= 0 ? x ** p.alpha : -p.lambda * (-x) ** p.beta;
}

/** w(p) = p^g / (p^g + (1 - p)^g)^(1/g): overweights small and underweights large probabilities. */
export function probabilityWeight(probability: number, p: ProspectParameters = TK1992): number {
  finite(probability);
  checkParameters(p);
  if (probability < 0 || probability > 1) throw new RangeError('Probability must be in [0, 1]');
  const g = p.gamma;
  return probability ** g / (probability ** g + (1 - probability) ** g) ** (1 / g);
}

/** E[X] = sum p_i x_i (probabilities must sum to 1). */
export const gambleExpectedValue = (outcomes: readonly number[], probabilities: readonly number[]): number =>
  expectedReturn(outcomes, probabilities);

/** Prospect value V = sum w(p_i) v(x_i), weighting each outcome separately (Kahneman and Tversky
 * 1979 form with the 1992 functional forms). ponytail: not cumulative (rank-dependent) weighting.
 */
export function gambleProspectValue(outcomes: readonly number[], probabilities: readonly number[], p: ProspectParameters = TK1992): number {
  gambleExpectedValue(outcomes, probabilities); // same alignment and probability checks
  return outcomes.reduce((s, x, i) => s + probabilityWeight(probabilities[i], p) * prospectValue(x, p), 0);
}
