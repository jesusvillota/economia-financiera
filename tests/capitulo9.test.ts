import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { capitalAllocationLine, riskFreeMix, separationAllocation, sharpeRatio, tangentPortfolio } from '../src/lib/finance/capm';
import { covarianceFromCorrelations, frontierPoint, portfolioReturn, portfolioVariance } from '../src/lib/finance/portfolio';

const chapter = readFileSync('src/content/chapters/09-activo-libre-riesgo.mdx', 'utf8');
const returns = [0.08, 0.14];
const sigmas = [0.1, 0.2];
const rf = 0.02;
const covariance = covarianceFromCorrelations(sigmas, [[1, 0], [0, 1]]);
const t = tangentPortfolio(returns, covariance, rf);
const pct = (value: number, digits = 2) => `${(100 * value).toFixed(digits).replace('.', ',')} %`;

describe('capítulo 9: every numeric example in prose, table, prompts and quizzes', () => {
  it('original annual inputs: A 8/10 %, B 14/20 %, risk-free 2 %, zero correlation', () => {
    for (const number of ['8 %', '10 %', '14 %', '20 %', '2 %']) expect(chapter).toContain(number);
    expect(portfolioReturn([1, 0], returns)).toBe(0.08);
    expect(portfolioReturn([0, 1], returns)).toBe(0.14);
    expect(portfolioVariance([1, 0], covariance)).toBeCloseTo(0.01, 14);
    expect(portfolioVariance([0, 1], covariance)).toBeCloseTo(0.04, 14);
    expect(covariance[0][1]).toBe(0);
    expect(riskFreeMix(rf, t.expectedReturn, t.sigma, 0).expectedReturn).toBe(rf);
  });

  it('tangent weights 2/3 and 1/3, printed 66.67/33.33 %, return 10 %, risk 9.43 %, Sharpe .8485', () => {
    expect(t.weights[0]).toBeCloseTo(2 / 3, 14);
    expect(t.weights[1]).toBeCloseTo(1 / 3, 14);
    expect(pct(t.weights[0])).toBe('66,67 %');
    expect(pct(t.weights[1])).toBe('33,33 %');
    expect(t.expectedReturn).toBeCloseTo(0.1, 14);
    expect(t.variance).toBeCloseTo(2 / 225, 14);
    expect(pct(t.sigma)).toBe('9,43 %');
    expect(t.sharpe.toFixed(4)).toBe('0.8485');
    expect(chapter).toContain('$2/3$ y $1/3$');
    for (const number of ['66,67 %', '33,33 %', '9,43 %', '0,8485']) expect(chapter).toContain(number);
    expect(frontierPoint(returns, covariance, 0.1).sigma).toBeCloseTo(t.sigma, 14);
  });

  it.each([
    [0, 1, 0.02, '0,00 %'],
    [0.5, 0.5, 0.06, '4,71 %'],
    [1, 0, 0.1, '9,43 %'],
    [1.5, -0.5, 0.14, '14,14 %'],
  ])('table and hook: fund weight %s, cash %s, expected return %s, risk %s', (weight, cash, expected, risk) => {
    const mix = riskFreeMix(rf, t.expectedReturn, t.sigma, weight);
    expect(mix.riskFreeWeight).toBe(cash);
    expect(mix.expectedReturn).toBeCloseTo(expected, 14);
    expect(pct(mix.sigma)).toBe(risk);
    expect(mix.variance).toBeCloseTo(weight ** 2 * t.variance, 14);
    expect(capitalAllocationLine(rf, t.expectedReturn, t.sigma, mix.sigma)).toBeCloseTo(expected, 14);
    expect(separationAllocation(rf, t.expectedReturn, t.sigma, { expectedReturn: expected }).riskyWeight).toBeCloseTo(weight, 14);
    const row = `| ${pct(weight, 0)} | ${pct(cash, 0).replace('-', '−')} | ${pct(expected, 0)} | ${risk === '0,00 %' ? '0 %' : risk} |`;
    expect(chapter).toContain(row);
  });

  it('1000 € wealth: half allocation is 500/500 €; leveraged investment 1500 €, borrowing 500 €', () => {
    const half = riskFreeMix(rf, t.expectedReturn, t.sigma, 0.5);
    const leveraged = riskFreeMix(rf, t.expectedReturn, t.sigma, 1.5);
    expect(1000 * half.riskyWeight).toBe(500);
    expect(1000 * half.riskFreeWeight).toBe(500);
    expect(1000 * leveraged.riskyWeight).toBe(1500);
    expect(1000 * leveraged.riskFreeWeight).toBe(-500);
    for (const number of ['1000 €', '500 €', '1500 €']) expect(chapter).toContain(number);
  });

  it('each individual fund Sharpe .6000; diversification improves to .8485', () => {
    for (let j = 0; j < returns.length; j++) {
      const s = sharpeRatio(returns[j], rf, sigmas[j]);
      expect(s.toFixed(4)).toBe('0.6000');
      expect(s).toBeLessThan(t.sharpe);
    }
    expect(chapter).toContain('0,6000');
  });

  it('playground: half in A gives 5 % expected return and 5 % risk', () => {
    const a = frontierPoint(returns, covariance, 0.08);
    const mix = riskFreeMix(rf, a.expectedReturn, a.sigma, 0.5);
    expect(pct(mix.expectedReturn, 0)).toBe('5 %');
    expect(pct(mix.sigma, 0)).toBe('5 %');
    expect(chapter).toContain('un 5 % esperado y un riesgo del 5 %');
  });

  it('audit: shorting the fund needs the absolute weight and the lower branch', () => {
    const mix = riskFreeMix(rf, t.expectedReturn, t.sigma, -0.5);
    expect(mix.expectedReturn).toBeCloseTo(-0.02, 14);
    expect(pct(mix.sigma)).toBe('4,71 %');
    expect(capitalAllocationLine(rf, t.expectedReturn, t.sigma, mix.sigma)).toBeCloseTo(0.06, 14);
    expect(chapter).toContain('−50 % produce rentabilidad esperada del −2 %');
    expect(chapter).toContain('\\sigma_p=|w_c|\\sigma_c');
  });

  it('zero-risk cash, zero covariance, and singular endpoint warnings', () => {
    expect(riskFreeMix(rf, t.expectedReturn, t.sigma, 0).variance).toBe(0);
    expect(portfolioVariance([0, 1], [[0.01, 0], [0, 0]])).toBe(0);
    expect(() => sharpeRatio(rf, rf, 0)).toThrow();
    for (const rho of [-1, 1]) {
      expect(() => tangentPortfolio(returns, covarianceFromCorrelations(sigmas, [[1, rho], [rho, 1]]), rf)).toThrow();
    }
  });

  it('six ordered sections, three quizzes, schema, model limits and no nonexistent session link', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map(match => match[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('prerequisites: [8]');
    expect(chapter).not.toContain('sessions:');
    expect(chapter).toContain('prestar y pedir prestado al mismo tipo seguro');
    expect(chapter).toContain('sin restricciones de ventas en corto');
    expect(chapter).toContain('Los cálculos conservan los pesos exactos');
  });
});
