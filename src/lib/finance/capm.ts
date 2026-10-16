import { assertPositiveSemidefinite, solveLinear, type Matrix } from './matrix';
import { portfolioReturn, portfolioVariance, type PortfolioPoint } from './portfolio';

/** Returns and volatilities are decimals, measured over the same period. */
function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Inputs must be finite');
}

export function sharpeRatio(expectedReturn: number, riskFreeRate: number, sigma: number): number {
  finite(expectedReturn, riskFreeRate, sigma);
  if (sigma <= 0) throw new RangeError('Sharpe ratio requires positive volatility');
  return (expectedReturn - riskFreeRate) / sigma;
}

/** Upper CAL ray (nonnegative risky allocation), parameterized by target volatility. */
export function capitalAllocationLine(riskFreeRate: number, riskyReturn: number, riskySigma: number, sigma: number): number {
  finite(sigma);
  if (sigma < 0) throw new RangeError('Target volatility must be nonnegative');
  return riskFreeRate + sharpeRatio(riskyReturn, riskFreeRate, riskySigma) * sigma;
}

/** The CML is the CAL when the risky portfolio is the market portfolio. */
export const capitalMarketLine = capitalAllocationLine;

/** Any risky fund plus cash; negative weights and borrowing are allowed. */
export function riskFreeMix(riskFreeRate: number, riskyReturn: number, riskySigma: number, riskyWeight: number) {
  finite(riskFreeRate, riskyReturn, riskySigma, riskyWeight);
  if (riskySigma < 0) throw new RangeError('Volatility must be nonnegative');
  const sigma = Math.abs(riskyWeight) * riskySigma;
  return { riskyWeight, riskFreeWeight: 1 - riskyWeight,
    expectedReturn: riskFreeRate + riskyWeight * (riskyReturn - riskFreeRate), sigma, variance: sigma ** 2 };
}

export type AllocationTarget = { sigma: number } | { expectedReturn: number };

/** Separation: combine the supplied tangent fund and cash for one risk or return target.
 * A risk target selects the nonnegative risky weight; a return target can short the fund.
 * Also usable with any specified risky fund (as required by PS3 Exercises 4 and 7).
 */
export function separationAllocation(riskFreeRate: number, riskyReturn: number, riskySigma: number, target: AllocationTarget) {
  finite(riskFreeRate, riskyReturn, riskySigma);
  if (riskySigma <= 0 || ('sigma' in target) === ('expectedReturn' in target)) {
    throw new RangeError('Supply a positive fund volatility and exactly one target');
  }
  let weight: number;
  if ('sigma' in target) {
    finite(target.sigma);
    if (target.sigma < 0) throw new RangeError('Target volatility must be nonnegative');
    weight = target.sigma / riskySigma;
  } else {
    finite(target.expectedReturn);
    if (riskyReturn === riskFreeRate) throw new RangeError('Return target requires a nonzero risk premium');
    weight = (target.expectedReturn - riskFreeRate) / (riskyReturn - riskFreeRate);
  }
  return riskFreeMix(riskFreeRate, riskyReturn, riskySigma, weight);
}

/** Unrestricted maximum-Sharpe fund: w = C^-1(mu-rf) / sum(C^-1(mu-rf)).
 * Reuses portfolio.ts for portfolio moments. Requires nonsingular PSD covariance and
 * a positive normalizer; otherwise there is no unique finite upper tangent of this form.
 * Singular inputs and nonpositive normalizers throw instead of returning a minimum Sharpe.
 */
export function tangentPortfolio(returns: readonly number[], covariance: Matrix, riskFreeRate: number): PortfolioPoint & { sharpe: number } {
  finite(riskFreeRate, ...returns);
  assertPositiveSemidefinite(covariance);
  if (!returns.length || returns.length !== covariance.length) throw new RangeError('Asset dimensions must match');
  const direction = solveLinear(covariance, returns.map(r => r - riskFreeRate), true);
  if (!direction) throw new RangeError('Tangent portfolio requires nonsingular covariance');
  const total = direction.reduce((a, b) => a + b, 0);
  if (total <= 1e-12 * direction.reduce((a, b) => a + Math.abs(b), 0)) {
    throw new RangeError('No finite upper tangent portfolio with a positive normalizer');
  }
  const weights = direction.map(x => x / total);
  const expectedReturn = portfolioReturn(weights, returns);
  const variance = portfolioVariance(weights, covariance);
  const sigma = Math.sqrt(variance);
  return { weights, expectedReturn, variance, sigma, sharpe: sharpeRatio(expectedReturn, riskFreeRate, sigma) };
}

export function beta(covarianceWithMarket: number, marketVariance: number): number {
  finite(covarianceWithMarket, marketVariance);
  if (marketVariance <= 0) throw new RangeError('Market variance must be positive');
  return covarianceWithMarket / marketVariance;
}

export function securityMarketLine(riskFreeRate: number, marketReturn: number, assetBeta: number): number {
  finite(riskFreeRate, marketReturn, assetBeta);
  return riskFreeRate + assetBeta * (marketReturn - riskFreeRate);
}

/** Portfolio beta is the fully invested weighted mean of asset betas, including shorts. */
export const portfolioBeta = (weights: readonly number[], betas: readonly number[]): number => portfolioReturn(weights, betas);

/** Jensen alpha: expected/observed return less the CAPM required return. */
export function alpha(observedReturn: number, riskFreeRate: number, marketReturn: number, assetBeta: number): number {
  finite(observedReturn);
  return observedReturn - securityMarketLine(riskFreeRate, marketReturn, assetBeta);
}

/** Positive alpha means underpriced; tolerance is in return units, not percentage points. */
export function mispricing(observedReturn: number, riskFreeRate: number, marketReturn: number, assetBeta: number, tolerance = 1e-12) {
  finite(tolerance);
  if (tolerance < 0) throw new RangeError('Tolerance must be nonnegative');
  const requiredReturn = securityMarketLine(riskFreeRate, marketReturn, assetBeta);
  const excess = alpha(observedReturn, riskFreeRate, marketReturn, assetBeta);
  const pricing = Math.abs(excess) <= tolerance ? 'fair' : excess > 0 ? 'underpriced' : 'overpriced';
  return { requiredReturn, alpha: excess, pricing };
}

/** Single-index model: Var(asset) = beta² Var(market) + Var(residual).
 * Assumes the residual and market are uncorrelated; outputs are variances.
 */
export function riskDecomposition(assetVariance: number, assetBeta: number, marketVariance: number) {
  finite(assetVariance, assetBeta, marketVariance);
  if (assetVariance < 0 || marketVariance < 0) throw new RangeError('Variances must be nonnegative');
  const systematicVariance = assetBeta ** 2 * marketVariance;
  const residual = assetVariance - systematicVariance;
  if (residual < -1e-12 * Math.max(assetVariance, systematicVariance)) {
    throw new RangeError('Systematic variance exceeds total variance');
  }
  return { systematicVariance, idiosyncraticVariance: Math.max(0, residual), totalVariance: assetVariance };
}
