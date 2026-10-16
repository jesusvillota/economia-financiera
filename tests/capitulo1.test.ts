import { describe, expect, it } from 'vitest';
import { effectiveFromNominal, equivalentRate, fv, nominalFromEffective, proportionalRate, pv, simpleFV } from '../src/lib/finance/timeValue';
import { compoundGrowth, doublingTime, rule72 } from '../src/lib/finance/curves';

// Every number quoted in src/content/chapters/01-interes.mdx.
describe('capítulo 1', () => {
  it('ejemplo por defecto: 1.000 € al 5 % durante 10 años', () => {
    expect(simpleFV(1000, 0.05, 10)).toBe(1500);
    expect(fv(1000, 0.05, 10)).toBeCloseTo(1628.89, 2);
    expect(pv(1000, 0.05, 10)).toBeCloseTo(613.91, 2);
    expect(pv(105, 0.05, 1)).toBeCloseTo(100, 10);
    expect(fv(1000, 0.05, 2) - 1000 - 2 * 50).toBeCloseTo(2.5, 10); // interés del 2.º año: 52,50 €
  });
  it('simple frente a compuesta a 3 años al 8 % (corrige 1.259,70 y 19,70 de la nota)', () => {
    expect(simpleFV(1000, 0.08, 3)).toBe(1240);
    expect(fv(1000, 0.08, 3)).toBeCloseTo(1259.71, 2);
    expect(fv(1000, 0.08, 3) - simpleFV(1000, 0.08, 3)).toBeCloseTo(19.71, 2);
  });
  it('antes del primer año gana la simple', () => {
    expect(fv(1000, 0.05, 0.5)).toBeCloseTo(1024.7, 1);
    expect(simpleFV(1000, 0.05, 0.5)).toBe(1025);
  });
  it('duplicar al 5 %', () => {
    expect(doublingTime(0.05, 1)!).toBeCloseTo(14.2, 1);
    expect(rule72(0.05)!).toBeCloseTo(14.4, 10);
  });
  it('fraccionadas: simple proporcional, compuesta equivalente (8 % efectivo)', () => {
    expect(proportionalRate(0.06, 2)).toBeCloseTo(0.03, 12);
    expect(simpleFV(2e6, 0.06, 1)).toBe(2.12e6);
    const want = { 12: 0.6434, 6: 1.2909, 4: 1.9427, 3: 2.5986, 2: 3.923 };
    for (const [k, pct] of Object.entries(want)) expect(equivalentRate(0.08, +k) * 100).toBeCloseTo(pct, 3);
    expect(0.08 / 12).toBeGreaterThan(equivalentRate(0.08, 12));
  });
  it('nominal y efectivo', () => {
    expect(effectiveFromNominal(0.08, 12) * 100).toBeCloseTo(8.3, 2);
    expect(effectiveFromNominal(0.08, 2) * 100).toBeCloseTo(8.16, 2);
    expect(effectiveFromNominal(0.08, 4) * 100).toBeCloseTo(8.24, 2);
    expect(nominalFromEffective(0.08, 12) * 100).toBeCloseTo(7.72, 2);
    expect(equivalentRate(0.06, 12) * 100).toBeCloseTo(0.4868, 4);
    expect(effectiveFromNominal(0.12, 12) * 100).toBeCloseTo(12.68, 2);
  });
  it('zona de juego: 100 € al 8 % nominal 10 años', () => {
    expect(compoundGrowth(100, 0.08, 1, 10)).toBeCloseTo(215.89, 2);
    expect(compoundGrowth(100, 0.08, 12, 10)).toBeCloseTo(221.96, 2);
  });
  it('quiz: 500 € al 6 % durante 4 años', () => {
    expect(fv(500, 0.06, 4)).toBeCloseTo(631.24, 2);
    expect(simpleFV(500, 0.06, 4)).toBe(620);
  });
});
