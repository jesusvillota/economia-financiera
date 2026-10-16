import { describe, expect, it } from 'vitest';
import { assertPositiveSemidefinite, isPositiveSemidefinite, solveLinear } from '../src/lib/finance/matrix';
import {
  covarianceFromCorrelations, diversificationTable, frontier, frontierPoint, globalMinimumVariance,
  minimumVarianceWeight, portfolioReturn, portfolioVariance, twoAssetReturn, twoAssetVariance, weightSweep,
} from '../src/lib/finance/portfolio';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const means = [0.14, 0.11, 0.09];
const correlations = [[1, 0.45, 0.30], [0.45, 1, 0.55], [0.30, 0.55, 1]];
const covariance = covarianceFromCorrelations([0.25, 0.18, 0.15], correlations);

describe('audited PS3 Exercises 1–3 (docs/audit/ps3.py)', () => {
  it.each([[1, 0.165], [0.5, 0.1431], [0, 0.1172], [-0.5, 0.0835], [-1, 0.015]])(
    'Ex 1a: equal weights, rho=%s', (rho, sigma) => {
      expect(twoAssetReturn(0.5, 0.12, 0.08)).toBeCloseTo(0.10, 12);
      expect(Math.sqrt(twoAssetVariance(0.5, 0.18, 0.15, rho))).toBeCloseTo(sigma, 4);
    });
  it('Ex 1c: minimum variance at rho=0.3', () => {
    const w = minimumVarianceWeight(0.18, 0.15, 0.3);
    expect(w).toBeCloseTo(0.3721, 4);
    expect(1 - w).toBeCloseTo(0.6279, 4);
    expect(twoAssetReturn(w, 0.12, 0.08)).toBeCloseTo(0.0949, 4);
    // The audit allows 1e-5 for rounded intermediate variances; retain that tolerance.
    expect(Math.abs(twoAssetVariance(w, 0.18, 0.15, 0.3) - 0.017148)).toBeLessThanOrEqual(1e-5);
    expect(twoAssetVariance(w, 0.18, 0.15, 0.3)).toBeCloseTo(0.017141860465116277, 12);
    expect(Math.sqrt(twoAssetVariance(w, 0.18, 0.15, 0.3))).toBeCloseTo(0.1309, 4);
  });
  it.each([
    [0.8, 4 / 15, 0.0927, 0.038719, 0.1968],
    [-0.2, 122 / 265, 0.0946, 0.017536, 0.1324],
  ])('Ex 2: audited rho=%s keeps the unrestricted and long-only answers', (rho, w, mean, variance, sigma) => {
    expect(minimumVarianceWeight(0.22, 0.20, rho)).toBeCloseTo(w, 12);
    expect(minimumVarianceWeight(0.22, 0.20, rho, true)).toBeCloseTo(w, 12);
    expect(twoAssetReturn(w, 0.10, 0.09)).toBeCloseTo(mean, 4);
    expect(Math.abs(twoAssetVariance(w, 0.22, 0.20, rho) - variance)).toBeLessThanOrEqual(1e-5);
    expect(twoAssetVariance(w, 0.22, 0.20, rho)).toBeCloseTo(rho === 0.8 ? 0.03872 : 0.017533584905660378, 12);
    expect(Math.sqrt(twoAssetVariance(w, 0.22, 0.20, rho))).toBeCloseTo(sigma, 4);
  });
  it('DEC-003: separately named Ex 2 rho=0.95 short-sale variant', () => {
    const unrestricted = minimumVarianceWeight(0.22, 0.20, 0.95);
    expect(unrestricted).toBeCloseTo(-0.375, 12);
    expect(unrestricted).toBeLessThan(0);
    expect(minimumVarianceWeight(0.22, 0.20, 0.95, true)).toBe(0);
    const c = covarianceFromCorrelations([0.22, 0.20], [[1, 0.95], [0.95, 1]]);
    expect(globalMinimumVariance([0.10, 0.09], c).weights[0]).toBeCloseTo(-0.375, 12);
    expect(globalMinimumVariance([0.10, 0.09], c, true).weights).toEqual([0, 1]);
  });
  it('Ex 3: three-asset mean, covariance entries and risk', () => {
    expect(portfolioReturn([0.4, 0.35, 0.25], means)).toBeCloseTo(0.117, 12);
    expect(covariance[0][1]).toBeCloseTo(0.02025, 12);
    expect(covariance[0][2]).toBeCloseTo(0.01125, 12);
    expect(covariance[1][2]).toBeCloseTo(0.01485, 12);
    expect(portfolioVariance([0.4, 0.35, 0.25], covariance)).toBeCloseTo(0.025894, 6);
    expect(Math.sqrt(portfolioVariance([0.4, 0.35, 0.25], covariance))).toBeCloseTo(0.1609, 4);
  });
});

describe('two-asset properties over deterministic grids', () => {
  it.each([[0.18, 0.15], [0.22, 0.20], [0.01, 0.9], [0, 0.2]])(
    'rho=1 gives linear sigma on [0,1] for sigma=(%s,%s)', (s1, s2) => {
      for (let i = 0; i <= 20; i++) {
        const w = i / 20;
        expect(Math.sqrt(twoAssetVariance(w, s1, s2, 1))).toBeCloseTo(w * s1 + (1 - w) * s2, 12);
      }
    });
  it.each([[0.18, 0.15], [0.22, 0.20], [0.01, 0.9], [0, 0.2]])(
    'rho=-1 reaches zero sigma for sigma=(%s,%s)', (s1, s2) => {
      const w = minimumVarianceWeight(s1, s2, -1);
      expect(w).toBeCloseTo(s2 / (s1 + s2), 12);
      expect(twoAssetVariance(w, s1, s2, -1)).toBe(0);
    });
  it('perfect positive correlation gives absolute linear sigma under short sales', () => {
    expect(Math.sqrt(twoAssetVariance(-2, 0.3, 0.1, 1))).toBeCloseTo(0.3, 12);
  });
  it('equal-risk and zero-risk degeneracies have finite minimizers', () => {
    expect(minimumVarianceWeight(0.2, 0.2, 1)).toBe(0.5);
    expect(minimumVarianceWeight(0, 0, -1)).toBe(0.5);
    expect(minimumVarianceWeight(0, 0.2, 0)).toBe(1);
    expect(minimumVarianceWeight(0.2, 0, 0)).toBe(0);
    expect(minimumVarianceWeight(0.2, 0.22, 0.95)).toBeCloseTo(1.375, 12);
    expect(minimumVarianceWeight(0.2, 0.22, 0.95, true)).toBe(1);
  });
  it('weight sweep includes endpoints and preserves full investment', () => {
    const points = weightSweep([0.12, 0.08], [0.18, 0.15], 0.3, -0.5, 1.5, 20);
    expect(points).toHaveLength(21);
    expect(points[0].weights).toEqual([-0.5, 1.5]);
    expect(points.at(-1)!.weights).toEqual([1.5, -0.5]);
    for (const p of points) {
      expect(sum(p.weights)).toBeCloseTo(1, 12);
      expect(p.sigma ** 2).toBeCloseTo(p.variance, 12);
    }
  });
  it('diversification table follows increasing correlation risk', () => {
    const table = diversificationTable(0.18, 0.15, [-1, -0.5, 0, 0.5, 1]);
    expect(table.map(row => row.correlation)).toEqual([-1, -0.5, 0, 0.5, 1]);
    expect(table[0].sigma).toBeCloseTo(0.015, 12);
    expect(table[4].sigma).toBeCloseTo(0.165, 12);
    table.slice(1).forEach((row, i) => expect(row.variance).toBeGreaterThan(table[i].variance));
  });
});

describe('n-asset minima and frontier', () => {
  it('independent assets have inverse-variance GMV weights', () => {
    const p = globalMinimumVariance([0.1, 0.2], [[0.04, 0], [0, 0.09]]);
    expect(p.weights[0]).toBeCloseTo(9 / 13, 12);
    expect(p.weights[1]).toBeCloseTo(4 / 13, 12);
    expect(p.variance).toBeCloseTo(0.36 / 13, 12);
  });
  it('closed-form target portfolio agrees with a hand solution', () => {
    const p = frontierPoint([0.1, 0.2], [[0.04, 0], [0, 0.09]], 0.15);
    expect(p.weights[0]).toBeCloseTo(0.5, 12);
    expect(p.weights[1]).toBeCloseTo(0.5, 12);
    expect(p.variance).toBeCloseTo(0.0325, 12);
    expect(p.expectedReturn).toBeCloseTo(0.15, 12);
  });
  it.each([false, true])('frontier risk never falls below GMV; longOnly=%s', longOnly => {
    const gmv = globalMinimumVariance(means, covariance, longOnly);
    const targets = Array.from({ length: 21 }, (_, i) => 0.09 + i * 0.0025);
    const points = frontier(means, covariance, targets, longOnly);
    expect(sum(gmv.weights)).toBeCloseTo(1, 12);
    points.forEach((p, i) => {
      expect(sum(p.weights)).toBeCloseTo(1, 10);
      expect(p.expectedReturn).toBeCloseTo(targets[i], 10);
      expect(p.variance).toBeGreaterThanOrEqual(gmv.variance - 1e-12);
      expect(p.branch).toBe(targets[i] < gmv.expectedReturn - 1e-10 ? 'inefficient' : 'efficient');
      if (longOnly) expect(p.weights.every(w => w >= 0)).toBe(true);
    });
  });
  it('GMV is stationary to all full-investment perturbations', () => {
    const p = globalMinimumVariance(means, covariance);
    for (let i = 0; i < 3; i++) {
      for (const step of [-0.2, -0.01, 0.01, 0.2]) {
        const w = [...p.weights];
        w[i] += step;
        w[(i + 1) % 3] -= step;
        expect(portfolioVariance(w, covariance)).toBeGreaterThanOrEqual(p.variance - 1e-12);
      }
    }
  });
  it('long-only active sets find the boundary optimum without changing target return', () => {
    // For independent assets, target 1.9 forces asset 0 out: [0, .1, .9].
    const p = frontierPoint([0, 1, 2], [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 1.9, true);
    expect(p.weights[0]).toBe(0);
    expect(p.weights[1]).toBeCloseTo(0.1, 12);
    expect(p.weights[2]).toBeCloseTo(0.9, 12);
    expect(p.expectedReturn).toBeCloseTo(1.9, 12);
    expect(p.variance).toBeCloseTo(0.82, 12);
  });
  it('supports four assets and multiple excluded assets', () => {
    const r = [0.1, 0.2, 0.3, 0.4];
    const c = r.map((_, i) => r.map((_, j) => i === j ? 1 : 0));
    const gmv = globalMinimumVariance(r, c);
    gmv.weights.forEach(w => expect(w).toBeCloseTo(0.25, 12));
    frontierPoint(r, c, 0.2).weights.forEach((w, i) => expect(w).toBeCloseTo((4 - i) / 10, 12));
    const edge = frontierPoint(r, c, 0.39, true);
    edge.weights.forEach((w, i) => expect(w).toBeCloseTo([0, 0, 0.1, 0.9][i], 12));
    expect(edge.expectedReturn).toBeCloseTo(0.39, 12);
  });
  it('long-only target minimum beats an independent feasible weight grid', () => {
    // Gram matrices BᵀB are PSD by construction. Grid weights meet return=1 exactly.
    for (const b of [
      [[1, 0.2, -0.4], [0.1, 2, 0.3], [0.5, -0.2, 1]],
      [[0.2, 1, 0.5], [1, -0.4, 0.3], [-0.3, 0.5, 2]],
      [[1, 2, 3], [0, 0.1, 1], [0.1, 0, 0]],
    ]) {
      const c = b.map((_, i) => b.map((_, j) => sum(b.map(row => row[i] * row[j]))));
      const optimum = frontierPoint([0, 1, 2], c, 1, true);
      expect(sum(optimum.weights)).toBeCloseTo(1, 12);
      expect(optimum.expectedReturn).toBeCloseTo(1, 12);
      for (let i = 0; i <= 50; i++) {
        const w = i / 100;
        expect(optimum.variance).toBeLessThanOrEqual(portfolioVariance([w, 1 - 2 * w, w], c) + 1e-12);
      }
    }
  });
  it('long-only endpoint targets and infeasible targets are explicit', () => {
    frontierPoint(means, covariance, 0.14, true).weights.forEach((w, i) => expect(w).toBeCloseTo(i === 0 ? 1 : 0, 12));
    frontierPoint(means, covariance, 0.09, true).weights.forEach((w, i) => expect(w).toBeCloseTo(i === 2 ? 1 : 0, 12));
    expect(() => frontierPoint(means, covariance, 0.15, true)).toThrow(/Infeasible/);
    expect(() => frontierPoint(means, covariance, 0.08, true)).toThrow(/Infeasible/);
    expect(frontierPoint(means, covariance, 0.2).expectedReturn).toBeCloseTo(0.2, 12);
  });
  it('equal expected returns reduce to the GMV problem', () => {
    const c = [[0.04, 0], [0, 0.09]];
    expect(frontierPoint([0.1, 0.1], c, 0.1).weights[0]).toBeCloseTo(9 / 13, 12);
    expect(() => frontierPoint([0.1, 0.1], c, 0.2)).toThrow(/Infeasible/);
  });
  it('one-asset and singular PSD portfolios are supported', () => {
    expect(globalMinimumVariance([0.1], [[0.04]]).weights).toEqual([1]);
    expect(frontierPoint([0.1], [[0.04]], 0.1, true).variance).toBeCloseTo(0.04, 12);
    expect(() => frontierPoint([0.1], [[0.04]], 0.2)).toThrow();
    const c = [[0.04, -0.04], [-0.04, 0.04]];
    expect(globalMinimumVariance([0.1, 0.2], c).variance).toBe(0);
    expect(frontierPoint([0.1, 0.2], c, 0.15, true).variance).toBe(0);
    expect(globalMinimumVariance([0.1, 0.2], [[0, 0], [0, 0]], true).variance).toBe(0);
    expect(globalMinimumVariance([0.1, 0.2], [[0.04, 0.04], [0.04, 0.04]]).variance).toBeCloseTo(0.04, 12);
  });
  it('singular covariance with unequal risks has unrestricted zero risk and a long-only boundary', () => {
    const c = covarianceFromCorrelations([0.2, 0.1], [[1, 1], [1, 1]]);
    expect(globalMinimumVariance([0.2, 0.1], c).variance).toBe(0);
    expect(globalMinimumVariance([0.2, 0.1], c).weights[0]).toBeCloseTo(-1, 12);
    expect(globalMinimumVariance([0.2, 0.1], c, true).weights).toEqual([0, 1]);
    expect(frontierPoint([0.2, 0.1], c, 0.15, true).variance).toBeCloseTo(0.0225, 12);
  });
  it('flat-risk frontiers use the highest-return long-only minimum and detect unrestricted dominance', () => {
    const c = [[0.04, 0.04], [0.04, 0.04]];
    expect(globalMinimumVariance([0.1, 0.2], c, true).weights).toEqual([0, 1]);
    expect(frontierPoint([0.1, 0.2], c, 0.15, true).branch).toBe('inefficient');
    expect(frontierPoint([0.1, 0.2], c, 0.2, true).branch).toBe('efficient');
    expect(frontierPoint([0.1, 0.2], c, 0.3).branch).toBe('inefficient');
    expect(frontierPoint([0.1, 0.2], [[0, 0], [0, 0]], 0.3).branch).toBe('inefficient');
  });
  it('asset order and covariance scale do not affect optimal allocation', () => {
    const p = globalMinimumVariance(means, covariance);
    const reverse = globalMinimumVariance([...means].reverse(), [...covariance].reverse().map(row => [...row].reverse()));
    const small = globalMinimumVariance(means, covariance.map(row => row.map(x => x * 1e-16)));
    p.weights.forEach((w, i) => {
      expect(reverse.weights[2 - i]).toBeCloseTo(w, 12);
      expect(small.weights[i]).toBeCloseTo(w, 12);
    });
    expect(small.variance / p.variance).toBeCloseTo(1e-16, 25);
  });
  it('does not mutate input vectors or matrices', () => {
    const before = JSON.stringify({ means, covariance, correlations });
    frontier(means, covariance, [0.10, 0.12], true);
    globalMinimumVariance(means, covariance);
    expect(JSON.stringify({ means, covariance, correlations })).toBe(before);
  });
});

describe('matrix validation and invalid inputs', () => {
  it('rejects a non-PSD correlation matrix despite valid individual correlations', () => {
    const bad = [[1, 0.9, 0.9], [0.9, 1, -0.9], [0.9, -0.9, 1]];
    expect(isPositiveSemidefinite(bad)).toBe(false);
    expect(() => covarianceFromCorrelations([0.2, 0.3, 0.4], bad)).toThrow(/PSD/);
    expect(() => covarianceFromCorrelations([0, 0, 0], bad)).toThrow(/PSD/);
    expect(() => portfolioVariance([1, 0, 0], bad)).toThrow(/PSD/);
    expect(() => globalMinimumVariance(means, bad)).toThrow(/PSD/);
    expect(() => frontierPoint(means, bad, 0.12, true)).toThrow(/PSD/);
  });
  it('PSD validation includes singular matrices and rejects zero-diagonal off-diagonal risk', () => {
    expect(isPositiveSemidefinite([[1, 1], [1, 1]])).toBe(true);
    expect(isPositiveSemidefinite([[1, -1], [-1, 1]])).toBe(true);
    expect(isPositiveSemidefinite([[0, 0], [0, 0]])).toBe(true);
    expect(isPositiveSemidefinite([[0, 0.1], [0.1, 1]])).toBe(false);
    expect(isPositiveSemidefinite([[-1]])).toBe(false);
    expect(isPositiveSemidefinite([[1, 0, 0], [0, 0, 0.1], [0, 0.1, 0]])).toBe(false);
  });
  it.each([[], [[1, 2]], [[1, 0.2], [0.1, 1]], [[NaN]], [[Infinity]]].map(matrix => ({ matrix })))('rejects malformed matrices: $matrix', ({ matrix }) => {
    expect(() => assertPositiveSemidefinite(matrix)).toThrow(RangeError);
  });
  it('rank-aware solver handles unique, singular and inconsistent systems', () => {
    expect(solveLinear([[2, 0], [0, 4]], [6, 8])).toEqual([3, 2]);
    expect(solveLinear([[1, 1], [2, 2]], [3, 6])).toEqual([3, 0]);
    expect(solveLinear([[1, 1], [2, 2]], [3, 7])).toBeNull();
    expect(() => solveLinear([[1]], [])).toThrow();
  });
  it('rejects invalid asset inputs, weights, correlations, targets and sweeps', () => {
    expect(() => portfolioReturn([0.3, 0.3], [0.1, 0.2])).toThrow(/sum to 1/);
    expect(() => portfolioReturn([1], [0.1, 0.2])).toThrow();
    expect(() => portfolioReturn([1], [NaN])).toThrow();
    expect(() => portfolioVariance([Infinity], [[1]])).toThrow();
    expect(() => globalMinimumVariance([0.1], covariance)).toThrow();
    expect(() => covarianceFromCorrelations([0.2], [[2]])).toThrow();
    expect(() => covarianceFromCorrelations([-0.2], [[1]])).toThrow();
    expect(() => covarianceFromCorrelations([0.2, 0.3], [[1]])).toThrow();
    expect(() => minimumVarianceWeight(-0.2, 0.3, 0)).toThrow();
    expect(() => minimumVarianceWeight(0.2, 0.3, NaN)).toThrow();
    expect(() => twoAssetVariance(0.5, 0.2, 0.3, 1.01)).toThrow();
    expect(() => frontierPoint(means, covariance, NaN)).toThrow();
    expect(() => weightSweep([0.1, 0.2], [0.2, 0.3], 0, 0, 1, 0)).toThrow();
    expect(() => weightSweep([0.1, 0.2], [0.2, 0.3], 0, 1, 0)).toThrow();
  });
});
