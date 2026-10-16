import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  covarianceFromCorrelations, diversificationTable, frontierPoint, globalMinimumVariance,
  minimumVarianceWeight, twoAssetReturn, twoAssetVariance, weightSweep,
} from '../src/lib/finance/portfolio';

const chapter = readFileSync('src/content/chapters/07-dos-activos.mdx', 'utf8');
const returns = [0.06, 0.12];
const covariance = (rho: number) => covarianceFromCorrelations([0.1, 0.2], [[1, rho], [rho, 1]]);
const pct = (value: number) => (value * 100).toFixed(2).replace('.', ',');
const contains = (...values: string[]) => values.forEach(value => expect(chapter).toContain(value));

describe('capítulo 7: todos los números del texto, panel y quizzes', () => {
  it('datos originales A 6/10 %, B 12/20 %, pesos 0/1 y 50/50 %, retorno 9 %', () => {
    const endpoints = weightSweep([0.06, 0.12], [0.1, 0.2], 0.25, 0, 1, 2);
    expect(endpoints.map(point => point.weights)).toEqual([[0, 1], [0.5, 0.5], [1, 0]]);
    expect(endpoints.map(point => pct(point.expectedReturn))).toEqual(['12,00', '9,00', '6,00']);
    expect(endpoints.map(point => pct(point.sigma))).toEqual(['20,00', '12,25', '10,00']);
    contains('6 %', '10 %', '12 %', '20 %', '50 %', '9 %', 'correlación de 0,25');
  });

  it('covarianza 0,005; cuadrados 0,0025/0,0100, cruzado 0,0025; varianza 0,0150; sigma 0,1225', () => {
    expect(covariance(0.25)[0][1]).toBeCloseTo(0.005, 14);
    const first = twoAssetVariance(0.5, 0.1, 0, 0.25);
    const second = twoAssetVariance(0.5, 0, 0.2, 0.25);
    const total = twoAssetVariance(0.5, 0.1, 0.2, 0.25);
    expect(first).toBeCloseTo(0.0025, 14);
    expect(second).toBeCloseTo(0.01, 14);
    expect(total - first - second).toBeCloseTo(0.0025, 14);
    expect(total).toBeCloseTo(0.015, 14);
    expect(Math.sqrt(total).toFixed(4)).toBe('0.1225');
    expect(pct(Math.sqrt(total))).toBe('12,25');
    contains('0{,}005', '0{,}0025', '0{,}0100', '0{,}0150', '0{,}1225', '12,25 %');
  });

  it('rho 1/0,25/0/−1: riesgos 15/12,25/11,18/5 %, media fija 9 %, quiz varianza 0,0125', () => {
    const rows = diversificationTable(0.1, 0.2, [1, 0.25, 0, -1]);
    expect(rows.map(row => pct(row.sigma))).toEqual(['15,00', '12,25', '11,18', '5,00']);
    expect(rows[2].variance).toBeCloseTo(0.0125, 14);
    for (const row of rows) {
      expect(frontierPoint(returns, covariance(row.correlation), 0.09, true).weights[0]).toBeCloseTo(0.5, 12);
      expect(twoAssetReturn(0.5, ...returns as [number, number])).toBeCloseTo(0.09, 14);
    }
    contains('15 %, 12,25 %, 11,18 % y 5 %', '0,0125', '9 %', '11,18 %', '15 %');
  });

  it('rho −1: dos tercios de A, un tercio de B, sigma cero, retorno 8 %; mitades no cancelan', () => {
    const weight = minimumVarianceWeight(0.1, 0.2, -1, true);
    expect(weight).toBeCloseTo(2 / 3, 14);
    expect(1 - weight).toBeCloseTo(1 / 3, 14);
    expect(twoAssetVariance(weight, 0.1, 0.2, -1)).toBe(0);
    expect(twoAssetReturn(weight, 0.06, 0.12)).toBeCloseTo(0.08, 14);
    expect(twoAssetVariance(0.5, 0.1, 0.2, -1)).toBeGreaterThan(0);
    contains('dos tercios en A y un tercio en B', '8 %', '8 %', '5 %');
  });

  it('rho 0,25: mínimo 87,50/12,50 %, retorno 6,75 %, riesgo 9,68 %', () => {
    const minimum = globalMinimumVariance(returns, covariance(0.25), true);
    expect(minimum.weights.map(pct)).toEqual(['87,50', '12,50']);
    expect(pct(minimum.expectedReturn)).toBe('6,75');
    expect(pct(minimum.sigma)).toBe('9,68');
    expect(minimumVarianceWeight(0.1, 0.2, 0.25, true)).toBeCloseTo(0.875, 14);
    contains('87,50 %', '12,50 %', '6,75 %', '9,68 %');
  });

  it('audit note 03: one absolute value preserves short-sale cancellation', () => {
    expect(twoAssetVariance(2, 0.1, 0.2, 1)).toBe(0);
    expect(twoAssetReturn(2, 0.06, 0.12)).toBe(0);
    const unrestricted = globalMinimumVariance(returns, covariance(1));
    expect(unrestricted.weights[0]).toBeCloseTo(2, 12);
    expect(unrestricted.weights[1]).toBeCloseTo(-1, 12);
    expect(unrestricted.sigma).toBe(0);
    const longOnly = globalMinimumVariance(returns, covariance(1), true);
    expect(longOnly.weights).toEqual([1, 0]);
    expect(pct(longOnly.sigma)).toBe('10,00');
    // The source incorrectly sums the absolute values: 40 % instead of zero.
    expect(Math.abs(2 * 0.1) + Math.abs(-1 * 0.2)).toBe(0.4);
    contains('peso de A igual a 2 y peso de B igual a −1', '|w_1\\sigma_1+w_2\\sigma_2|');
  });

  it('la reducción con rho exige pesos positivos; no exige correlación negativa', () => {
    expect(twoAssetVariance(0.5, 0.1, 0.2, 0.25)).toBeLessThan(twoAssetVariance(0.5, 0.1, 0.2, 1));
    expect(twoAssetVariance(2, 0.1, 0.2, 0)).toBeGreaterThan(twoAssetVariance(2, 0.1, 0.2, 1));
    contains('Con pesos de signos opuestos', 'no necesitas una correlación negativa');
  });

  it('plantilla, símbolos y relación con la auditoría', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map(match => match[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    contains('sessions: []', 'prerequisites: [6]', 'part: 3', 'chapter: 7', 'difficulty: 2');
    // No PS3 session is available yet. Note 06 is deliberately not used.
    const audit = readFileSync('docs/AUDIT.md', 'utf8');
    expect(audit).toContain('note 06 dropped as duplicate');
    expect(audit).toContain('tests/capitulo7.test.ts');
    expect(readFileSync('docs/STYLE_GUIDE.md', 'utf8')).toContain('$\\sigma_p$');
  });
});
