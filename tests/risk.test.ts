import { describe, expect, it } from 'vitest';
import {
  RiskError, affineMoments, annualizedVolatility, correlation, covariance, expectedReturn,
  holdingPeriodReturn, sampleMean, sampleStandardDeviation, sampleVariance,
  scenarioStandardDeviation, scenarioVariance,
} from '../src/lib/finance/risk';

// Constants and absolute tolerances from docs/audit/ps2.py and ps2_findings.md.
// Ex 8: E[A]=.3(.18)+.5(.05)+.2(-.07)=.065; Var(A)=.007725.
const p = [0.3, 0.5, 0.2];
const a = [0.18, 0.05, -0.07];
const b = [0.07, 0.04, -0.02];
const m = [0.12, 0.06, -0.03];
const square = (x: number[]) => x.map((v) => v ** 2);
const product = (x: number[], y: number[]) => x.map((v, i) => v * y[i]);
const e = (x: number[]) => expectedReturn(x, p);
const v = (x: number[]) => scenarioVariance(x, p);
const sd = (x: number[]) => scenarioStandardDeviation(x, p);
const cov = (x: number[], y: number[]) => covariance(x, y, p);
// Ex 9: R_t=(P_t-P_(t-1)+D_t)/P_(t-1); sample variance uses 6-1=5.
const prices = [48, 50, 49, 51, 53, 52, 55];
const dividends = [0.3, 0.3, 0.3, 0.3, 0.35, 0.35];
const returns = dividends.map((d, i) => holdingPeriodReturn(prices[i], prices[i + 1], d));
const mean = sampleMean(returns);
const deviations = returns.map((r) => (r - mean) ** 2);
type Answer = [label: string, actual: number, expected: number, tolerance: number];
const answers: Answer[] = [
  ['8a E[A]', e(a), 0.065, 1e-9],
  ['8a E[B]', e(b), 0.037, 1e-9],
  ['8a Var A', v(a), 0.00773, 5e-6],
  ['8a Var B', v(b), 0.00098, 5e-6],
  ['8a E[A²]', e(square(a)), 0.01195, 5e-6],
  ['8a E[B²]', e(square(b)), 0.00235, 5e-6],
  ['8a sd A %', 100 * sd(a), 8.79, 0.006],
  ['8a sd B %', 100 * sd(b), 3.13, 0.006],
  ['8b Cov AB deviations', cov(a, b), 0.00266, 6e-6],
  ['8b E[AB]', e(product(a, b)), 0.00506, 5e-6],
  ['8b Cov AB product identity', e(product(a, b)) - e(a) * e(b), 0.00266, 6e-6],
  ['8b Cov AB used in rho', cov(a, b), 0.002655, 5e-7],
  ['8b sdA sdB', sd(a) * sd(b), 0.002753, 5e-7],
  ['8b correlation', correlation(a, b, p), 0.964, 0.0006],
  ['8c E[M] %', 100 * e(m), 6, 1e-9],
  ['8c Var M', v(m), 0.0027, 5e-6],
  ['8c sd M %', 100 * sd(m), 5.20, 0.006],
  ['8c Cov AM', cov(a, m), 0.0045, 5e-6],
  ['8c Cov BM', cov(b, m), 0.00162, 5e-6],
  ['8c E[AM]', e(product(a, m)), 0.0084, 5e-6],
  ['8c E[BM]', e(product(b, m)), 0.00384, 5e-6],
  // Beta API belongs to TASK-023; regression ratios still cover every PS2 numeric answer.
  ['8c beta A', cov(a, m) / v(m), 1.67, 0.006],
  ['8c beta B', cov(b, m) / v(m), 0.60, 0.006],
  ...[0.0479, -0.0140, 0.0469, 0.0451, -0.0123, 0.0644].map((expected, i): Answer =>
    [`9a R${i + 1}`, returns[i], expected, 5e-5]),
  ['9b mean %', 100 * mean, 2.97, 0.006],
  ['9b mean six decimals', mean, 0.029685, 5e-7],
  ...[0.000332, 0.001908, 0.000298, 0.000238, 0.001760, 0.001207].map((expected, i): Answer =>
    [`9b squared deviation ${i + 1}`, deviations[i], expected, 5e-7]),
  ['9b sum squared deviations', deviations.reduce((a, b) => a + b), 0.005742, 5e-7],
  ['9b sample sd', sampleStandardDeviation(returns), 0.03388, 2e-5],
  ['9b monthly sd %', 100 * sampleStandardDeviation(returns), 3.39, 0.006],
  ['9b annual sd %', 100 * annualizedVolatility(sampleStandardDeviation(returns), 12), 11.74, 0.006],
  // Appendix included for completeness, especially the corrected E[B]=5.1%, not 5.3%.
  ['Appendix E[r] %', 100 * e([0.1, 0.05, -0.03]), 4.9, 1e-9],
  ['Appendix Var r', v([0.1, 0.05, -0.03]), 0.00203, 5e-6],
  ['Appendix sd %', 100 * sd([0.1, 0.05, -0.03]), 4.51, 0.006],
  ['Appendix E[A] %', 100 * e([0.12, 0.06, -0.02]), 6.2, 1e-9],
  ['Appendix E[B] % corrected', 100 * e([0.08, 0.05, 0.01]), 5.1, 1e-9],
  ['Appendix Cov AB', cov([0.12, 0.06, -0.02], [0.08, 0.05, 0.01]), 0.00118, 5e-6],
  ['Appendix beta A', cov(a, m) / v(m), 1.67, 0.006],
];

describe('PS2 risk: every audited answer, Ex 8–9 and appendix', () => {
  it.each(answers)('%s', (_label, actual, expected, tolerance) => {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance + Number.EPSILON);
  });
});

describe('risk formulas and properties', () => {
  // Deterministic parameter sweep: varied joint returns, probabilities, and signs. No flaky random draws.
  it.each(Array.from({ length: 40 }, (_, i) => i + 1))('covariance symmetry and correlation bounds, case %s', (i) => {
    const probabilities = [i / 100, 0.5, 0.5 - i / 100];
    const x = [Math.sin(i) / 2, i / 100, -0.3];
    const y = [0.2, Math.cos(i) / 3, -i / 80];
    const c = covariance(x, y, probabilities);
    expect(c).toBeCloseTo(covariance(y, x, probabilities), 14);
    const rho = correlation(x, y, probabilities);
    expect(rho).toBeGreaterThanOrEqual(-1);
    expect(rho).toBeLessThanOrEqual(1);
    expect(covariance(x, x, probabilities)).toBeCloseTo(scenarioVariance(x, probabilities), 14);
    expect(c).toBeCloseTo(expectedReturn(product(x, y), probabilities) - expectedReturn(x, probabilities) * expectedReturn(y, probabilities), 14);
  });
  it.each([-3, -1, 0, 0.5, 2])('expectation and variance under scale %s and a shift', (scale) => {
    const shifted = a.map((x) => scale * x + 0.17);
    const moments = affineMoments(e(a), v(a), scale, 0.17);
    expect(expectedReturn(shifted, p)).toBeCloseTo(moments.mean, 14);
    expect(scenarioVariance(shifted, p)).toBeCloseTo(moments.variance, 14);
    expect(e(a.map((x, i) => x + b[i]))).toBeCloseTo(e(a) + e(b), 14);
  });
  it('handles constant returns, zero probabilities, and perfect ±1 correlation', () => {
    expect(expectedReturn([0.1], [1])).toBe(0.1);
    expect(scenarioVariance([0.1], [1])).toBe(0);
    expect(scenarioStandardDeviation([0.1, 0.1], [0.5, 0.5])).toBe(0);
    expect(expectedReturn([123, 0.1], [0, 1])).toBe(0.1);
    expect(correlation(a, a, p)).toBeCloseTo(1, 14);
    expect(correlation(a, a.map((x) => -x), p)).toBeCloseTo(-1, 14);
    expect(covariance(a, [0.1, 0.1, 0.1], p)).toBeCloseTo(0, 14);
  });
  it('keeps constant scenarios exact despite probability rounding', () => {
    const probabilities = [0.1, 0.2, 0.7];
    expect(expectedReturn([0.1, 0.1, 0.1], probabilities)).toBe(0.1);
    expect(scenarioVariance([0.1, 0.1, 0.1], probabilities)).toBe(0);
    expect(() => correlation([0.1, 0.1, 0.1], a, probabilities)).toThrow(RiskError);
    expect(scenarioVariance([1000, 0.1, 0.1], [0, 0.3, 0.7])).toBe(0);
    expect(expectedReturn([0.1, 0.1], [0.5, 0.5 + 1e-14])).toBe(0.1);
  });
  it('uses the n-1 sample divisor and preserves affine identities', () => {
    // For [1,2,3]: mean=2, squared deviations sum=2, sample variance=2/(3-1)=1.
    expect(sampleMean([1, 2, 3])).toBe(2);
    expect(sampleVariance([1, 2, 3])).toBe(1);
    expect(sampleStandardDeviation([1, 2, 3])).toBe(1);
    expect(sampleMean([0.2])).toBe(0.2);
    expect(sampleVariance([0.2, 0.2])).toBe(0);
    expect(sampleVariance(returns.map((x) => -2 * x + 5))).toBeCloseTo(4 * sampleVariance(returns), 12);
    expect(sampleMean(returns.map((x) => -2 * x + 5))).toBeCloseTo(-2 * mean + 5, 12);
    expect(annualizedVolatility(0, 12)).toBe(0);
    expect(holdingPeriodReturn(100, 0)).toBe(-1);
  });
});

describe('typed risk domain errors', () => {
  const invalid: [string, () => unknown][] = [
    ['empty scenarios', () => expectedReturn([], [])],
    ['probabilities do not sum to 1', () => expectedReturn([0, 1], [0.2, 0.2])],
    ['negative probability', () => scenarioVariance([0, 1], [-0.1, 1.1])],
    ['mismatched lengths', () => expectedReturn([0, 1], [1])],
    ['nonfinite return', () => expectedReturn([NaN], [1])],
    ['nonfinite probability', () => expectedReturn([1], [Infinity])],
    ['mismatched covariance series', () => covariance(a, [1], p)],
    ['zero variance correlation', () => correlation([0, 0], [1, 2], [0.5, 0.5])],
    ['zero variance second series', () => correlation([1, 2], [0, 0], [0.5, 0.5])],
    ['empty sample', () => sampleMean([])],
    ['one-observation variance', () => sampleVariance([1])],
    ['one-observation standard deviation', () => sampleStandardDeviation([1])],
    ['nonfinite sample', () => sampleVariance([1, Infinity])],
    ['zero initial price', () => holdingPeriodReturn(0, 10)],
    ['negative final price', () => holdingPeriodReturn(10, -1)],
    ['negative dividend', () => holdingPeriodReturn(10, 11, -1)],
    ['nonfinite price', () => holdingPeriodReturn(10, Infinity)],
    ['negative volatility', () => annualizedVolatility(-0.1, 12)],
    ['zero annual periods', () => annualizedVolatility(0.1, 0)],
    ['nonfinite annual periods', () => annualizedVolatility(0.1, Infinity)],
    ['negative affine variance', () => affineMoments(0.1, -1, 1, 0)],
    ['nonfinite affine scale', () => affineMoments(0.1, 0.1, NaN, 0)],
  ];
  it.each(invalid)('%s', (_label, run) => expect(run).toThrow(RiskError));
});
