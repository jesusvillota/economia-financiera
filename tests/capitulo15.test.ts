import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { randomWalkPrices, trendPrices, logReturns, simpleReturns, autocorrelation, varianceRatio, momentumBacktest } from '../src/lib/finance/efficiency';
import { marketModelAbnormalReturns, cumulativeAbnormalReturn } from '../src/lib/finance/eventStudy';

const chapter = readFileSync('src/content/chapters/15-eficiencia.mdx', 'utf8');
const options = { p0: 100, drift: 0.0005, sigma: 0.02, steps: 120, seed: 42 };
const market = [-0.01, 0.005, 0.01, -0.005, 0];
const observed = [-0.013, 0.009, 0.028, -0.007, 0.001];
const ar = marketModelAbnormalReturns(observed, market, 0.001, 1.2);
const pct = (x: number) => `${(100 * x).toFixed(2).replace('.', ',')} %`;

describe('capítulo 15: todas las cifras del texto y convenciones de sus fórmulas', () => {
  it('keeps the six sections, prerequisite, session policy and three quizzes', () => {
    expect([...chapter.matchAll(/<span class="section-tag">([^<]+)<\/span>/g)].map(m => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter).toContain('prerequisites: [11]');
    expect(chapter).toContain('sessions: []');
    expect(chapter.match(/<Quiz /g)).toHaveLength(3);
    expect(chapter).toContain('chapter: 15');
    expect(chapter).toContain('part: 4');
    expect(chapter).toContain('difficulty: 2');
  });
  it('initial 100 €, 120 sessions, 0.05 % drift, 2 % shock, seed 42 reproduce both paths', () => {
    const walk = randomWalkPrices(options);
    const trend = trendPrices({ ...options, phi: 0.5 });
    expect(walk).toHaveLength(121);
    expect(walk[0]).toBe(100);
    expect(trend[0]).toBe(100);
    expect(randomWalkPrices(options)).toEqual(walk);
    expect(trendPrices({ ...options, phi: 0.5 })).toEqual(trend);
    expect(trendPrices({ ...options, phi: 0 })).toEqual(walk);
    expect(randomWalkPrices({ ...options, seed: 43 })).not.toEqual(walk);
    for (const token of ['100 €', '120 sesiones', '0,05 %', '2 %', '42', '\\phi=0']) expect(chapter).toContain(token);
    expect(autocorrelation(logReturns(walk))).not.toBe(0);
    expect(autocorrelation(logReturns(trend))).toBeGreaterThan(autocorrelation(logReturns(walk)));
  });
  it('log-price identity and zero-drift unit-scale shocks match the simulation equation', () => {
    const shocks = logReturns(randomWalkPrices({ ...options, p0: 1, drift: 0, sigma: 1 }));
    const prices = trendPrices({ ...options, phi: 0.5 });
    const logs = logReturns(prices);
    logs.forEach((r, t) => {
      expect(r).toBeCloseTo(options.drift + 0.5 * ((t ? logs[t - 1] : options.drift) - options.drift) + options.sigma * shocks[t], 12);
      expect(prices[t + 1]).toBeCloseTo(prices[t] * Math.exp(r), 12);
      expect(simpleReturns(prices)[t]).toBeCloseTo(Math.expm1(r), 12);
    });
  });
  it('sample autocorrelation formula uses lag 1 and full-series centered denominator', () => {
    // mean 0: adjacent products -1 -1 -1, total squares 4.
    expect(autocorrelation([1, -1, 1, -1], 1)).toBe(-0.75);
    expect(chapter).toContain('t=2');
    expect(chapter).toContain('\\widehat\\rho_1');
  });
  it('VR uses overlapping q sums around q times the mean, with n and window-count divisors', () => {
    // mean 0; q=2 sums [0,0,0], so VR=0; q=3 sums [1,-1], VR=1/3.
    expect(varianceRatio([1, -1, 1, -1], 2)).toBe(0);
    expect(varianceRatio([1, -1, 1, -1], 3)).toBeCloseTo(1 / 3, 14);
    const independentPopulation = [-1, 1].flatMap(a => [-1, 1].map(b => a + b));
    expect(independentPopulation.reduce((s, x) => s + x * x, 0) / 4 / (2 * 1)).toBe(1);
  });
  it('5 previous sessions, 0.10 % cost: weights are 0/1, cash starts at 1 and each switch is charged', () => {
    const returns = simpleReturns(randomWalkPrices(options));
    const backtest = momentumBacktest(returns, 5, 0.001);
    expect(backtest.positions.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
    let wealth = 1;
    backtest.positions.forEach((w, t) => {
      const expected = t >= 5 && returns.slice(t - 5, t).reduce((s, r) => s + r, 0) > 0 ? 1 : 0;
      expect(w).toBe(expected);
      const previous = t ? backtest.positions[t - 1] : 0;
      expect(backtest.strategyReturns[t]).toBeCloseTo(w * returns[t] - 0.001 * Math.abs(w - previous), 14);
      wealth *= 1 + backtest.strategyReturns[t];
    });
    expect(backtest.strategyWealth).toBeCloseTo(wealth, 14);
    expect(momentumBacktest(returns, 5, 0.01).strategyWealth).toBeLessThan(backtest.strategyWealth);
    expect(momentumBacktest(returns, 5, 0).buyAndHoldWealth).toBeCloseTo(randomWalkPrices(options).at(-1)! / 100, 12);
    for (const token of ['5 sesiones', '0,10 %', 'unidad de riqueza', 'c\\lvert w_t-w_{t-1}\\rvert']) expect(chapter).toContain(token);
  });
  it('new simple-return helper rejects incomplete, nonpositive and nonfinite price series', () => {
    expect(simpleReturns([100, 110, 99])).toEqual([expect.closeTo(0.1, 14), expect.closeTo(-0.1, 14)]);
    for (const prices of [[100], [0, 100], [-1, 100], [100, NaN], [100, Infinity]]) {
      expect(() => simpleReturns(prices)).toThrow(RangeError);
    }
  });
  it('event panel and quiz: announcement 1.50 %, full window 1.30 %, posterior -0.20 %', () => {
    expect(pct(ar[2])).toBe('1,50 %');
    expect(pct(cumulativeAbnormalReturn(ar))).toBe('1,30 %');
    expect(pct(cumulativeAbnormalReturn(ar, 2, 2))).toBe('1,50 %');
    expect(pct(cumulativeAbnormalReturn(ar, 3, 4))).toBe('-0,20 %');
    for (const token of ['1,50 %', '1,30 %', '−0,20 %']) expect(chapter).toContain(token);
  });
  it('audit note 08 §3.1: abnormal returns are signed, not only superior returns', () => {
    expect(ar[3]).toBeCloseTo(-0.002, 14);
    expect(marketModelAbnormalReturns([0.01], [0.01], 0, 1)).toEqual([0]);
    expect(ar[2]).toBeCloseTo(0.015, 14);
    expect(chapter).toContain('El **AR** resta el rendimiento normal al observado');
  });
});
