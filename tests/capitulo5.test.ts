import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { capitalWeights, discountedCashFlow, enterpriseToEquity, fcfe, fcfeFromFcff, fcff, pricePerShare, terminalValue, wacc } from '../src/lib/finance/valuation';

// Numeric inventory for 05-empresa-wacc.mdx: all inputs, intermediate results,
// rounded outputs, widget constants and the two numeric quizzes are covered below.
describe('capítulo 5: Taller Norte', () => {
  const flows = [80, 90, 100]; // end of years 1, 2, 3; continuity starts in year 4
  const r = wacc(60, 40, 0.12, 0.06, 0.25);
  const tv = terminalValue(100, r, 0.02);
  const value = discountedCashFlow(flows, r, tv);

  it('160 EBIT, 25 % impuesto, 20 amortización, 50 capex y 10 circulante → 80 FCFF', () => {
    expect(fcff(160, 0.25, 20, 50, 10)).toBe(80);
  });

  it('20 intereses y 5 deuda emitida → 105 beneficio neto y 70 FCFE; ahorro fiscal correcto', () => {
    const netIncome = (160 - 20) * (1 - 0.25);
    expect(netIncome).toBe(105);
    expect(20 * (1 - 0.25)).toBe(15);
    expect(fcfe(netIncome, 20, 50, 10, 5)).toBe(70);
    expect(fcfeFromFcff(80, 20, 0.25, 5)).toBe(70); // also quiz 2
  });

  it('60/40 pesos, 12 % propio, 6 % deuda, 25 % impuesto → 9 % WACC', () => {
    expect(capitalWeights(60, 40)).toEqual({ equity: 0.6, debt: 0.4 });
    expect(0.6 + 0.4).toBe(1);
    expect(wacc(0, 40, 0.12, 0.06, 0.25)).toBeCloseTo(0.045, 12);
    expect(0.6 * 0.12 * 100).toBeCloseTo(7.2, 12);
    expect(0.4 * 0.06 * (1 - 0.25) * 100).toBeCloseTo(1.8, 12);
    expect(r).toBeCloseTo(0.09, 12);
  });

  it('tres flujos: 73,39; 75,75; 77,22 € de hoy', () => {
    const expected = [73.39, 75.75, 77.22];
    flows.forEach((_, i) => {
      expect(discountedCashFlow(flows.map((v, j) => i === j ? v : 0), r)).toBeCloseTo(expected[i], 2);
    });
  });

  it('2 % perpetuo, 102 en año 4 → 1457,14 terminal en año 3; VA 1125,18', () => {
    expect(100 * (1 + 0.02)).toBe(102);
    expect(tv).toBeCloseTo(1457.14, 2);
    expect(discountedCashFlow([0, 0, 0], r, tv)).toBeCloseTo(1125.18, 2); // also quiz 3
    expect(value).toBeCloseTo(1351.55, 2);
  });

  it('50 caja y 300 deuda → 1101,55 equity; 100 acciones → 11,02 por acción', () => {
    const equity = enterpriseToEquity(value, 300, 50);
    expect(equity).toBeCloseTo(1101.55, 2);
    expect(pricePerShare(equity, 100)).toBeCloseTo(11.02, 2);
  });

  it('dirección de los experimentos y límites del widget', () => {
    const higherRate = wacc(60, 40, 0.16, 0.06, 0.25);
    expect(higherRate).toBeGreaterThan(r);
    expect(discountedCashFlow(flows, higherRate, terminalValue(100, higherRate, 0.02))).toBeLessThan(value);
    expect(discountedCashFlow(flows, r, terminalValue(100, r, 0.04))).toBeGreaterThan(value);
    expect(enterpriseToEquity(value, 350, 50)).toBeLessThan(enterpriseToEquity(value, 300, 50));
    expect(enterpriseToEquity(value, 2000, 50)).toBeLessThan(0);
    expect(() => terminalValue(100, 0.06, 0.06)).toThrow();
    expect(() => terminalValue(100, 0.05, 0.06)).toThrow();
  });

  it('source note FCFE example is underdetermined: missing interest or net income (AUDIT §2)', () => {
    const firmFlow = fcff(140, 0.25, 32, 60, 8);
    expect(firmFlow).toBe(69);
    expect(fcfeFromFcff(firmFlow, 0, 0.25, -2)).toBe(67);
    expect(fcfeFromFcff(firmFlow, 20, 0.25, -2)).toBe(52);
    // Both interest assumptions fit the provided inputs, but produce different FCFE.
  });

  it('six sections and three quizzes follow the chapter contract', () => {
    const text = readFileSync('src/content/chapters/05-empresa-wacc.mdx', 'utf8');
    expect([...text.matchAll(/^## <span class="section-tag">([^<]+)/gm)].map((m) => m[1])).toEqual([
      'Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen',
    ]);
    expect(text.match(/<Quiz client:visible/g)).toHaveLength(3);
  });
});
