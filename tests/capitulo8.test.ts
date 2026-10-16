import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  covarianceFromCorrelations, frontierPoint, globalMinimumVariance, portfolioReturn, portfolioVariance,
} from '../src/lib/finance/portfolio';

const chapter = readFileSync('src/content/chapters/08-markowitz.mdx', 'utf8');
const returns = [0.06, 0.10, 0.14];
const sigmas = [0.12, 0.20, 0.28];
const covariance = covarianceFromCorrelations(sigmas, [[1, 0.2, 0], [0.2, 1, 0], [0, 0, 1]]);
const pct = (value: number) => (100 * value).toFixed(2).replace('.', ',');
const risk = (w: number[]) => Math.sqrt(portfolioVariance(w, covariance));
const minimum = globalMinimumVariance(returns, covariance, true);

// Couple printed numbers to actual calculations, including both prose and TeX representations.
function printed(value: string) {
  expect(chapter.replaceAll('{,}', ',')).toContain(value);
}

describe('capítulo 8: every numeric example and claim', () => {
  it('three annual asset means, volatilities and all nine covariance entries', () => {
    expect(returns).toHaveLength(3);
    for (let j = 0; j < 3; j++) {
      const weights = returns.map((_, k) => Number(j === k));
      expect(portfolioReturn(weights, returns)).toBe(returns[j]);
      expect(risk(weights)).toBeCloseTo(sigmas[j], 14);
      printed(`${(returns[j] * 100).toFixed(0)} %`);
      printed(`${(sigmas[j] * 100).toFixed(0)} %`);
    }
    const entries = [[0.0144, 0.0048, 0], [0.0048, 0.0400, 0], [0, 0, 0.0784]];
    entries.forEach((row, j) => row.forEach((value, k) => expect(covariance[j][k]).toBeCloseTo(value, 14)));
    for (const value of ['0,20', '0,0144', '0,0048', '0,0400', '0,0784']) printed(value);
    expect(covariance[0][2]).toBe(0);
    expect(covariance[1][2]).toBe(0);
  });

  it('initial 50/25/25 mix: mean 9 %, variance 0.0122, risk 11.05 %', () => {
    const w = [0.5, 0.25, 0.25];
    expect(portfolioReturn(w, [1, 1, 1])).toBe(1);
    expect(portfolioReturn(w, returns)).toBeCloseTo(0.09, 14);
    expect(portfolioVariance(w, covariance)).toBeCloseTo(0.0122, 14);
    expect(risk(w)).toBeCloseTo(0.1105, 4);
    expect(pct(risk(w))).toBe('11,05');
    for (const value of ['50 %', '25 %', '9 %', '0,50', '0,25', '0,06', '0,10', '0,14', '0,09', '0,0122', '0,1105', '11,05 %']) printed(value);
    // The two off-diagonal covariance terms are both present in the text's expansion.
    const diagonal = w.reduce((sum, weight, j) => sum + weight ** 2 * covariance[j][j], 0);
    expect(diagonal + 2 * w[0] * w[1] * covariance[0][1]).toBeCloseTo(portfolioVariance(w, covariance), 14);
    printed('2\\cdot0,50\\cdot0,25\\cdot0,0048');
  });

  it('playground 25/37.50/37.50 mix: mean 10.50 %, risk 13.58 %', () => {
    const w = [0.25, 0.375, 0.375];
    expect(portfolioReturn(w, [1, 1, 1])).toBe(1);
    expect(pct(portfolioReturn(w, returns))).toBe('10,50');
    expect(pct(risk(w))).toBe('13,58');
    for (const value of ['37,50 %', '10,50 %', '13,58 %']) printed(value);
  });

  it('global minimum: weights 67.88/18.51/13.60 %, mean 7.83 %, risk 10.33 %', () => {
    expect(minimum.weights.map(pct)).toEqual(['67,88', '18,51', '13,60']);
    expect(pct(minimum.expectedReturn)).toBe('7,83');
    expect(pct(minimum.sigma)).toBe('10,33');
    for (const value of [...minimum.weights.map(pct), pct(minimum.expectedReturn), pct(minimum.sigma)]) printed(`${value} %`);
    // Printed weights sum to 99.99 %, as the rounding caveat explains.
    expect(minimum.weights.reduce((sum, w) => sum + w, 0)).toBeCloseTo(1, 14);
  });

  it('lower target is dominated by the global minimum (audit note 03 §3)', () => {
    const lower = frontierPoint(returns, covariance, 0.07, true);
    expect(lower.expectedReturn).toBeCloseTo(0.07, 14);
    expect(pct(lower.sigma)).toBe('10,68');
    expect(lower.branch).toBe('inefficient');
    expect(minimum.expectedReturn).toBeGreaterThan(lower.expectedReturn);
    expect(minimum.sigma).toBeLessThan(lower.sigma);
    printed('7 %'); printed('10,68 %');
    // This counterexample also covers the second quiz's explanation.
  });

  it('9 % efficient target: weights 48.63/27.74/23.63 %, variance 0.012156, risk 11.03 %', () => {
    const best = frontierPoint(returns, covariance, 0.09, true);
    expect(best.weights.map(pct)).toEqual(['48,63', '27,74', '23,63']);
    expect(best.variance.toFixed(6)).toBe('0.012156');
    expect(pct(best.sigma)).toBe('11,03');
    expect(best.branch).toBe('efficient');
    expect(best.variance).toBeLessThan(portfolioVariance([0.5, 0.25, 0.25], covariance));
    for (const value of [...best.weights.map(pct), pct(best.sigma)]) printed(`${value} %`);
    printed('0,012156');
  });

  it('no shorts: maximum mean 14 %, short-sale example −100/0/200 gives 22 %', () => {
    expect(frontierPoint(returns, covariance, 0.14, true).weights).toEqual([0, 0, 1]);
    expect(() => frontierPoint(returns, covariance, 0.18, true)).toThrow(RangeError);
    expect(portfolioReturn([-1, 0, 2], returns)).toBeCloseTo(0.22, 14);
    expect(portfolioReturn([-2, 0, 3], returns)).toBeGreaterThan(0.22);
    for (const value of ['−100 %', '200 %', '22 %']) printed(value);
    // Third quiz: enumerate the widget's full long-only grid to verify the mean bound.
    for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20 - a; b++) {
      const mean = portfolioReturn([a / 20, b / 20, (20 - a - b) / 20], returns);
      expect(mean).toBeGreaterThanOrEqual(0.06 - 1e-12);
      expect(mean).toBeLessThanOrEqual(0.14 + 1e-12);
    }
  });

  it('18 % unrestricted target: A = −99.32 %; disabling shorts clamps to 14 %', () => {
    const point = frontierPoint(returns, covariance, 0.18, false);
    expect(point.expectedReturn).toBeCloseTo(0.18, 14);
    expect(pct(point.weights[0])).toBe('-99,32');
    printed('18 %'); printed('−99,32 %');
    const clamped = frontierPoint(returns, covariance, Math.min(0.18, Math.max(...returns)), true);
    expect(clamped.weights).toEqual([0, 0, 1]);
  });

  it('the changing A–B correlation keeps the three-asset matrix valid, including its endpoints', () => {
    for (const rho of [-1, 0, 0.2, 0.95, 1]) {
      const matrix = covarianceFromCorrelations(sigmas, [[1, rho, 0], [rho, 1, 0], [0, 0, 1]]);
      expect(portfolioVariance([0.5, 0.25, 0.25], matrix)).toBeGreaterThanOrEqual(0);
      expect(frontierPoint(returns, matrix, 0.09, true).expectedReturn).toBeCloseTo(0.09, 14);
    }
  });

  it('six ordered sections, three quizzes, no link to an unpublished session', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map(m => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('sessions: []');
    expect(chapter).toContain('prerequisites: [7]');
  });
});
