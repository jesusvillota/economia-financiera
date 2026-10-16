import { solveLinear, type Matrix } from './matrix';
import { sampleMean, sampleStandardDeviation } from './risk';

/** Returns use decimals; rows are observations, columns are factors. */
function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) throw new RangeError('Inputs must be finite');
}
function series(values: readonly number[]): void {
  if (!values.length) throw new RangeError('Series must be nonempty');
  finite(...values);
}

/** Raw-return market model: E[r_t] = intercept + beta * r_market,t.
 * For an excess-return CAPM fit, pass excess returns and add rf back separately.
 */
export function marketModelReturn(marketReturn: number, intercept: number, beta: number): number {
  finite(marketReturn, intercept, beta);
  return intercept + beta * marketReturn;
}

export function abnormalReturn(observedReturn: number, expectedReturn: number): number {
  finite(observedReturn, expectedReturn);
  return observedReturn - expectedReturn;
}

export function marketModelAbnormalReturns(observed: readonly number[], market: readonly number[], intercept: number, beta: number): number[] {
  series(observed);
  series(market);
  if (observed.length !== market.length) throw new RangeError('Return series must align');
  return observed.map((r, i) => abnormalReturn(r, marketModelReturn(market[i], intercept, beta)));
}

/** AAR across assets at each date. Each row is one asset, columns are aligned dates. */
export function averageAbnormalReturns(assetReturns: Matrix): number[] {
  if (!assetReturns.length) throw new RangeError('At least one asset is required');
  assetReturns.forEach(row => {
    series(row);
    if (row.length !== assetReturns[0].length) throw new RangeError('Event dates must align');
  });
  return assetReturns[0].map((_, t) => sampleMean(assetReturns.map(row => row[t])));
}

/** CAR adds ARs (never compounds them). Window endpoints are inclusive, zero-based indices. */
export function cumulativeAbnormalReturn(returns: readonly number[], start = 0, end = returns.length - 1): number {
  series(returns);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= returns.length) {
    throw new RangeError('Invalid inclusive event window');
  }
  return returns.slice(start, end + 1).reduce((a, b) => a + b, 0);
}

/** Statistic for an estimate with a supplied standard error; does not imply a p-value. */
export function tStatistic(estimate: number, standardError: number, nullValue = 0): number {
  finite(estimate, standardError, nullValue);
  if (standardError <= 0) throw new RangeError('Standard error must be positive');
  return (estimate - nullValue) / standardError;
}

/** One-sample t of independent ARs (or independent firms' CARs): mean / (s / sqrt(n)). */
export function abnormalReturnTStatistic(returns: readonly number[]): number {
  series(returns);
  if (returns.every(r => r === returns[0])) throw new RangeError('Sample standard error must be positive');
  return tStatistic(sampleMean(returns), sampleStandardDeviation(returns) / Math.sqrt(returns.length));
}

export interface OLSResult {
  intercept: number;
  coefficients: number[];
  fitted: number[];
  residuals: number[];
  residualSumSquares: number;
  degreesOfFreedom: number;
  /** null for an exactly identified fit (n equals number of fitted parameters). */
  residualVariance: number | null;
}

/** OLS with an intercept, using centered/scaled normal equations X'X b = X'y.
 * Factors must have full column rank. This is for small teaching datasets;
 * nearly collinear designs throw at the matrix solver's relative tolerance (1e-12).
 */
export function ordinaryLeastSquares(factors: Matrix, observed: readonly number[]): OLSResult {
  series(observed);
  const n = observed.length;
  const k = factors[0]?.length ?? 0;
  if (factors.length !== n || n < k + 1 || factors.some(row => row.length !== k)) {
    throw new RangeError('OLS requires aligned rows and at least k+1 observations');
  }
  factors.forEach(row => finite(...row));
  const meanY = sampleMean(observed);
  const means = Array.from({ length: k }, (_, j) => sampleMean(factors.map(row => row[j])));
  const scales = means.map((mean, j) => Math.max(...factors.map(row => Math.abs(row[j] - mean))));
  if (scales.some(x => x === 0)) throw new RangeError('OLS factors must have full column rank');
  const x = factors.map(row => row.map((v, j) => (v - means[j]) / scales[j]));
  const gram = means.map((_, j) => means.map((_, l) => x.reduce((s, row) => s + row[j] * row[l], 0)));
  const rhs = means.map((_, j) => x.reduce((s, row, i) => s + row[j] * (observed[i] - meanY), 0));
  const scaled = k ? solveLinear(gram, rhs, true) : [];
  if (!scaled) throw new RangeError('OLS factors must have full column rank');
  const coefficients = scaled.map((v, j) => v / scales[j]);
  const intercept = meanY - coefficients.reduce((s, b, j) => s + b * means[j], 0);
  const fitted = factors.map(row => intercept + row.reduce((s, v, j) => s + v * coefficients[j], 0));
  const residuals = observed.map((v, i) => v - fitted[i]);
  const residualSumSquares = residuals.reduce((s, e) => s + e * e, 0);
  const degreesOfFreedom = n - k - 1;
  return { intercept, coefficients, fitted, residuals, residualSumSquares, degreesOfFreedom,
    residualVariance: degreesOfFreedom ? residualSumSquares / degreesOfFreedom : null };
}

export type FamaFrenchFactors = readonly [marketExcess: number, smb: number, hml: number];
export type CarhartFactors = readonly [marketExcess: number, smb: number, hml: number, momentum: number];

/** Regress asset EXCESS returns on [market-rf, SMB, HML]; intercept is factor-model alpha. */
export function famaFrenchRegression(factors: readonly FamaFrenchFactors[], excessReturns: readonly number[]): OLSResult {
  if (factors.some(row => row.length !== 3)) throw new RangeError('Fama-French requires three factors');
  return ordinaryLeastSquares(factors, excessReturns);
}

/** Regress asset EXCESS returns on [market-rf, SMB, HML, momentum]. */
export function carhartRegression(factors: readonly CarhartFactors[], excessReturns: readonly number[]): OLSResult {
  if (factors.some(row => row.length !== 4)) throw new RangeError('Carhart requires four factors');
  return ordinaryLeastSquares(factors, excessReturns);
}

/** APT equilibrium return = rf + sum(beta_k * factor premium_k); no fitted alpha. */
export function aptExpectedReturn(riskFreeRate: number, betas: readonly number[], premiums: readonly number[]): number {
  finite(riskFreeRate, ...betas, ...premiums);
  if (betas.length !== premiums.length) throw new RangeError('Factor dimensions must match');
  return riskFreeRate + betas.reduce((s, b, j) => s + b * premiums[j], 0);
}
