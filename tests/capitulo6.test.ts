import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  affineMoments, annualizedVolatility, correlation, covariance, expectedReturn,
  holdingPeriodReturn, sampleMean, sampleStandardDeviation, sampleVariance,
  scenarioStandardDeviation, scenarioVariance,
} from '../src/lib/finance/risk';

const chapter = readFileSync('src/content/chapters/06-rentabilidad-riesgo.mdx', 'utf8');
const returns = [-0.1, 0.06, 0.22];
const p = [0.25, 0.5, 0.25];
const mean = expectedReturn(returns, p);
const variance = scenarioVariance(returns, p);
const sigma = scenarioStandardDeviation(returns, p);
const pct = (value: number) => `${(value * 100).toFixed(2).replace('.', ',')} %`;

describe('capítulo 6: todos los ejemplos numéricos del texto', () => {
  it('gancho, fórmula y quiz: precio 80 €, venta 86 €, dividendo 2 €, ganancia 8 €', () => {
    const prices = [80, 86, 2] as const;
    expect(holdingPeriodReturn(...prices)).toBeCloseTo(0.1, 14);
    expect(holdingPeriodReturn(...prices) * prices[0]).toBe(8);
    expect(pct(holdingPeriodReturn(prices[0], prices[1]))).toBe('7,50 %');
    expect(pct(holdingPeriodReturn(prices[0], prices[0], prices[2]))).toBe('2,50 %');
    for (const number of ['80 €', '86 €', '2 €', '8 €', '10 %', '7,50 %', '2,50 %']) {
      expect(chapter).toContain(number);
    }
  });

  it('tabla central: tres escenarios, probabilidades 25/50/25 y media 6 %', () => {
    expect(returns).toHaveLength(3);
    expect(expectedReturn([1, 1, 1], p)).toBe(1);
    expect(holdingPeriodReturn(100, 90)).toBe(returns[0]);
    expect(holdingPeriodReturn(100, 106)).toBe(returns[1]);
    expect(holdingPeriodReturn(100, 122)).toBe(returns[2]);
    expect(mean).toBeCloseTo(0.06, 14);
    expect(chapter).toContain('25 %, 50 % y 25 %');
    expect(chapter).toContain('10 %; en estabilidad gana un 6 %; en expansión gana un 22 %');
  });

  it('varianza 0,0128; volatilidad 0,1131 o 11,31 %; momentos 0,0164 y 0,0036', () => {
    expect(variance).toBeCloseTo(0.0128, 14);
    expect(sigma).toBeCloseTo(0.1131, 4);
    expect(pct(sigma)).toBe('11,31 %');
    const secondMoment = expectedReturn(returns.map((r) => r ** 2), p);
    expect(secondMoment).toBeCloseTo(0.0164, 14);
    expect(mean ** 2).toBeCloseTo(0.0036, 14);
    expect(secondMoment - mean ** 2).toBeCloseTo(variance, 14);
    for (const number of ['0{,}0128', '0{,}1131', '11{,}31', '0{,}0164', '0{,}0036']) {
      expect(chapter).toContain(number);
    }
  });

  it('trasladar tres puntos: media 9 %, volatilidad 11,31 %', () => {
    const shifted = affineMoments(mean, variance, 1, 0.03);
    expect(shifted.mean).toBeCloseTo(0.09, 14);
    expect(shifted.variance).toBe(variance);
    expect(scenarioStandardDeviation(returns.map((r) => r + 0.03), p)).toBeCloseTo(sigma, 14);
    expect(chapter).toContain('tres puntos porcentuales');
    expect(chapter).toContain('9 %');
  });

  it('duplicar: media 12 %, volatilidad 22,63 %, varianza 0,0512 (cuádruple)', () => {
    const scaled = affineMoments(mean, variance, 2, 0);
    expect(scaled.mean).toBeCloseTo(0.12, 14);
    expect(scaled.variance).toBeCloseTo(0.0512, 14);
    expect(scaled.variance / variance).toBe(4);
    expect(pct(scenarioStandardDeviation(returns.map((r) => 2 * r), p))).toBe('22,63 %');
    for (const number of ['12 %', '22,63 %', '0{,}0512']) expect(chapter).toContain(number);
  });

  it('prima esperada: media 6 %, libre de riesgo 2 %, diferencia cuatro puntos', () => {
    expect(affineMoments(mean, variance, 1, -0.02).mean).toBeCloseTo(0.04, 14);
    expect(chapter).toContain('libre de riesgo del 2 %');
    expect(chapter).toContain('cuatro puntos porcentuales');
  });

  it('historia mensual −2/4/10 %, media 4 %, varianza 0,0036, desviación 6 %', () => {
    const history = [-0.02, 0.04, 0.1];
    expect(history).toHaveLength(3);
    expect(sampleMean(history)).toBeCloseTo(0.04, 14);
    expect(sampleVariance(history)).toBeCloseTo(0.0036, 14);
    expect(sampleStandardDeviation(history)).toBeCloseTo(0.06, 14);
    expect(scenarioVariance(history, [1 / 3, 1 / 3, 1 / 3])).toBeCloseTo(0.0024, 14);
    expect(pct(scenarioStandardDeviation(history, [1 / 3, 1 / 3, 1 / 3]))).toBe('4,90 %');
    for (const number of ['−2 %, 4 % y 10 %', '0{,}0024', '4,90 %']) expect(chapter).toContain(number);
  });

  it('doce meses: volatilidad 20,78 % de la suma bajo meses no correlacionados de igual varianza', () => {
    expect(pct(annualizedVolatility(0.06, 12))).toBe('20,78 %');
    expect(chapter).toContain('20,78 %');
    expect(chapter).toContain('\\sqrt{12}');
  });

  it.each([
    ['caída', [0.5, 0.25, 0.25], 0.02],
    ['expansión', [0.25, 0.25, 0.5], 0.1],
  ])('zona de juego: más peso en %s, volatilidad 13,27 %', (_, probabilities, expected) => {
    expect(expectedReturn(returns, probabilities)).toBeCloseTo(expected, 14);
    expect(scenarioVariance(returns, probabilities)).toBeCloseTo(0.0176, 14);
    expect(pct(scenarioStandardDeviation(returns, probabilities))).toBe('13,27 %');
    expect(chapter).toContain('13,27 %');
  });

  it('resultados constantes al 6 %: esperanza 6 %, varianza y volatilidad cero', () => {
    for (const probabilities of [p, [0.5, 0.25, 0.25], [0.25, 0.25, 0.5]]) {
      expect(expectedReturn([0.06, 0.06, 0.06], probabilities)).toBe(0.06);
      expect(scenarioVariance([0.06, 0.06, 0.06], probabilities)).toBe(0);
      expect(scenarioStandardDeviation([0.06, 0.06, 0.06], probabilities)).toBe(0);
    }
  });

  it('apéndice integrado: covarianza simétrica, identidad y extremos −1/1 de correlación', () => {
    const negative = returns.map((r) => -r);
    expect(covariance(returns, negative, p)).toBe(covariance(negative, returns, p));
    expect(covariance(returns, returns, p)).toBeCloseTo(variance, 14);
    expect(correlation(returns, returns, p)).toBeCloseTo(1, 14);
    expect(correlation(returns, negative, p)).toBeCloseTo(-1, 14);
    // Uncorrelated does not imply independent: r and its squared deviation.
    const squared = returns.map((r) => (r - mean) ** 2);
    expect(correlation(returns, squared, p)).toBeCloseTo(0, 14);
    expect(chapter).toContain('-1\\leq\\rho_{jk}\\leq 1');
  });

  it('no contradice la corrección auditada del apéndice PS2: media 5,1 %, no 5,3 %', () => {
    expect(expectedReturn([0.08, 0.05, 0.01], [0.3, 0.5, 0.2])).toBeCloseTo(0.051, 14);
  });

  it('plantilla: seis secciones, tres quizzes y ningún enlace a una sesión que no existe', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('sessions: []');
  });
});
