import { assertPositiveSemidefinite, solveLinear, type Matrix } from './matrix';

/** Returns and volatilities use decimals, e.g. 0.12 means 12%. Negative weights permit short sales. */
export interface PortfolioPoint {
  weights: number[];
  expectedReturn: number;
  variance: number;
  sigma: number;
}
export interface FrontierPoint extends PortfolioPoint {
  branch: 'efficient' | 'inefficient';
}
const EPS = 1e-10;
const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
const dot = (xs: readonly number[], ys: readonly number[]) => sum(xs.map((x, i) => x * ys[i]));

function finiteVector(xs: readonly number[]): void {
  if (!xs.length || xs.some(x => !Number.isFinite(x))) throw new RangeError('Vector must be nonempty and finite');
}
function checkWeights(weights: readonly number[], n: number): void {
  finiteVector(weights);
  if (weights.length !== n || Math.abs(sum(weights) - 1) > EPS) throw new RangeError('Weights must match assets and sum to 1');
}
function checkAssets(returns: readonly number[], covariance: Matrix): void {
  finiteVector(returns);
  assertPositiveSemidefinite(covariance);
  if (returns.length !== covariance.length) throw new RangeError('Asset dimensions must match');
}
function checkTwo(s1: number, s2: number, rho: number): void {
  if (![s1, s2, rho].every(Number.isFinite) || s1 < 0 || s2 < 0 || Math.abs(rho) > 1) {
    throw new RangeError('Volatilities must be nonnegative and correlation must be in [-1, 1]');
  }
}

export function portfolioReturn(weights: readonly number[], returns: readonly number[]): number {
  finiteVector(returns);
  checkWeights(weights, returns.length);
  return dot(weights, returns);
}

export function portfolioVariance(weights: readonly number[], covariance: Matrix): number {
  assertPositiveSemidefinite(covariance);
  checkWeights(weights, covariance.length);
  const terms = weights.flatMap((wi, i) => weights.map((wj, j) => wi * wj * covariance[i][j]));
  const variance = sum(terms);
  // Suppress cancellation at exactly zero risk, without rounding small genuine variances.
  return Math.abs(variance) <= 1e-14 * sum(terms.map(Math.abs)) ? 0 : Math.max(0, variance);
}

/** Validate correlation before scaling, even when an asset has zero volatility. */
export function covarianceFromCorrelations(volatilities: readonly number[], correlations: Matrix): number[][] {
  finiteVector(volatilities);
  assertPositiveSemidefinite(correlations);
  if (volatilities.length !== correlations.length || volatilities.some(x => x < 0) ||
      correlations.some((row, i) => Math.abs(row[i] - 1) > EPS || row.some(x => Math.abs(x) > 1))) {
    throw new RangeError('Invalid volatilities or correlation matrix');
  }
  return correlations.map((row, i) => row.map((rho, j) => rho * volatilities[i] * volatilities[j]));
}

export const twoAssetReturn = (weight: number, r1: number, r2: number): number =>
  portfolioReturn([weight, 1 - weight], [r1, r2]);

export function twoAssetVariance(weight: number, s1: number, s2: number, rho: number): number {
  checkTwo(s1, s2, rho);
  return portfolioVariance([weight, 1 - weight], [[s1 * s1, rho * s1 * s2], [rho * s1 * s2, s2 * s2]]);
}

/** First-asset weight. If both assets have identical risk, choose the equal-weight minimizer. */
export function minimumVarianceWeight(s1: number, s2: number, rho: number, longOnly = false): number {
  checkTwo(s1, s2, rho);
  const scale = Math.max(s1, s2);
  if (!scale) return 0.5;
  const a = s1 / scale, b = s2 / scale;
  const denominator = (a - b) ** 2 + 2 * (1 - rho) * a * b;
  const weight = denominator === 0 ? 0.5 : (b * b - rho * a * b) / denominator;
  return longOnly ? Math.max(0, Math.min(1, weight)) : weight;
}

function point(weights: number[], returns: readonly number[], covariance: Matrix): PortfolioPoint {
  const variance = portfolioVariance(weights, covariance);
  return { weights, expectedReturn: portfolioReturn(weights, returns), variance, sigma: Math.sqrt(variance) };
}

/** Inclusive sweep of the first weight. steps is the number of intervals. */
export function weightSweep(returns: readonly [number, number], volatilities: readonly [number, number], rho: number,
  minWeight = 0, maxWeight = 1, steps = 100): PortfolioPoint[] {
  checkTwo(...volatilities, rho);
  if (!Number.isInteger(steps) || steps < 1 || !Number.isFinite(minWeight) || !Number.isFinite(maxWeight) || maxWeight < minWeight) {
    throw new RangeError('Invalid weight sweep');
  }
  const covariance = covarianceFromCorrelations(volatilities, [[1, rho], [rho, 1]]);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const w = minWeight + (maxWeight - minWeight) * i / steps;
    return point([w, 1 - w], returns, covariance);
  });
}

export function diversificationTable(s1: number, s2: number, correlations: readonly number[], weight = 0.5) {
  return correlations.map(correlation => {
    const variance = twoAssetVariance(weight, s1, s2, correlation);
    return { correlation, variance, sigma: Math.sqrt(variance), minimumVarianceWeight: minimumVarianceWeight(s1, s2, correlation) };
  });
}

/** Equality-constrained Lagrange solution; rank-aware KKT fallback also handles singular PSD inputs. */
function equalityMinimum(covariance: Matrix, returns: readonly number[], target?: number): number[] | null {
  const n = returns.length;
  const scale = Math.max(...covariance.flatMap(row => row.map(Math.abs))) || 1;
  const c = covariance.map(row => row.map(x => x / scale));
  const ones = Array<number>(n).fill(1);
  const spread = Math.max(...returns) - Math.min(...returns);
  if (target !== undefined && spread === 0 && Math.abs(target - returns[0]) > EPS) return null;
  const means = returns.map(r => spread ? (r - returns[0]) / spread : 0);
  const t = target === undefined ? undefined : (spread ? (target - returns[0]) / spread : 0);
  const u = solveLinear(c, ones);
  if (u) {
    const a = sum(u);
    if (t === undefined && Math.abs(a) > EPS) return u.map(x => x / a);
    const v = solveLinear(c, means);
    if (v && t !== undefined) {
      const b = sum(v), d = dot(means, v), determinant = a * d - b * b;
      if (Math.abs(determinant) > EPS * Math.max(Math.abs(a * d), b * b)) {
        return u.map((x, i) => ((d - b * t) * x + (a * t - b) * v[i]) / determinant);
      }
    }
  }
  const constraints = t === undefined || spread === 0 ? [ones] : [ones, means];
  const rhs = constraints.length === 1 ? [1] : [1, t!];
  const kkt = c.map((row, i) => [...row, ...constraints.map(a => a[i])]);
  constraints.forEach(a => kkt.push([...a, ...constraints.map(() => 0)]));
  return solveLinear(kkt, [...ones.map(() => 0), ...rhs])?.slice(0, n) ?? null;
}

/**
 * Enumerate active sets (zero weights) for small teaching portfolios. Worst case is exponential.
 * A feasible face minimum bounds all its subfaces. Only singular GMV ties need further search.
 * This preserves both sum(weights)=1 and the target return, unlike clipping negative weights.
 */
function optimize(returns: readonly number[], covariance: Matrix, longOnly: boolean, target?: number): PortfolioPoint {
  checkAssets(returns, covariance);
  if (target !== undefined && (!Number.isFinite(target) || (longOnly &&
      (target < Math.min(...returns) - EPS || target > Math.max(...returns) + EPS)))) {
    throw new RangeError('Infeasible target return');
  }
  let best: PortfolioPoint | undefined;
  // With a flat minimum, use its highest-return point to label the frontier correctly.
  const searchTies = longOnly && target === undefined && !solveLinear(covariance, returns.map(() => 0), true);
  const riskTolerance = 1e-12 * Math.max(...covariance.flatMap(row => row.map(Math.abs)));
  const visited = new Set<string>();
  function visit(indices: number[]): void {
    const key = indices.join(',');
    if (!indices.length || visited.has(key)) return;
    visited.add(key);
    const weights = equalityMinimum(indices.map(i => indices.map(j => covariance[i][j])), indices.map(i => returns[i]), target);
    if (!weights) return;
    if (!longOnly || weights.every(w => w >= 0)) {
      const full = Array<number>(returns.length).fill(0);
      indices.forEach((i, j) => { full[i] = weights[j]; });
      const candidate = point(full, returns, covariance);
      if (!best || candidate.variance < best.variance - riskTolerance ||
          (Math.abs(candidate.variance - best.variance) <= riskTolerance && candidate.expectedReturn > best.expectedReturn)) best = candidate;
      if (!searchTies) return;
    }
    indices.forEach((_, j) => visit(indices.filter((_, k) => k !== j)));
  }
  visit(returns.map((_, i) => i));
  if (!best) throw new RangeError('Infeasible target return or numerically degenerate portfolio');
  return best;
}

export function globalMinimumVariance(returns: readonly number[], covariance: Matrix, longOnly = false): PortfolioPoint {
  return optimize(returns, covariance, longOnly);
}

/** Detect a full-investment, zero-risk direction with nonzero return (possible for singular PSD). */
function hasRisklessReturnDirection(returns: readonly number[], covariance: Matrix): boolean {
  const scale = Math.max(...covariance.flatMap(row => row.map(Math.abs))) || 1;
  const spread = Math.max(...returns) - Math.min(...returns) || 1;
  const kkt = covariance.map(row => [...row.map(x => x / scale), 1]);
  kkt.push([...returns.map(() => 1), 0]);
  return solveLinear(kkt, [...returns.map(r => (r - returns[0]) / spread), 0]) === null;
}

/** Lower-return portfolios are inefficient. Unrestricted zero-risk return directions dominate every point. */
export function frontier(returns: readonly number[], covariance: Matrix, targets: readonly number[], longOnly = false): FrontierPoint[] {
  const minimum = globalMinimumVariance(returns, covariance, longOnly);
  const dominated = !longOnly && hasRisklessReturnDirection(returns, covariance);
  return targets.map(target => ({ ...optimize(returns, covariance, longOnly, target),
    branch: dominated || target < minimum.expectedReturn - EPS ? 'inefficient' : 'efficient' }));
}

export function frontierPoint(returns: readonly number[], covariance: Matrix, target: number, longOnly = false): FrontierPoint {
  return frontier(returns, covariance, [target], longOnly)[0];
}
