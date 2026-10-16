import { describe, expect, it } from 'vitest';
import {
  activeAlpha, autocorrelation, benchmarkAbnormalReturns, gambleExpectedValue, gambleProspectValue, logReturns,
  momentumBacktest, probabilityWeight, prospectValue, randomWalkPrices, runsTest, TK1992, trendPrices, varianceRatio,
  type ProspectParameters,
} from '../src/lib/finance/efficiency';

const base = { p0: 100, drift: 0, sigma: 0.01, steps: 10_000, seed: 42 };
const linear: ProspectParameters = { alpha: 1, beta: 1, lambda: 2, gamma: 1 };

describe('seeded price simulators', () => {
  it('a fixed seed reproduces the same path exactly; another seed does not', () => {
    const a = randomWalkPrices({ ...base, steps: 250 });
    expect(randomWalkPrices({ ...base, steps: 250 })).toEqual(a);
    expect(trendPrices({ ...base, steps: 250, phi: 0.5 })).toEqual(trendPrices({ ...base, steps: 250, phi: 0.5 }));
    expect(randomWalkPrices({ ...base, steps: 250, seed: 43 })).not.toEqual(a);
    expect(a).toHaveLength(251);
    expect(a[0]).toBe(100);
    expect(a.every(p => p > 0)).toBe(true);
  });
  it('phi = 0 trend path equals the random walk; sigma = 0 path grows at the drift', () => {
    expect(trendPrices({ ...base, steps: 50, phi: 0 })).toEqual(randomWalkPrices({ ...base, steps: 50 }));
    const flat = randomWalkPrices({ ...base, drift: 0.01, sigma: 0, steps: 3 });
    expect(flat[3]).toBeCloseTo(100 * Math.exp(0.03), 12);
    logReturns(flat).forEach(r => expect(r).toBeCloseTo(0.01, 12));
  });
  it('rejects invalid inputs', () => {
    expect(() => randomWalkPrices({ ...base, p0: 0 })).toThrow(RangeError);
    expect(() => randomWalkPrices({ ...base, steps: 0 })).toThrow(RangeError);
    expect(() => randomWalkPrices({ ...base, sigma: -1 })).toThrow(RangeError);
    expect(() => trendPrices({ ...base, phi: 1 })).toThrow(RangeError);
  });
});

describe('autocorrelation, variance ratio and runs', () => {
  // 10 000 i.i.d. returns: the lag-1 sample autocorrelation has s.e. about 1/sqrt(n) = 0.01; tolerance 3 s.e.
  const rw = logReturns(randomWalkPrices(base));
  const trend = logReturns(trendPrices({ ...base, phi: 0.5 }));

  it('hand values', () => {
    expect(autocorrelation([1, 2, 3, 4])).toBeCloseTo(0.25, 12); // (0.75 - 0.25 + 0.75) / 5
    expect(autocorrelation([1, -1, 1, -1])).toBeCloseTo(-0.75, 12);
    expect(varianceRatio([1, -1, 1, -1], 2)).toBeCloseTo(0, 12);
    expect(varianceRatio([1, 1, -1, -1], 2)).toBeCloseTo(4 / 3, 12);
    const runs = runsTest([0.01, 0.02, -0.01, 0.03, -0.02, -0.01]);
    expect(runs).toMatchObject({ runs: 4, positives: 3, negatives: 3 });
    expect(runs.expected).toBeCloseTo(4, 12);
    expect(runs.variance).toBeCloseTo(1.2, 12);
    expect(runs.z).toBeCloseTo(0, 12);
    expect(runsTest([0.01, 0, 0.02, -0.01]).runs).toBe(2);
  });
  it('a pure random walk has lag-1 autocorrelation within 0.03 of 0 and VR(5) near 1', () => {
    expect(Math.abs(autocorrelation(rw))).toBeLessThan(3 / Math.sqrt(rw.length));
    expect(Math.abs(autocorrelation(rw, 5))).toBeLessThan(3 / Math.sqrt(rw.length));
    expect(Math.abs(varianceRatio(rw, 5) - 1)).toBeLessThan(0.1);
    expect(Math.abs(runsTest(rw).z!)).toBeLessThan(3);
  });
  it('a trend process (phi = 0.5) has positive autocorrelation, VR > 1 and too few runs', () => {
    expect(autocorrelation(trend)).toBeGreaterThan(0.45);
    expect(autocorrelation(trend)).toBeLessThan(0.55);
    expect(autocorrelation(trend, 2)).toBeGreaterThan(0.2); // about phi^2
    expect(varianceRatio(trend, 5)).toBeGreaterThan(2);
    expect(runsTest(trend).z!).toBeLessThan(-3);
  });
  it('rejects constant series and bad lags', () => {
    expect(() => autocorrelation([1, 1, 1])).toThrow(RangeError);
    expect(() => autocorrelation([1, 2], 2)).toThrow(RangeError);
    expect(() => varianceRatio([1, 2, 3], 1)).toThrow(RangeError);
    expect(() => runsTest([0, 0])).toThrow(RangeError);
  });
});

describe('momentum backtest versus buy and hold', () => {
  const returns = [0.1, 0.05, -0.02, -0.03, 0.04];
  it('hand values with a 1% cost per switch', () => {
    const b = momentumBacktest(returns, 1, 0.01);
    expect(b.positions).toEqual([0, 1, 1, 0, 0]);
    expect(b.trades).toBe(2);
    [0, 0.04, -0.02, -0.01, 0].forEach((r, i) => expect(b.strategyReturns[i]).toBeCloseTo(r, 12));
    expect(b.strategyWealth).toBeCloseTo(1.04 * 0.98 * 0.99, 12);
    expect(b.buyAndHoldWealth).toBeCloseTo(1.09 * 1.05 * 0.98 * 0.97 * 1.04, 12);
  });
  it('a higher cost never raises wealth; zero cost leaves buy and hold at the product of (1 + r)', () => {
    const r = logReturns(trendPrices({ ...base, steps: 500, phi: 0.3 })).map(Math.expm1);
    const w = [0, 0.001, 0.005, 0.02].map(c => momentumBacktest(r, 3, c).strategyWealth);
    for (let i = 1; i < w.length; i++) expect(w[i]).toBeLessThan(w[i - 1]);
    expect(momentumBacktest(returns, 2).buyAndHoldWealth).toBeCloseTo(1.1 * 1.05 * 0.98 * 0.97 * 1.04, 12);
    expect(() => momentumBacktest(returns, 5)).toThrow(RangeError);
    expect(() => momentumBacktest(returns, 1, 1)).toThrow(RangeError);
  });
});

describe('abnormal return and active alpha', () => {
  const fund = [0.02, 0.01, 0.03, 0.0];
  const index = [0.01, 0.01, 0.01, 0.01];
  it('hand values: alpha 0,5% per period, t = sqrt(0.6)', () => {
    [0.01, 0, 0.02, -0.01].forEach((ar, i) => expect(benchmarkAbnormalReturns(fund, index)[i]).toBeCloseTo(ar, 12));
    const a = activeAlpha(fund, index);
    expect(a.alpha).toBeCloseTo(0.005, 12);
    expect(a.trackingError).toBeCloseTo(Math.sqrt(0.0005 / 3), 12);
    expect(a.tStatistic).toBeCloseTo(Math.sqrt(0.6), 12);
  });
  it('alpha is shift-equivariant and t scales with sqrt(n) for a repeated sample', () => {
    expect(activeAlpha(fund.map(r => r + 0.01), index).alpha).toBeCloseTo(0.015, 12);
    const twice = activeAlpha([...fund, ...fund], [...index, ...index]);
    expect(twice.alpha).toBeCloseTo(0.005, 12);
    expect(twice.tStatistic).toBeGreaterThan(activeAlpha(fund, index).tStatistic);
    expect(() => activeAlpha([0.01], [0.0])).toThrow(RangeError);
    expect(() => activeAlpha(fund, index.slice(1))).toThrow(RangeError);
  });
});

describe('prospect theory', () => {
  it('hand values with Tversky-Kahneman 1992 parameters', () => {
    expect(prospectValue(100)).toBeCloseTo(57.543993733716, 9);
    expect(prospectValue(-100)).toBeCloseTo(-129.473985900860, 9);
    expect(prospectValue(0)).toBe(0);
    expect(probabilityWeight(0.5)).toBeCloseTo(0.420639354336, 9);
    expect(probabilityWeight(0.25, { ...TK1992, gamma: 0.5 })).toBeCloseTo(2 - Math.sqrt(3), 12);
  });
  it('value is concave for gains, convex for losses and steeper for losses', () => {
    for (let x = 1; x <= 1000; x *= 2) {
      expect(prospectValue(x) + prospectValue(3 * x)).toBeLessThan(2 * prospectValue(2 * x));
      expect(prospectValue(-x) + prospectValue(-3 * x)).toBeGreaterThan(2 * prospectValue(-2 * x));
      expect(-prospectValue(-x)).toBeGreaterThan(prospectValue(x));
      expect(prospectValue(x + 1) - prospectValue(x)).toBeLessThan(prospectValue(-x) - prospectValue(-x - 1));
    }
  });
  it('weighting fixes 0 and 1, overweights small and underweights large probabilities, and is increasing', () => {
    expect(probabilityWeight(0)).toBe(0);
    expect(probabilityWeight(1)).toBe(1);
    expect(probabilityWeight(0.01)).toBeGreaterThan(0.01);
    expect(probabilityWeight(0.99)).toBeLessThan(0.99);
    for (let p = 0.05; p < 1; p += 0.05) expect(probabilityWeight(p)).toBeGreaterThan(probabilityWeight(p - 0.05));
    expect(() => probabilityWeight(1.1)).toThrow(RangeError);
    expect(() => prospectValue(1, { ...TK1992, lambda: 0.5 })).toThrow(RangeError);
  });
  it('expected value vs prospect value of gambles', () => {
    expect(gambleExpectedValue([100, -100], [0.5, 0.5])).toBe(0);
    expect(gambleProspectValue([100, -100], [0.5, 0.5], linear)).toBeCloseTo(-50, 12); // loss aversion alone
    expect(gambleProspectValue([100, -100], [0.5, 0.5])).toBeCloseTo(-30.256585462564, 9); // fair bet rejected
    expect(gambleExpectedValue([5000, 0], [0.01, 0.99])).toBeCloseTo(50, 12);
    expect(gambleProspectValue([5000, 0], [0.01, 0.99])).toBeCloseTo(99.438075647811, 9); // lottery appeal
    expect(gambleProspectValue([30, 70], [0.4, 0.6], { ...linear, lambda: 1 })).toBeCloseTo(gambleExpectedValue([30, 70], [0.4, 0.6]), 12);
    expect(() => gambleProspectValue([1, 2], [0.5, 0.6])).toThrow(RangeError);
  });
});
