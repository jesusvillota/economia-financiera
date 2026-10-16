import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { alpha, securityMarketLine } from '../src/lib/finance/capm';
import {
  abnormalReturn, cumulativeAbnormalReturn, marketModelReturn, marketModelAbnormalReturns,
  famaFrenchRegression, carhartRegression, aptExpectedReturn, type CarhartFactors,
} from '../src/lib/finance/eventStudy';

const chapter = readFileSync('src/content/chapters/11-mas-alla-capm.mdx', 'utf8');
const market = [-0.01, 0.005, 0.01, -0.005, 0];
const observed = [-0.013, 0.009, 0.028, -0.007, 0.001];
const ar = marketModelAbnormalReturns(observed, market, 0.001, 1.2);
const pct = (v: number) => `${(v * 100).toFixed(2).replace('.', ',')} %`;

describe('capítulo 11: cada número del ejemplo, tabla, fórmulas, juego y quiz', () => {
  it.each([
    ['−2', -0.01, -0.013, -0.011, -0.002],
    ['−1', 0.005, 0.009, 0.007, 0.002],
    ['0', 0.01, 0.028, 0.013, 0.015],
    ['+1', -0.005, -0.007, -0.005, -0.002],
    ['+2', 0, 0.001, 0.001, 0],
  ])('día %s: todos los datos y resultados de la tabla', (day, m, r, normal, surprise) => {
    expect(marketModelReturn(m, 0.001, 1.2)).toBeCloseTo(normal, 14);
    expect(abnormalReturn(r, normal)).toBeCloseTo(surprise, 14);
    const row = `| ${day} | ${[m, r, normal, surprise].map(pct).join(' | ')} |`.replaceAll('-', '−');
    expect(chapter).toContain(row);
  });

  it('gancho, sustitución decimal y primer quiz: 2,80 − 1,30 = 1,50 puntos', () => {
    expect(pct(marketModelReturn(0.01, 0.001, 1.2))).toBe('1,30 %');
    expect(pct(ar[2])).toBe('1,50 %');
    for (const value of ['2,80 %', '1 %', '1,30 %', '1,50 puntos',
      '0{,}001', '1{,}2', '0{,}01', '0{,}013', '0{,}028', '0{,}015',
      '2,80 − 1,30 = 1,50']) expect(chapter).toContain(value);
  });

  it('CAR suma las cinco observaciones inclusivas; no capitaliza', () => {
    const expected = [-0.002, 0.002, 0.015, -0.002, 0];
    ar.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 14));
    expect(pct(cumulativeAbnormalReturn(ar))).toBe('1,30 %');
    expect(pct(cumulativeAbnormalReturn(ar, 1, 3))).toBe('1,50 %');
    expect(pct(cumulativeAbnormalReturn(ar, 2, 2))).toBe('1,50 %');
    expect(pct(cumulativeAbnormalReturn(ar, 3, 4))).toBe('-0,20 %');
    expect(cumulativeAbnormalReturn(ar, 0, 1)).toBeCloseTo(0, 14);
    expect(ar.reduce((v, r) => v * (1 + r), 1) - 1).not.toBeCloseTo(cumulativeAbnormalReturn(ar), 8);
    for (const value of ['[-2,2]', '-0{,}002+0{,}002+0{,}015-0{,}002+0=0{,}013',
      'desde −1 hasta +1', 'día 0', 'desde +1 hasta +2', '−0,20 %']) expect(chapter).toContain(value);
  });

  it('juego: beta 0,8 y después intercepto 0,20 % dan 1,90 % y 1,80 %', () => {
    expect(pct(marketModelReturn(0.01, 0.001, 0.8))).toBe('0,90 %');
    expect(pct(abnormalReturn(0.028, marketModelReturn(0.01, 0.001, 0.8)))).toBe('1,90 %');
    expect(pct(abnormalReturn(0.028, marketModelReturn(0.01, 0.002, 0.8)))).toBe('1,80 %');
    for (const value of ['1,2 a 0,8', '0,90 %', '1,90 %', '0,10 % a 0,20 %', '1,80 %']) expect(chapter).toContain(value);
  });

  it('el intercepto bruto no es alfa de Jensen; convertir mantiene la referencia', () => {
    const rf = 0.002;
    const jensen = alpha(marketModelReturn(0.01, 0.001, 1.2), rf, 0.01, 1.2);
    expect(jensen).toBeCloseTo(0.0014, 14);
    expect(jensen).not.toBeCloseTo(0.001, 8);
    expect(jensen + (1 - 1.2) * rf).toBeCloseTo(0.001, 14);
    expect(jensen + securityMarketLine(rf, 0.01, 1.2)).toBeCloseTo(0.013, 14);
    expect(chapter).toContain('a_j=\\alpha_j+(1-\\beta_j)\\rf');
  });

  it('audit note 03 §9 / note 07: excess returns avoid a spurious risk-free intercept', () => {
    // Synthetic full-rank factors solely for this regression test; no empirical data claim.
    const factors: CarhartFactors[] = Array.from({ length: 16 }, (_, i) =>
      [0, 1, 2, 3].map((bit) => (i & (1 << bit) ? 0.01 : -0.01)) as unknown as CarhartFactors);
    const rf = 0.002;
    const excess = factors.map(([m, s, h, u]) => 1.2 * m + 0.3 * s - 0.2 * h + 0.4 * u);
    const ff = factors.map(([m, s, h]) => [m, s, h] as const);
    const fit3 = famaFrenchRegression(ff, excess);
    const fit4 = carhartRegression(factors, excess);
    expect(fit3.coefficients).toHaveLength(3);
    expect(fit4.coefficients).toHaveLength(4);
    expect(fit3.intercept).toBeCloseTo(0, 14);
    expect(fit4.intercept).toBeCloseTo(0, 14);
    expect(famaFrenchRegression(ff, excess.map((r) => r + rf)).intercept).toBeCloseTo(rf, 14);
    expect(carhartRegression(factors, excess.map((r) => r + rf)).intercept).toBeCloseTo(rf, 14);
    expect(chapter).toContain('r_{j,t}-\\rf=\\alpha_j');
    expect(chapter).toContain('No se les resta de nuevo el tipo libre de riesgo');
  });

  it('APT: prima lineal y ausencia de factores dejan solo la tasa libre de riesgo', () => {
    expect(aptExpectedReturn(0.002, [1.2, 0.3], [0.01, -0.004]))
      .toBeCloseTo(0.0128, 14);
    expect(aptExpectedReturn(0.002, [], [])).toBe(0.002);
    expect(chapter).toContain('suficiente diversificación');
    expect(chapter).toContain('sus residuos pueden seguir siendo distintos');
  });

  it('seis secciones en orden, tres quizzes, metadatos y sin sesión inexistente', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('chapter: 11');
    expect(chapter).toContain('part: 3');
    expect(chapter).toContain('difficulty: 3');
    expect(chapter).toContain('prerequisites: [10]');
    expect(chapter).toContain('sessions: []');
  });
});
