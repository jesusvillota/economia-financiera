import { describe, expect, it } from 'vitest';
import {
  alpha, beta, capitalAllocationLine, capitalMarketLine, mispricing, portfolioBeta,
  riskDecomposition, riskFreeMix, securityMarketLine, separationAllocation, sharpeRatio, tangentPortfolio,
} from '../src/lib/finance/capm';
import {
  covarianceFromCorrelations, globalMinimumVariance, portfolioReturn, portfolioVariance, twoAssetReturn, twoAssetVariance,
} from '../src/lib/finance/portfolio';

describe('audited PS3 Exercises 4–7 (docs/audit/ps3_findings.md)', () => {
  it('Ex 4a–d: lending, borrowing, CAL and Sharpe', () => {
    const lending = riskFreeMix(0.04, 0.13, 0.18, 0.6);
    expect(lending.expectedReturn).toBeCloseTo(0.094, 12);
    expect(lending.variance).toBeCloseTo(0.011664, 12);
    expect(lending.sigma).toBeCloseTo(0.108, 12);
    expect(lending.riskFreeWeight).toBeCloseTo(0.4, 12);
    const borrowing = riskFreeMix(0.04, 0.13, 0.18, 1.2);
    expect(borrowing.expectedReturn).toBeCloseTo(0.148, 12);
    expect(borrowing.variance).toBeCloseTo(0.046656, 12);
    expect(borrowing.sigma).toBeCloseTo(0.216, 12);
    expect(borrowing.riskFreeWeight).toBeCloseTo(-0.2, 12);
    expect(sharpeRatio(0.13, 0.04, 0.18)).toBeCloseTo(0.5, 12);
    expect(capitalAllocationLine(0.04, 0.13, 0.18, 0.12)).toBeCloseTo(0.10, 12);
  });
  it('Ex 4e: target volatility of 12%', () => {
    const p = separationAllocation(0.04, 0.13, 0.18, { sigma: 0.12 });
    expect(p.riskyWeight).toBeCloseTo(2 / 3, 12);
    expect(p.riskFreeWeight).toBeCloseTo(1 / 3, 12);
    expect(p.expectedReturn).toBeCloseTo(0.10, 12);
    expect(p.sigma).toBeCloseTo(0.12, 12);
    expect(separationAllocation(0.04, 0.13, 0.18, { expectedReturn: 0.10 }).riskyWeight).toBeCloseTo(2 / 3, 12);
  });
  it.each([
    ['X', 0.0028, 1.75, 0.16625, 0.14, -0.02625],
    ['Y', 0.0012, 0.75, 0.09125, 0.06, -0.03125],
    ['Z', 0.0036, 2.25, 0.20375, 0.15, -0.05375],
  ] as const)('Ex 5: %s beta, required return and overpricing', (_, covariance, b, required, observed, excess) => {
    expect(beta(covariance, 0.0016)).toBeCloseTo(b, 12);
    expect(securityMarketLine(0.035, 0.11, b)).toBeCloseTo(required, 12);
    expect(alpha(observed, 0.035, 0.11, b)).toBeCloseTo(excess, 12);
    expect(mispricing(observed, 0.035, 0.11, b).pricing).toBe('overpriced');
  });
  it('Ex 6: both portfolio betas and CAPM returns', () => {
    const betas = [0.8, 1.2, 1.5, 0.6];
    const original = portfolioBeta([0.25, 0.30, 0.20, 0.25], betas);
    const revised = portfolioBeta([0.30, 0.25, 0.25, 0.20], betas);
    expect(original).toBeCloseTo(1.01, 12);
    expect(revised).toBeCloseTo(1.035, 12);
    expect(securityMarketLine(0.03, 0.10, original)).toBeCloseTo(0.1007, 12);
    expect(securityMarketLine(0.03, 0.10, revised)).toBeCloseTo(0.10245, 12);
    expect(revised).toBeGreaterThan(original);
  });
  it('Ex 7a–d: corrected equal-weight risk and minimum-variance Sharpe', () => {
    const covariance = covarianceFromCorrelations([0.20, 0.16], [[1, 0.35], [0.35, 1]]);
    const minimum = globalMinimumVariance([0.12, 0.09], covariance);
    expect(twoAssetReturn(0.5, 0.12, 0.09)).toBeCloseTo(0.105, 12);
    expect(twoAssetVariance(0.5, 0.20, 0.16, 0.35)).toBeCloseTo(0.022, 12);
    // Audit correction: 14.83%, not the source's 14.87%.
    expect(Math.sqrt(twoAssetVariance(0.5, 0.20, 0.16, 0.35))).toBeCloseTo(0.14832396974191325, 12);
    expect(minimum.weights[0]).toBeCloseTo(1 / 3, 12);
    expect(minimum.weights[1]).toBeCloseTo(2 / 3, 12);
    expect(minimum.expectedReturn).toBeCloseTo(0.10, 12);
    expect(minimum.variance).toBeCloseTo(0.0208, 12);
    expect(minimum.sigma).toBeCloseTo(0.14422205101855956, 12);
    // Exact arithmetic gives 0.48536..., rounded to the audit's 0.4854.
    expect(sharpeRatio(minimum.expectedReturn, 0.03, minimum.sigma)).toBeCloseTo(0.4853626716970755, 12);
    expect(sharpeRatio(minimum.expectedReturn, 0.03, minimum.sigma)).toBeCloseTo(0.4854, 4);
  });
  it('Ex 7e: required returns and small negative alphas', () => {
    expect(securityMarketLine(0.03, 0.10, 1.3)).toBeCloseTo(0.121, 12);
    expect(securityMarketLine(0.03, 0.10, 0.9)).toBeCloseTo(0.093, 12);
    expect(alpha(0.12, 0.03, 0.10, 1.3)).toBeCloseTo(-0.001, 12);
    expect(alpha(0.09, 0.03, 0.10, 0.9)).toBeCloseTo(-0.003, 12);
    expect(mispricing(0.12, 0.03, 0.10, 1.3).pricing).toBe('overpriced');
    expect(mispricing(0.09, 0.03, 0.10, 0.9).pricing).toBe('overpriced');
  });
  it('Ex 7f: corrected allocation 69.34% / 30.66% and return 7.85%', () => {
    const p = separationAllocation(0.03, 0.10, Math.sqrt(0.0208), { sigma: 0.10 });
    expect(p.riskyWeight).toBeCloseTo(0.6933752452815365, 12);
    expect(p.riskFreeWeight).toBeCloseTo(0.3066247547184635, 12);
    expect(p.riskyWeight * 100).toBeCloseTo(69.34, 2);
    expect(p.riskFreeWeight * 100).toBeCloseTo(30.66, 2);
    expect(p.expectedReturn).toBeCloseTo(0.07853626716970756, 12);
    expect(p.expectedReturn * 100).toBeCloseTo(7.85, 2);
    expect(p.sigma).toBeCloseTo(0.10, 12);
  });
});

describe('tangent portfolio and separation properties', () => {
  it('hand solution with diagonal covariance', () => {
    const p = tangentPortfolio([0.10, 0.14], [[0.04, 0], [0, 0.09]], 0.02);
    expect(p.weights[0]).toBeCloseTo(0.6, 12);
    expect(p.weights[1]).toBeCloseTo(0.4, 12);
    expect(p.expectedReturn).toBeCloseTo(0.116, 12);
    expect(p.variance).toBeCloseTo(0.0288, 12);
    expect(p.sharpe).toBeCloseTo(Math.sqrt(0.32), 12);
  });
  it.each([-0.4, 0, 0.6])('tangent has highest Sharpe on a two-asset weight grid, rho=%s', rho => {
    const covariance = covarianceFromCorrelations([0.20, 0.30], [[1, rho], [rho, 1]]);
    const p = tangentPortfolio([0.10, 0.14], covariance, 0.02);
    expect(p.weights.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
    for (let i = -100; i <= 200; i++) {
      const weights = [i / 100, 1 - i / 100];
      const sr = sharpeRatio(portfolioReturn(weights, [0.10, 0.14]), 0.02, Math.sqrt(portfolioVariance(weights, covariance)));
      expect(p.sharpe + 1e-12).toBeGreaterThanOrEqual(sr);
    }
  });
  it('three-asset tangent beats a grid including short positions', () => {
    const means = [0.12, 0.09, 0.06];
    const covariance = [[0.04, 0.006, 0.002], [0.006, 0.0225, 0.003], [0.002, 0.003, 0.01]];
    const p = tangentPortfolio(means, covariance, 0.02);
    for (let i = -5; i <= 15; i++) for (let j = -5; j <= 15; j++) {
      const w = [i / 10, j / 10, 1 - (i + j) / 10];
      expect(p.sharpe + 1e-12).toBeGreaterThanOrEqual(sharpeRatio(portfolioReturn(w, means), 0.02, Math.sqrt(portfolioVariance(w, covariance))));
    }
    const cashMix = separationAllocation(0.02, p.expectedReturn, p.sigma, { expectedReturn: 0.08 });
    expect(cashMix.expectedReturn).toBeCloseTo(0.08, 12);
    expect(sharpeRatio(cashMix.expectedReturn, 0.02, cashMix.sigma)).toBeCloseTo(p.sharpe, 12);
  });
  it('allows a tangent fund with short sales', () => {
    const p = tangentPortfolio([0.08, 0.12], [[0.04, 0.038], [0.038, 0.04]], 0.02);
    expect(p.weights[0]).toBeLessThan(0);
    expect(p.weights[1]).toBeGreaterThan(1);
    expect(p.weights[0] + p.weights[1]).toBeCloseTo(1, 12);
  });
  it('tangent is invariant to common shifts and covariance scaling; inputs stay unchanged', () => {
    const returns = [0.10, 0.14];
    const covariance = [[0.04, 0], [0, 0.09]];
    const before = JSON.stringify({ returns, covariance });
    const p = tangentPortfolio(returns, covariance, 0.02);
    const shifted = tangentPortfolio([0.15, 0.19], covariance, 0.07);
    const scaled = tangentPortfolio(returns, covariance.map(row => row.map(x => x * 1e-8)), 0.02);
    p.weights.forEach((w, i) => {
      expect(shifted.weights[i]).toBeCloseTo(w, 12);
      expect(scaled.weights[i]).toBeCloseTo(w, 12);
    });
    expect(scaled.sharpe).toBeCloseTo(p.sharpe * 1e4, 8);
    expect(JSON.stringify({ returns, covariance })).toBe(before);
  });
  it('cash, leverage and short fund allocations', () => {
    expect(riskFreeMix(0.03, 0.11, 0.20, 0).expectedReturn).toBe(0.03);
    expect(riskFreeMix(0.03, 0.11, 0.20, -1).sigma).toBe(0.20);
    expect(riskFreeMix(0.03, 0.11, 0.20, -1).expectedReturn).toBeCloseTo(-0.05, 12);
    expect(separationAllocation(0.03, 0.11, 0.20, { expectedReturn: 0.19 }).riskyWeight).toBeCloseTo(2, 12);
    expect(separationAllocation(0.03, 0.11, 0.20, { expectedReturn: -0.05 }).riskyWeight).toBeCloseTo(-1, 12);
    for (let i = 0; i <= 20; i++) {
      const mix = separationAllocation(0.03, 0.11, 0.20, { sigma: i / 50 });
      expect(mix.sigma).toBeCloseTo(i / 50, 12);
      expect(mix.riskyWeight + mix.riskFreeWeight).toBeCloseTo(1, 12);
      expect(mix.expectedReturn).toBeCloseTo(capitalMarketLine(0.03, 0.11, 0.20, i / 50), 12);
    }
  });
});

describe('SML and systematic risk', () => {
  it('beta=1 is on the SML at the market return over a rate grid', () => {
    for (const rf of [-0.02, 0, 0.03, 0.10]) for (const market of [-0.10, 0.02, 0.10, 0.25]) {
      const b = beta(0.04, 0.04);
      expect(b).toBe(1);
      expect(securityMarketLine(rf, market, b)).toBeCloseTo(market, 12);
      expect(alpha(market, rf, market, b)).toBeCloseTo(0, 12);
      expect(mispricing(market, rf, market, b).pricing).toBe('fair');
      expect(securityMarketLine(rf, market, 0)).toBe(rf);
    }
  });
  it('negative beta, positive alpha and tolerance', () => {
    expect(beta(-0.02, 0.04)).toBe(-0.5);
    expect(securityMarketLine(0.03, 0.11, -0.5)).toBeCloseTo(-0.01, 12);
    expect(mispricing(0.13, 0.03, 0.11, 1).pricing).toBe('underpriced');
    expect(mispricing(0.11001, 0.03, 0.11, 1, 0.001).pricing).toBe('fair');
    expect(portfolioBeta([-1, 2], [0.5, 1.5])).toBeCloseTo(2.5, 12);
  });
  it('variance decomposes into systematic and idiosyncratic parts', () => {
    const risk = riskDecomposition(0.09, 1.2, 0.04);
    expect(risk.systematicVariance).toBeCloseTo(0.0576, 12);
    expect(risk.idiosyncraticVariance).toBeCloseTo(0.0324, 12);
    expect(risk.systematicVariance + risk.idiosyncraticVariance).toBeCloseTo(risk.totalVariance, 12);
    expect(riskDecomposition(0.09, -1.2, 0.04)).toEqual(risk);
    expect(riskDecomposition(0.04, 1, 0.04).idiosyncraticVariance).toBe(0);
    expect(riskDecomposition(0.09, 0, 0.04).idiosyncraticVariance).toBe(0.09);
  });
});

describe('invalid or undefined CAPM inputs', () => {
  it.each([
    () => sharpeRatio(0.10, 0.03, 0), () => sharpeRatio(0.10, 0.03, -0.1),
    () => sharpeRatio(NaN, 0.03, 0.1), () => capitalAllocationLine(0.03, 0.10, 0.2, -1),
    () => riskFreeMix(0.03, 0.10, -0.2, 1), () => riskFreeMix(0.03, 0.10, 0.2, Infinity),
    () => separationAllocation(0.03, 0.10, 0, { sigma: 0.1 }),
    () => separationAllocation(0.03, 0.03, 0.2, { expectedReturn: 0.1 }),
    () => separationAllocation(0.03, 0.10, 0.2, { sigma: -0.1 }),
    () => separationAllocation(0.03, 0.10, 0.2, { expectedReturn: NaN }),
    () => separationAllocation(0.03, 0.10, 0.2, { sigma: 0.1, expectedReturn: 0.1 }),
    () => beta(0, 0), () => beta(0.1, -1), () => securityMarketLine(0.03, Infinity, 1),
    () => portfolioBeta([0.3, 0.3], [1, 2]), () => mispricing(0.1, 0.03, 0.11, 1, -1),
    () => riskDecomposition(0.01, 1, 0.04), () => riskDecomposition(-1, 1, 0.04),
    () => tangentPortfolio([0.1], [[0]], 0.03),
    () => tangentPortfolio([0.1, 0.2], [[1, 2], [2, 1]], 0.03),
    () => tangentPortfolio([0.1, 0.2], [[1]], 0.03),
    () => tangentPortfolio([0.01, 0.02], [[1, 0], [0, 1]], 0.03),
    () => tangentPortfolio([0.02, 0.04], [[1, 0], [0, 1]], 0.03),
    () => tangentPortfolio([0.03], [[1]], 0.03),
  ])('rejects invalid calculation %#', calculate => {
    expect(calculate).toThrow(RangeError);
  });
});
