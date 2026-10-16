import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  dividendPrice, dividendSchedule, gordonPrice, impliedGrowth,
  multiStageDDM, requiredReturn, ValuationError,
} from '../src/lib/finance/valuation';

// Numerical inventory for 04-dividendos.mdx: dates and rates are inputs below;
// every quoted computed amount (including quiz explanations) is asserted here.
describe('capítulo 4: dividendos', () => {
  it('gancho, crecimiento nulo, Gordon y primer quiz: D1 = 3, r = 10 %, g = 0/4 %', () => {
    expect(gordonPrice(3, 0.1, 0)).toBeCloseTo(30, 12);
    expect(gordonPrice(3, 0.1, 0.04)).toBeCloseTo(50, 12);
    expect(requiredReturn(50, 3, 0.04)).toBeCloseTo(0.1, 12);
    expect(requiredReturn(50, 3, 0)).toBeCloseTo(0.06, 12); // 3/50 = 6 %
    expect(impliedGrowth(50, 3, 0.1)).toBeCloseTo(0.04, 12);
  });

  it('venta al final del segundo año: D1 = 3, D2 = 4, P2 = 48, r = 10 %', () => {
    expect(dividendPrice([3, 4], 0.1, 48)).toBeCloseTo(45.70, 2);
  });

  it('Brasa: D0 = 2,50, crecimiento inicial 20 % por dos años, luego 4 %, r = 10 %', () => {
    const dividends = dividendSchedule(2.5, [{ growth: 0.2, periods: 2 }]);
    expect(dividends).toHaveLength(2);
    expect(dividends[0]).toBeCloseTo(3, 12);
    expect(dividends[1]).toBeCloseTo(3.60, 12);
    const [next] = dividendSchedule(dividends[1], [{ growth: 0.04, periods: 1 }]);
    expect(next).toBeCloseTo(3.744, 12);
    const continuation = gordonPrice(next, 0.1, 0.04);
    expect(continuation).toBeCloseTo(62.40, 12);
    expect(dividendPrice(dividends, 0.1, continuation)).toBeCloseTo(57.27, 2);
    expect(multiStageDDM(2.5, [{ growth: 0.2, periods: 2 }], 0.1, 0.04)).toBeCloseTo(57.27, 2);
  });

  it('zona de juego: g = 4 → 6 %, r = 10 → 12 %, y crecimiento negativo', () => {
    expect(gordonPrice(3, 0.1, 0.04)).toBeCloseTo(50, 12);
    expect(gordonPrice(3, 0.1, 0.06)).toBeCloseTo(75, 12);
    expect(gordonPrice(3, 0.12, 0.04)).toBeCloseTo(37.50, 12);
    expect(gordonPrice(3, 0.1, -0.02)).toBeLessThan(gordonPrice(3, 0.1, 0));
  });

  it('D1 sigue a D0: el pago ya recibido no vuelve a entrar en el precio', () => {
    expect(multiStageDDM(2.5, [], 0.1, 0.04)).toBeCloseTo(gordonPrice(2.6, 0.1, 0.04), 12);
  });

  it('r = g y r < g: Gordon rechaza ambos casos (segundo quiz)', () => {
    expect(() => gordonPrice(3, 0.1, 0.1)).toThrow(ValuationError);
    expect(() => gordonPrice(3, 0.1, 0.12)).toThrow(ValuationError);
    const equalRatePayments = dividendSchedule(3 / 1.1, [{ growth: 0.1, periods: 20 }]);
    // At r = g every discounted dividend is 3/1.1; doubling the horizon doubles the sum.
    expect(dividendPrice(equalRatePayments, 0.1)).toBeCloseTo(2 * dividendPrice(equalRatePayments.slice(0, 10), 0.1), 12);
  });

  it('audit note 02 §1.1: r > 0 no basta para anular el precio terminal descontado', () => {
    // Counterexample to the source claim: P_N = 50(1+r)^N has constant discounted value.
    for (const n of [1, 2, 20, 100]) {
      expect(dividendPrice(Array(n).fill(0), 0.1, 50 * 1.1 ** n)).toBeCloseTo(50, 10);
    }
    // With Gordon-consistent future prices and r > g, the discounted tail decreases.
    const tail = (n: number) => {
      const dividends = dividendSchedule(3 / 1.04, [{ growth: 0.04, periods: n + 1 }]);
      return dividendPrice(Array(n).fill(0), 0.1, gordonPrice(dividends[n], 0.1, 0.04));
    };
    expect(tail(100)).toBeLessThan(tail(20));
    expect(tail(1000)).toBeLessThan(1e-20);
  });

  it('seis secciones, tres quizzes y un widget en el orden de la plantilla', () => {
    const chapter = readFileSync(new URL('../src/content/chapters/04-dividendos.mdx', import.meta.url), 'utf8');
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter.match(/<DividendDiscount client:visible/g)).toHaveLength(1);
  });
});
