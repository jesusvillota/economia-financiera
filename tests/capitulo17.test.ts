import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  accruedCoupon, bondAtSettlement, bondCashFlows, bondPrice, cleanPrice,
  dirtyPrice, priceFromCashFlows, yieldFromCashFlows, yieldToMaturity,
} from '../src/lib/finance/bonds';
import { chapter17Bond as b, chapter17Yield as y, previousCoupon17 as previous, nextCoupon17 as next, settlementDate17 as date } from '../src/data/bond17';
import { parts } from '../src/data/curriculum';

const text = readFileSync('src/content/chapters/17-bonos.mdx', 'utf8').replaceAll('\u00a0', ' ');
const cents = (n: number) => n.toFixed(2).replace('.', ',');
const price = bondPrice(b, y);
const quote = bondAtSettlement(b, previous, date(146), next);
const dirty = priceFromCashFlows(quote.flows, y);
const clean = cleanPrice(dirty, quote.accrued);

describe('capítulo 17: every number in the text', () => {
  it('metadata and six ordered sections; one widget and three quizzes', () => {
    expect([...text.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    for (const value of ['part: 5', 'chapter: 17', 'difficulty: 2', 'prerequisites: [2]', 'sessions: [04-mercados-bonos-derivados, examen-final]']) expect(text).toContain(value);
    expect(parts.flatMap((p) => p.chapters).find((c) => c.number === 17))
      .toMatchObject({ slug: '17-bonos', difficulty: 2, prerequisites: [2] });
    expect(text.match(/<BondExplorer client:visible/g)).toHaveLength(1);
    expect(text.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(text.match(/answer=\{1\}/g)).toHaveLength(3);
    expect(text).toContain('/chapters/02-valor-actual/');
    expect(text).toContain('ejercicios 6 y 9 de PS4');
  });
  it('hook, cash-flow table and worked sum: 1000, 4%, 3 years, 40/40/1040 and 972.77 at 5%', () => {
    expect(b).toEqual({ face: 1000, couponRate: 0.04, maturity: 3, frequency: 1 });
    expect(y).toBe(0.05);
    const flows = bondCashFlows(b);
    expect(flows).toEqual([{ t: 1, amount: 40 }, { t: 2, amount: 40 }, { t: 3, amount: 1040 }]);
    expect(price).toBeCloseTo(40 / 1.05 + 40 / 1.05 ** 2 + 1040 / 1.05 ** 3, 10);
    expect(cents(price)).toBe('972,77');
    expect(yieldToMaturity(b, price)).toBeCloseTo(y, 12);
    for (const v of ['1000 € dentro de 3 años', '40 €', '4 %', '5 %', '972,77 €',
      '| 1 | 40 € | 0 € | 40 € |', '| 2 | 40 € | 0 € | 40 € |', '| 3 | 40 € | 1000 € | 1040 € |',
      '1000\\cdot0{,}04=40', '1{,}05^2', '1{,}05^3', '972{,}77']) expect(text).toContain(v);
  });
  it('3% gives 1028.29; 4% gives par 1000; zero coupons and zero accrued', () => {
    expect(cents(bondPrice(b, 0.03))).toBe('1028,29');
    expect(bondPrice(b, 0.04)).toBeCloseTo(1000, 10);
    expect(text).toContain('TIR del 3 % da un precio de 1028,29 €');
    expect(text).toContain('TIR es el 4 %, el precio es 1000 €');
    const zero = { ...b, couponRate: 0 };
    expect(bondCashFlows(zero)).toEqual([{ t: 1, amount: 0 }, { t: 2, amount: 0 }, { t: 3, amount: 1000 }]);
    expect(bondAtSettlement(zero, previous, date(146), next).accrued).toBe(0);
    expect(bondPrice({ ...zero, maturity: 4 }, y)).toBeLessThan(bondPrice(zero, y));
  });
  it('annual Actual/Actual example: 2026 to 2027, 365 days, 146 days=40%, accrued 16, dirty 991.94, clean 975.94', () => {
    expect(previous.toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(next.toISOString().slice(0, 10)).toBe('2027-01-01');
    expect((next.getTime() - previous.getTime()) / 86400000).toBe(365);
    expect((date(146).getTime() - previous.getTime()) / 86400000).toBe(146);
    expect(accruedCoupon(1, previous, date(146), next)).toBe(0.4);
    expect(quote.coupon).toBe(40);
    expect(quote.accrued).toBe(16);
    expect(quote.flows.map((f) => f.t)).toEqual([0.6, 1.6, 2.6]);
    expect(cents(dirty)).toBe('991,94');
    expect(cents(clean)).toBe('975,94');
    expect(dirtyPrice(clean, quote.accrued)).toBeCloseTo(dirty, 12);
    expect(yieldFromCashFlows(quote.flows, dirty)).toBeCloseTo(y, 12);
    for (const v of ['1 de enero de 2026', '1 de enero de 2027', '365 días', '146 días', '40 % del periodo',
      '16 €', '991,94 €', '975,94 €']) expect(text).toContain(v);
    const start = bondAtSettlement(b, previous, previous, next);
    expect(start.accrued).toBe(0);
    expect(start.flows).toEqual(bondCashFlows(b));
    expect(cleanPrice(price, start.accrued)).toBe(price);
  });
  it('quiz readouts, including all numerical distractors', () => {
    expect(price).toBeLessThan(b.face);
    const options = [cents(clean), cents(dirty), cents(cleanPrice(clean, quote.accrued))];
    expect(options).toEqual(['975,94', '991,94', '959,94']);
    expect(text).toContain("options={['975,94 €', '991,94 €', '959,94 €']}");
    expect(text).toContain('40 €, 40 € y 1040 € valen 972,77 €');
  });
  it('coupon frequency and nominal/effective conversion agree with bonds.ts', () => {
    for (const m of [1, 2, 4]) {
      const bond = { ...b, frequency: m };
      const flows = bondCashFlows(bond);
      expect(flows).toHaveLength(m * b.maturity);
      expect(flows[0].amount).toBe(b.face * b.couponRate / m);
      expect(priceFromCashFlows(flows, (1 + y / m) ** m - 1)).toBeCloseTo(bondPrice(bond, y), 10);
    }
  });
  it('audit §2: PS4 Ex 9 month fractions are not actual calendar days', () => {
    const d = (s: string) => new Date(`${s}T00:00:00Z`);
    const actual = accruedCoupon(36.25, d('2026-02-15'), d('2026-04-15'), d('2026-05-15'));
    expect(actual).toBeCloseTo(36.25 * 59 / 89, 12);
    expect(cents(actual)).toBe('24,03');
    expect(cents(36.25 * 2 / 3)).toBe('24,17');
    const audit = readFileSync('docs/AUDIT.md', 'utf8');
    expect(audit).toContain('ps4 Ex 9: month fractions are not actual day counts');
    expect(audit).toContain('tests/capitulo17.test.ts');
    expect(text).toContain('PS4 usa fracciones de meses');
  });
  it('numerical inventory rejects new figures without corresponding tests', () => {
    const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^import .*$/gm, '')
      .replace(/\]\([^)]*\)/g, ']').replace(/answer=\{\d+\}/g, '').replace(/^\d+\. /gm, '')
      .replaceAll('{,}', ',').replaceAll('{.}', '.');
    expect([...new Set(body.match(/\d+(?:[.,]\d+)*/g))].sort()).toEqual([
      '0', '0,04', '1', '1000', '1028,29', '1040', '146', '16', '2', '2026', '2027', '3', '365',
      '4', '40', '5', '6', '9', '959,94', '972,77', '975,94', '991,94', '1,05',
    ].sort());
  });
});

describe('settlement helper and widget domain', () => {
  it('keeps all boundary combinations valid and inverts the dirty price', () => {
    for (const couponRate of [0, 0.04, 0.1]) for (const maturity of [1, 3, 20]) {
      for (const day of [0, 146, 364]) for (const rate of [0, 0.05, 0.12]) {
        const s = bondAtSettlement({ ...b, couponRate, maturity }, previous, date(day), next);
        const p = priceFromCashFlows(s.flows, rate);
        expect(s.flows.every((f) => f.t > 0)).toBe(true);
        expect(cleanPrice(p, s.accrued)).toBeGreaterThan(0);
        expect(yieldFromCashFlows(s.flows, p)).toBeCloseTo(rate, 10);
      }
    }
  });
  it('rejects payment boundary, outside dates, invalid bond and invalid dates', () => {
    for (const day of [-1, 365, 366]) expect(() => bondAtSettlement(b, previous, date(day), next)).toThrow(RangeError);
    expect(() => bondAtSettlement({ ...b, maturity: 0 }, previous, previous, next)).toThrow(RangeError);
    expect(() => bondAtSettlement(b, previous, new Date(NaN), next)).toThrow(RangeError);
    expect(() => bondAtSettlement(b, next, next, previous)).toThrow(RangeError);
  });
  it('also shifts semiannual and quarterly periods by their own frequency', () => {
    for (const frequency of [2, 4]) {
      const s = bondAtSettlement({ ...b, frequency }, previous, date(146), next);
      expect(s.flows[0].t).toBeCloseTo(0.6 / frequency, 12);
      expect(s.coupon).toBe(40 / frequency);
      expect(s.accrued).toBe(16 / frequency);
    }
  });
});
