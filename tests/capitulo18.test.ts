import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  bondCashFlows, bondPrice, bondPriceFromSpots, bootstrapSpotCurve, forwardRate,
  priceFromSpotCurve, spotFromZeroPrice,
} from '../src/lib/finance/bonds';
import { parts } from '../src/data/curriculum';

const chapter = readFileSync('src/content/chapters/18-estructura-temporal.mdx', 'utf8').replace(/\u00a0/g, ' ');
const curve = [0.02, 0.03, 0.04, 0.045, 0.05].map((rate, i) => ({ t: i + 1, rate }));
const ps4 = [0.03, 0.035, 0.04, 0.042, 0.043].map((rate, i) => ({ t: i + 1, rate }));
const bond = { face: 1000, couponRate: 0.05, maturity: 3 };
const num = (v: number) => v.toFixed(2).replace('.', ',');
const zero = (face: number, maturity: number) => ({ face, couponRate: 0, maturity });

describe('capítulo 18: cada número y ejemplo del texto', () => {
  it('six ordered sections, three quizzes, curriculum, prerequisite 17 and empty sessions', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map(m => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter.match(/<SpotForwardBuilder client:visible/g)).toHaveLength(1);
    for (const line of ['part: 5', 'chapter: 18', 'difficulty: 3', 'prerequisites: [17]', 'sessions: []']) expect(chapter).toContain(line);
    expect(parts.flatMap(p => p.chapters).find(c => c.number === 18))
      .toMatchObject({ slug: '18-estructura-temporal', difficulty: 3, prerequisites: [17] });
  });

  it('hook and quiz 1: 1000, spots 2/3%, year 1 gives 1020, year 2 gives 1060.90 and f11=4.01%', () => {
    const final = 1000 * 1.03 ** 2;
    const intermediate = 1000 * 1.02;
    // Validate both accumulated amounts by discounting them back through the library.
    expect(bondPriceFromSpots(zero(final, 2), curve)).toBeCloseTo(1000, 10);
    expect(bondPriceFromSpots(zero(intermediate, 1), curve)).toBeCloseTo(1000, 10);
    expect(num(final)).toBe('1060,90');
    expect(num(intermediate)).toBe('1020,00');
    expect(forwardRate(curve, 1, 1)).toBeCloseTo(final / intermediate - 1, 13);
    expect(num(forwardRate(curve, 1, 1) * 100)).toBe('4,01');
    for (const text of ['1000 €', '1060,90 €', '1020 €', '4,01 %']) expect(chapter).toContain(text);
    for (const distractor of [0.01, 0.03]) expect(forwardRate(curve, 1, 1)).not.toBeCloseTo(distractor, 3);
  });

  it('discount formula, zero 889.00, 5% annual flows 50/50/1050, PVs 49.02/47.13/933.45 and sum 1029.60', () => {
    expect(bondCashFlows(bond)).toEqual([{ t: 1, amount: 50 }, { t: 2, amount: 50 }, { t: 3, amount: 1050 }]);
    expect(num(bondPriceFromSpots(zero(1000, 3), curve))).toBe('889,00');
    for (const [i, printed] of ['49,02', '47,13', '933,45'].entries()) {
      expect(num(priceFromSpotCurve([bondCashFlows(bond)[i]], curve))).toBe(printed);
      expect(chapter).toContain(`${printed} €`);
    }
    expect(num(bondPriceFromSpots(bond, curve))).toBe('1029,60');
    expect(chapter).toContain('1029{,}60');
    for (const { t, rate } of curve) {
      const price = bondPriceFromSpots(zero(1000, t), curve);
      expect(price / 1000).toBeCloseTo((1 + rate) ** -t, 13);
      expect(spotFromZeroPrice(1000, price, t)).toBeCloseTo(rate, 13);
    }
    expect(bondPriceFromSpots(bond, curve)).not.toBeCloseTo(bondPrice(bond, 0.04), 2);
  });

  it('f12 uses two-year root: 5.01% annually, not the whole-interval return', () => {
    const f = forwardRate(curve, 1, 2);
    expect(num(f * 100)).toBe('5,01');
    expect((1 + f) ** 2).toBeCloseTo(1.04 ** 3 / 1.02, 13);
    expect((1 + f) ** 2 - 1).not.toBeCloseTo(2 * f, 4);
    expect(chapter).toContain('f_{1,2}=');
    expect(chapter).toContain('1/2');
  });

  it('bootstrap: zero 980.39 at year 1, 5% coupon bond 1038.75 at year 2 recover 2% and 3%', () => {
    const first = { ...zero(1000, 1), price: bondPriceFromSpots(zero(1000, 1), curve) };
    const secondBond = { ...bond, maturity: 2 };
    const second = { ...secondBond, price: bondPriceFromSpots(secondBond, curve) };
    expect(num(first.price)).toBe('980,39');
    expect(num(second.price)).toBe('1038,75');
    expect(chapter).toContain('980,39 €');
    expect(chapter).toContain('1038,75 €');
    const recovered = bootstrapSpotCurve([first, second]);
    recovered.forEach((n, i) => expect(n.rate).toBeCloseTo(curve[i].rate, 13));
    expect(() => bootstrapSpotCurve([second])).toThrow('Falta el spot');
  });

  it('source Ex 8: all five spots, corrected 4.00/5.01/4.50% forwards and rejected 5.00%', () => {
    for (const [s, k, printed] of [[1, 1, '4,00'], [2, 1, '5,01'], [1, 2, '4,50']] as const) {
      expect(num(forwardRate(ps4, s, k) * 100)).toBe(printed);
      expect(chapter).toContain(`${printed.replace(',', '{,}')}\\,\\%`);
    }
    expect(num(forwardRate(ps4, 2, 1) * 100)).not.toBe('5,00');
    expect(chapter).toContain('3 %, 3,5 %, 4 %, 4,2 % y 4,3 %');
    expect(forwardRate(ps4, 2, 1)).toBeGreaterThan(0.045);
  });

  it('audit PS4 Ex 8d: future spots can differ from the locked forward', () => {
    const locked = forwardRate(ps4, 2, 1);
    // Different future one-year spot curves can follow the same current curve.
    for (const futureRate of [0.02, 0.08]) {
      const futureCurve = [{ t: 1, rate: futureRate }];
      const floatingRepayment = 1000 * (1 + futureRate);
      const lockedRepayment = 1000 * (1 + locked);
      expect(bondPriceFromSpots(zero(floatingRepayment, 1), futureCurve)).toBeCloseTo(1000, 10);
      expect(spotFromZeroPrice(floatingRepayment, 1000, 1)).toBeCloseTo(futureRate, 13);
      expect(floatingRepayment < lockedRepayment).toBe(futureRate < locked);
      expect(floatingRepayment < 1045).toBe(futureRate < 0.045);
    }
    expect(bondPrice(zero(1045, 1), locked)).toBeLessThan(1000);
    expect(chapter).toContain('No demuestra que esperar vaya a costar más');
    expect(chapter).toContain('Identificarlo con una expectativa exige hipótesis adicionales');
  });

  it('flat 3% curve: every forward is 3%, initial bond 1056.57, coupon zero prices agree', () => {
    const flat = curve.map(n => ({ ...n, rate: 0.03 }));
    for (let s = 0; s < 5; s++) for (let k = 1; k <= 5 - s; k++) {
      expect(forwardRate(flat, s, k)).toBeCloseTo(0.03, 13);
    }
    expect(num(bondPriceFromSpots(bond, flat))).toBe('1056,57');
    expect(chapter).toContain('1056,57 €');
    for (let t = 1; t <= 5; t++) {
      expect(bondPriceFromSpots({ ...bond, couponRate: 0, maturity: t }, curve))
        .toBeCloseTo(priceFromSpotCurve([{ t, amount: 1000 }], curve), 12);
      expect(forwardRate(curve, 0, t)).toBeCloseTo(curve[t - 1].rate, 13);
    }
  });

  it('changing an interior spot raises the preceding forward and lowers the following one; negative forward allowed', () => {
    const raised = curve.map(n => ({ ...n, rate: n.t === 2 ? 0.035 : n.rate }));
    expect(forwardRate(raised, 1, 1)).toBeGreaterThan(forwardRate(curve, 1, 1));
    expect(forwardRate(raised, 2, 1)).toBeLessThan(forwardRate(curve, 2, 1));
    const falling = [{ t: 1, rate: 0.08 }, { t: 2, rate: 0.02 }];
    expect(forwardRate(falling, 1, 1)).toBeLessThan(0);
    expect((1.08) * (1 + forwardRate(falling, 1, 1))).toBeCloseTo(1.02 ** 2, 13);
    expect(() => forwardRate(curve, 0.5, 1)).toThrow('Falta el spot');
  });

  it('PS4 Ex 6d inverse relation recovers its forward without premature rounding', () => {
    const rate = Math.sqrt(1.035 * 1.045) - 1;
    expect(forwardRate([{ t: 1, rate: 0.035 }, { t: 2, rate }], 1, 1)).toBeCloseTo(0.045, 13);
    expect(chapter).toContain('ejercicio 6d');
  });

  it('numeric inventory: adding any new numeral requires extending the tests above', () => {
    const body = chapter.replace(/^---[\s\S]*?---/, '').replace(/^import .*;$/gm, '').replace(/_\{([\d,]+)\}/g, (_, indices: string) => indices.replace(/,/g, ' ')).replace(/\{,\}/g, ',');
    const numbers = [...new Set((body.match(/\d+(?:,\d+)?/g) ?? []).map(n => Number(n.replace(',', '.'))))].sort((a, b) => a - b);
    expect(numbers).toEqual([0, 1, 1.02, 1.03, 1.04, 2, 3, 3.5, 4, 4.01, 4.2, 4.3, 4.5, 5, 5.01, 6, 8, 47.13, 49.02, 50, 889, 933.45, 980.39, 1000, 1020, 1029.60, 1038.75, 1050, 1056.57, 1060.90]);
  });
});
