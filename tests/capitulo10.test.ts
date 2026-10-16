import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  alpha, beta, capitalMarketLine, mispricing, portfolioBeta, riskDecomposition,
  riskFreeMix, securityMarketLine, sharpeRatio,
} from '../src/lib/finance/capm';

const chapter = readFileSync('src/content/chapters/10-capm.mdx', 'utf8');
const rf = 0.02;
const market = 0.08;
const sigmaM = 0.2;
const pct = (v: number) => `${Number((v * 100).toFixed(8)).toLocaleString('es-ES')} %`;

describe('capítulo 10: every numeric example in prose, formulas, prompts and quizzes', () => {
  it('hook and SML: rf 2 %, market 8 %, beta 1.5, required 11 %, forecast 13 %, alpha +2 pp', () => {
    expect(chapter).toContain('2 % anual');
    expect(chapter).toContain('mercado del 8 %');
    expect(chapter).toContain('beta 1,5');
    expect(securityMarketLine(rf, market, 1.5)).toBeCloseTo(0.11, 14);
    expect(chapter).toContain(pct(securityMarketLine(rf, market, 1.5)));
    expect(chapter).toContain('13 %');
    expect(alpha(0.13, rf, market, 1.5)).toBeCloseTo(0.02, 14);
    expect(mispricing(0.13, rf, market, 1.5).pricing).toBe('underpriced');
    expect(securityMarketLine(rf, market, 1) - rf).toBeCloseTo(0.06, 14);
    expect(chapter).toContain('6 puntos porcentuales');
  });

  it('CML: market sigma 20 %, Sharpe 0.30; half in market gives sigma 10 % and return 5 %', () => {
    expect(sharpeRatio(market, rf, sigmaM)).toBeCloseTo(0.3, 14);
    expect(chapter).toContain('vale 0,30');
    expect(capitalMarketLine(rf, market, sigmaM, 0.1)).toBeCloseTo(0.05, 14);
    const mix = riskFreeMix(rf, market, sigmaM, 0.5);
    expect(mix.riskFreeWeight).toBe(0.5);
    expect(mix.sigma).toBe(0.1);
    expect(mix.expectedReturn).toBeCloseTo(0.05, 14);
    expect(chapter).toContain('volatilidad del 10 % ofrece una esperanza del 5 %');
  });

  it('beta calculation 0.024 / 0.04 = 0.6; market beta 1 and risk-free beta 0', () => {
    expect(beta(0.024, 0.04)).toBe(0.6);
    expect(chapter).toContain('covarianza de 0,024');
    expect(chapter).toContain('varianza del mercado de 0,04 dan beta 0,6');
    expect(beta(sigmaM ** 2, sigmaM ** 2)).toBe(1);
    expect(beta(0, sigmaM ** 2)).toBe(0);
    expect(alpha(market, rf, market, 1)).toBe(0);
    expect(alpha(rf, rf, market, 0)).toBe(0);
  });

  it('audit note 03: low beta can coexist with higher total volatility', () => {
    const parts = riskDecomposition(0.3 ** 2, 0.6, sigmaM ** 2);
    expect(parts.totalVariance).toBeCloseTo(0.09, 14);
    expect(parts.systematicVariance).toBeCloseTo(0.0144, 14);
    expect(parts.idiosyncraticVariance).toBeCloseTo(0.0756, 14);
    expect(parts.systematicVariance + parts.idiosyncraticVariance).toBeCloseTo(parts.totalVariance, 14);
    expect(Math.sqrt(parts.totalVariance)).toBeCloseTo(0.3, 14);
    expect(Math.sqrt(parts.totalVariance)).toBeGreaterThan(sigmaM);
    expect(chapter).toContain('volatilidad total del 30 %');
    for (const value of ['0,09', '0,0144', '0,0756']) expect(chapter).toContain(value);
  });

  it('B: beta 0.5, forecast 3 %, required 5 %, alpha −2 pp; A/B portfolio 40/60 %, beta 1.1 and 8.6 %', () => {
    const b = mispricing(0.03, rf, market, 0.5);
    expect(b.requiredReturn).toBeCloseTo(0.05, 14);
    expect(b.alpha).toBeCloseTo(-0.02, 14);
    expect(b.pricing).toBe('overpriced');
    expect(chapter).toContain('B tiene beta 0,5 y previsión del 3 %');
    expect(chapter).toContain('alfa es de −2 puntos porcentuales');
    const bp = portfolioBeta([0.4, 0.6], [0.5, 1.5]);
    expect(bp).toBeCloseTo(1.1, 14);
    expect(securityMarketLine(rf, market, bp)).toBeCloseTo(0.086, 14);
    expect(chapter).toContain('40 % en B y 60 % en A tiene beta 1,1');
    expect(chapter).toContain('exigida es 8,6 %');
  });

  it('playground: fair market and beta zero; market 10 % requires 14 %; beta −0.5 requires −1 %', () => {
    expect(mispricing(0.08, rf, market, 1).alpha).toBe(0);
    expect(mispricing(0.02, rf, market, 0).alpha).toBe(0);
    expect(securityMarketLine(rf, 0.1, 1.5)).toBeCloseTo(0.14, 14);
    expect(alpha(0.13, rf, 0.1, 1.5)).toBeCloseTo(-0.01, 14);
    expect(securityMarketLine(rf, market, -0.5)).toBeCloseTo(-0.01, 14);
    expect(chapter).toContain('mercado al 10 %');
    expect(chapter).toContain('exigir un 14 %');
    expect(chapter).toContain('beta −0,5');
    expect(chapter).toContain('Se exige −1 %');
  });

  it('every numeric literal in narrative and quizzes belongs to the verified examples', () => {
    // Exclude metadata, imports, symbolic TeX, internal links and quiz answer indices.
    // This guard catches newly added prose numbers until their example is tested above.
    const narrative = chapter.split('## <span')[1] + chapter.split('## <span').slice(2).join('## <span');
    const text = narrative.replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]*\$/g, '').replace(/\]\([^)]*\)/g, ']')
      .replace(/answer=\{\d+\}/g, '').replace(/^\d+\. /gm, '');
    const numbers = [...new Set(text.match(/−?\d+(?:,\d+)?/g))].sort();
    expect(numbers).toEqual([
      '0', '0,0144', '0,024', '0,04', '0,0756', '0,09', '0,30', '0,5', '0,6',
      '1', '1,1', '1,5', '10', '11', '13', '14', '2', '20', '3', '30', '40', '5', '6', '60', '8', '8,6', '−0,5', '−1', '−2',
    ].sort());
  });
});
