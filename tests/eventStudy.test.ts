import { describe, expect, it } from 'vitest';
import {
  abnormalReturn, abnormalReturnTStatistic, aptExpectedReturn, averageAbnormalReturns, carhartRegression,
  cumulativeAbnormalReturn, famaFrenchRegression, marketModelAbnormalReturns, marketModelReturn,
  ordinaryLeastSquares, tStatistic, type CarhartFactors, type FamaFrenchFactors,
} from '../src/lib/finance/eventStudy';

describe('audited PS4 Exercise 4: expected, abnormal and cumulative returns', () => {
  const market = [0.03, 0.01, -0.02];
  const observed = [0.046, 0.020, -0.005];
  it('Ex 4a: monthly market-model returns', () => {
    const expected = market.map(r => marketModelReturn(r, 0, 1.2));
    expect(expected[0]).toBeCloseTo(0.036, 12);
    expect(expected[1]).toBeCloseTo(0.012, 12);
    expect(expected[2]).toBeCloseTo(-0.024, 12);
  });
  it('Ex 4b–c: monthly ARs and quarter CAR of 3.7%', () => {
    const ar = marketModelAbnormalReturns(observed, market, 0, 1.2);
    expect(ar[0]).toBeCloseTo(0.010, 12);
    expect(ar[1]).toBeCloseTo(0.008, 12);
    expect(ar[2]).toBeCloseTo(0.019, 12);
    expect(cumulativeAbnormalReturn(ar)).toBeCloseTo(0.037, 12);
    expect(cumulativeAbnormalReturn(ar, 1, 2)).toBeCloseTo(0.027, 12);
    expect(cumulativeAbnormalReturn(ar)).toBeGreaterThan(0);
  });
});

describe('event study properties and inference', () => {
  it('market model intercept and scalar AR', () => {
    expect(marketModelReturn(0.02, 0.005, 1.5)).toBeCloseTo(0.035, 12);
    expect(abnormalReturn(0.04, 0.035)).toBeCloseTo(0.005, 12);
    expect(marketModelAbnormalReturns([0.04], [0.02], 0.005, 1.5)[0]).toBeCloseTo(0.005, 12);
  });
  it('CAR equals sum of ARs over every inclusive subwindow on deterministic series', () => {
    for (let n = 1; n <= 12; n++) {
      const ar = Array.from({ length: n }, (_, i) => ((i * 17 + n * 7) % 23 - 11) / 100);
      for (let start = 0; start < n; start++) for (let end = start; end < n; end++) {
        let sum = 0;
        for (let t = start; t <= end; t++) sum += ar[t];
        expect(cumulativeAbnormalReturn(ar, start, end)).toBeCloseTo(sum, 12);
      }
      expect(cumulativeAbnormalReturn(ar)).toBeCloseTo(ar.reduce((a, b) => a + b, 0), 12);
    }
    expect(cumulativeAbnormalReturn([0.1, 0.1])).toBeCloseTo(0.2, 12);
  });
  it('AAR averages across firms; summing AAR equals average CAR', () => {
    const assets = [[0.01, -0.02, 0.03], [0.03, 0.04, -0.01]];
    const before = JSON.stringify(assets);
    const aar = averageAbnormalReturns(assets);
    expect(aar[0]).toBeCloseTo(0.02, 12);
    expect(aar[1]).toBeCloseTo(0.01, 12);
    expect(aar[2]).toBeCloseTo(0.01, 12);
    expect(cumulativeAbnormalReturn(aar)).toBeCloseTo(
      (cumulativeAbnormalReturn(assets[0]) + cumulativeAbnormalReturn(assets[1])) / 2, 12);
    expect(averageAbnormalReturns([[0.01, 0.02]])).toEqual([0.01, 0.02]);
    expect(JSON.stringify(assets)).toBe(before);
  });
  it('t-statistics use a supplied SE or sample SD / sqrt(n)', () => {
    expect(tStatistic(0.037, 0.01)).toBeCloseTo(3.7, 12);
    expect(tStatistic(0.037, 0.01, 0.017)).toBeCloseTo(2, 12);
    expect(abnormalReturnTStatistic([0.01, 0.02, 0.03])).toBeCloseTo(2 * Math.sqrt(3), 12);
    expect(abnormalReturnTStatistic([-0.01, -0.02, -0.03])).toBeCloseTo(-2 * Math.sqrt(3), 12);
  });
});

describe('OLS and factor models', () => {
  it('hand regression with nonzero residuals', () => {
    const fit = ordinaryLeastSquares([[0], [1], [2]], [1, 2, 5]);
    expect(fit.intercept).toBeCloseTo(2 / 3, 12);
    expect(fit.coefficients[0]).toBeCloseTo(2, 12);
    expect(fit.fitted[0]).toBeCloseTo(2 / 3, 12);
    expect(fit.fitted[1]).toBeCloseTo(8 / 3, 12);
    expect(fit.fitted[2]).toBeCloseTo(14 / 3, 12);
    expect(fit.residuals[0]).toBeCloseTo(1 / 3, 12);
    expect(fit.residuals[1]).toBeCloseTo(-2 / 3, 12);
    expect(fit.residuals[2]).toBeCloseTo(1 / 3, 12);
    expect(fit.residualSumSquares).toBeCloseTo(2 / 3, 12);
    expect(fit.degreesOfFreedom).toBe(1);
    expect(fit.residualVariance).toBeCloseTo(2 / 3, 12);
    expect(fit.residuals.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12);
    expect(fit.residuals.reduce((s, e, i) => s + e * i, 0)).toBeCloseTo(0, 12);
  });
  it('OLS recovers known noiseless coefficients for 1–4 factors across scales', () => {
    for (let k = 1; k <= 4; k++) for (const scale of [1e-6, 0.01, 1, 100]) {
      const factors = Array.from({ length: 24 }, (_, i) =>
        Array.from({ length: k }, (_, j) => scale * (Math.sin((i + 1) * (j + 1)) + j / 10)));
      const coefficients = Array.from({ length: k }, (_, j) => (j % 2 ? -1 : 1) * (j + 1) / 2);
      const observed = factors.map(row => 0.007 + row.reduce((s, x, j) => s + x * coefficients[j], 0));
      const before = JSON.stringify({ factors, observed });
      const fit = ordinaryLeastSquares(factors, observed);
      expect(fit.intercept).toBeCloseTo(0.007, 10);
      fit.coefficients.forEach((b, j) => expect(b).toBeCloseTo(coefficients[j], 9));
      fit.fitted.forEach((v, i) => expect(v).toBeCloseTo(observed[i], 10));
      fit.residuals.forEach(e => expect(e).toBeCloseTo(0, 10));
      expect(fit.residualSumSquares).toBeCloseTo(0, 15);
      expect(fit.degreesOfFreedom).toBe(23 - k);
      expect(JSON.stringify({ factors, observed })).toBe(before);
    }
  });
  it('handles an intercept-only fit and an exactly identified line', () => {
    const constant = ordinaryLeastSquares([[], [], []], [0.01, 0.02, 0.03]);
    expect(constant.intercept).toBeCloseTo(0.02, 12);
    expect(constant.coefficients).toEqual([]);
    expect(constant.degreesOfFreedom).toBe(2);
    expect(constant.residualVariance).toBeCloseTo(0.0001, 12);
    const exact = ordinaryLeastSquares([[0], [1]], [2, 5]);
    expect(exact.intercept).toBeCloseTo(2, 12);
    expect(exact.coefficients[0]).toBeCloseTo(3, 12);
    expect(exact.degreesOfFreedom).toBe(0);
    expect(exact.residualVariance).toBeNull();
  });
  it('Fama-French recovers alpha and three factor loadings from excess returns', () => {
    const factors: FamaFrenchFactors[] = [
      [0, 0, 0], [0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01], [-0.01, 0.02, -0.01],
    ];
    const returns = factors.map(([market, smb, hml]) => 0.002 + 1.2 * market + 0.5 * smb - 0.3 * hml);
    const fit = famaFrenchRegression(factors, returns);
    expect(fit.intercept).toBeCloseTo(0.002, 12);
    expect(fit.coefficients[0]).toBeCloseTo(1.2, 12);
    expect(fit.coefficients[1]).toBeCloseTo(0.5, 12);
    expect(fit.coefficients[2]).toBeCloseTo(-0.3, 12);
  });
  it('Carhart adds a momentum factor and recovers four loadings', () => {
    const factors: CarhartFactors[] = [
      [0, 0, 0, 0], [0.01, 0, 0, 0], [0, 0.01, 0, 0], [0, 0, 0.01, 0], [0, 0, 0, 0.01],
      [-0.01, 0.02, -0.01, 0.03],
    ];
    const returns = factors.map(([market, smb, hml, momentum]) => -0.001 + market + 0.4 * smb - 0.2 * hml + 0.7 * momentum);
    const fit = carhartRegression(factors, returns);
    expect(fit.intercept).toBeCloseTo(-0.001, 12);
    [1, 0.4, -0.2, 0.7].forEach((b, j) => expect(fit.coefficients[j]).toBeCloseTo(b, 12));
  });
  it('APT combines factor premiums without a regression intercept', () => {
    expect(aptExpectedReturn(0.03, [1.2, 0.5, -0.3], [0.06, 0.02, 0.01])).toBeCloseTo(0.109, 12);
    expect(aptExpectedReturn(0.03, [], [])).toBe(0.03);
    expect(aptExpectedReturn(0.03, [1], [0.07])).toBeCloseTo(0.10, 12);
  });
});

describe('invalid event and regression inputs', () => {
  it.each([
    () => marketModelReturn(NaN, 0, 1), () => abnormalReturn(Infinity, 0),
    () => marketModelAbnormalReturns([], [], 0, 1),
    () => marketModelAbnormalReturns([0.1], [0.1, 0.2], 0, 1),
    () => averageAbnormalReturns([]), () => averageAbnormalReturns([[]]),
    () => averageAbnormalReturns([[0.1], [0.1, 0.2]]), () => averageAbnormalReturns([[NaN]]),
    () => cumulativeAbnormalReturn([]), () => cumulativeAbnormalReturn([0.1], -1, 0),
    () => cumulativeAbnormalReturn([0.1], 0, 1), () => cumulativeAbnormalReturn([0.1], 0.5, 0),
    () => cumulativeAbnormalReturn([0.1, 0.2], 1, 0), () => cumulativeAbnormalReturn([NaN]),
    () => tStatistic(0, 0), () => tStatistic(0, -1), () => abnormalReturnTStatistic([0.1]),
    () => abnormalReturnTStatistic([0.1, 0.1]), () => ordinaryLeastSquares([], []),
    () => abnormalReturnTStatistic([0.1, 0.1, 0.1]),
    () => ordinaryLeastSquares([[1]], [1, 2]), () => ordinaryLeastSquares([[1, 2], [2, 3]], [1, 2]),
    () => ordinaryLeastSquares([[1], []], [1, 2]), () => ordinaryLeastSquares([[NaN], [1]], [1, 2]),
    () => ordinaryLeastSquares([[1], [2]], [1, Infinity]),
    () => ordinaryLeastSquares([[1], [1], [1]], [1, 2, 3]),
    () => ordinaryLeastSquares([[1, 2], [2, 4], [3, 6], [4, 8]], [1, 2, 3, 4]),
    () => aptExpectedReturn(0.03, [1, 2], [0.1]), () => aptExpectedReturn(0.03, [NaN], [0.1]),
  ])('rejects invalid calculation %#', calculate => {
    expect(calculate).toThrow(RangeError);
  });
});
