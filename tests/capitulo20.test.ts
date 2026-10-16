import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { discountFactor, forwardPrice, forwardValue, forwardPayoff, futuresMarginAccount, seededFuturesPrices } from '../src/lib/finance/derivatives';
import { parts } from '../src/data/curriculum';

const chapter = readFileSync('src/content/chapters/20-forwards-futuros.mdx', 'utf8');
const num = (x: number, digits = 2) => x.toFixed(digits).replace('.', ',');
const input = { prices: seededFuturesPrices(2710), position: 'short' as const, contracts: 2, multiplier: 10, initialMargin: 200, maintenanceMargin: 120 };

describe('capítulo 20: todos los números y convenciones del texto', () => {
  it('seis secciones en orden, tres quizzes, dos widgets y metadatos', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    for (const widget of ['ForwardExplorer', 'FuturesMargin']) expect(chapter).toContain(`<${widget} client:visible />`);
    const entry = parts.flatMap((part) => part.chapters).find((c) => c.number === 20)!;
    expect(entry).toMatchObject({ slug: '20-forwards-futuros', difficulty: 3, prerequisites: [18] });
    for (const line of ['part: 5', 'chapter: 20', 'difficulty: 3', 'prerequisites: [18]', 'sessions: []']) expect(chapter).toContain(line);
  });

  it('gancho y quiz 1: 60 €, 5 %, un año, 63 € y valor inicial cero', () => {
    const price = forwardPrice(60, 0.05, 1);
    expect(price).toBeCloseTo(63, 12);
    expect(forwardValue(60, price, 0.05, 1)).toBe(0);
    expect(price).not.toBe(60); // Distractor: ignores financing.
    for (const text of ['60 €', '5 %', '63 €', "options={['60 €', '63 €', 'El precio no depende del interés']}"])
      expect(chapter).toContain(text);
  });

  it('PS4 Ex 10a: 45 €, 4 %, 2 años, 48,672 y 48,67 €', () => {
    const price = forwardPrice(45, 0.04, 2);
    expect(price).toBeCloseTo(48.672, 12);
    expect(num(price, 3)).toBe('48,672');
    expect(num(price)).toBe('48,67');
    expect(chapter).toContain('48{,}672');
    expect(chapter).toContain('48,67');
    expect(forwardValue(45, price, 0.04, 2)).toBe(0);
  });

  it('audit PS4 Ex 10b: medio año transcurrido, 1,5 restante, 0,9429; 45,26; 4,74, nunca 4,76', () => {
    const remaining = 2 - 0.5;
    expect(remaining).toBe(1.5);
    const df = discountFactor(0.04, remaining);
    expect(num(df, 4)).toBe('0,9429');
    expect(num(48 * df)).toBe('45,26');
    const value = forwardValue(50, 48, 0.04, remaining);
    expect(num(value)).toBe('4,74');
    expect(value).not.toBeCloseTo(4.76, 2);
    expect(value).toBeCloseTo((forwardPrice(50, 0.04, remaining) - 48) * df, 12);
    expect(forwardValue(50, 48, 0.04, remaining, 'short')).toBeCloseTo(-value, 12);
    for (const text of ['1,5 años', '0{,}9429', '45{,}26', '4{,}74', 'da 4,76 € por un error']) expect(chapter).toContain(text);
    expect(forwardValue(50, 48, 0.04, 2)).not.toBeCloseTo(value, 2);
  });

  it('quiz 2 y vencimiento: 45 − 48 = −3 €, obligación y no opción', () => {
    expect(forwardPayoff(45, 48)).toBe(-3);
    expect(forwardValue(45, 48, 0.04, 0)).toBe(-3);
    expect(forwardPayoff(45, 48, 'short')).toBe(3);
    expect(forwardPayoff(45, 48)).not.toBe(0);
    expect(discountFactor(0.04, 0)).toBe(1);
    expect(chapter).toContain('El pago es 45 − 48 = −3 €');
  });

  it('nuevo ejercicio: precios 100, 103, 108, 104, 99; contratos 2; multiplicador 10; márgenes 200/120', () => {
    expect(input.prices).toEqual([100, 103, 108, 104, 99]);
    const account = futuresMarginAccount(input);
    expect(account.days.map((d) => d.day)).toEqual([1, 2, 3, 4]);
    expect(account.days.map((d) => d.variationMargin)).toEqual([-60, -100, 80, 100]);
    expect(account.days.map((d) => d.balanceBeforeCall)).toEqual([140, 40, 280, 380]);
    expect(account.days.map((d) => d.marginCall)).toEqual([0, 160, 0, 0]);
    expect(account.days.map((d) => d.balance)).toEqual([140, 200, 280, 380]);
    expect(account.totalGain).toBe(20);
    expect(account.balance - input.initialMargin - 160).toBe(20);
    expect(input.contracts * input.multiplier * forwardPayoff(99, 100, 'short')).toBe(account.totalGain);
    for (const row of account.days) {
      expect(row.balance).toBe(input.initialMargin + row.cumulativeVariationMargin - row.cumulativeWithdrawals);
      expect(row.payout).toBe(0);
    }
    for (const text of ['103, 108, 104 y 99', '140 €', '40 €', '160 €', '280 €', '380 €', '20 €']) expect(chapter).toContain(text);
  });

  it('quiz 3: restaura a 200, no a 120; 80 y 100 son distractores', () => {
    const row = futuresMarginAccount(input).days[1];
    expect(row.balanceBeforeCall).toBe(40);
    expect(row.marginCall).toBe(160);
    expect(row.balanceBeforeCall + 80).toBe(120);
    expect(-row.variationMargin).toBe(100);
    expect(row.marginCall).not.toBe(80);
    expect(row.marginCall).not.toBe(100);
    expect(chapter).toContain("options={['80 €', '160 €', '100 €']}");
  });

  it('igualdad con mantenimiento no llama; más contratos pueden exigir reposición y saldo negativo', () => {
    const equal = futuresMarginAccount({ ...input, prices: [100, 104] }).days[0];
    expect(equal.balanceBeforeCall).toBe(120);
    expect(equal.marginCall).toBe(0);
    const below = futuresMarginAccount({ ...input, prices: [100, 105] }).days[0];
    expect(below.balanceBeforeCall).toBe(100);
    expect(below.marginCall).toBe(100);
    const negative = futuresMarginAccount({ ...input, contracts: 4, prices: [100, 108] }).days[0];
    expect(negative.balanceBeforeCall).toBe(-120);
    expect(negative.balance).toBe(200);
  });

  it('semillas reproducibles, sin mutaciones y sin precios negativos; largo/corto invierten ganancias', () => {
    expect(seededFuturesPrices(2710)).toEqual(seededFuturesPrices(2710));
    expect(seededFuturesPrices(2711)).not.toEqual(input.prices);
    for (const seed of [2710, 2711, 2712, 0, 100]) {
      const prices = seededFuturesPrices(seed);
      expect(prices).toHaveLength(5);
      expect(prices[0]).toBe(100);
      for (let d = 1; d < prices.length; d++) expect(Math.abs(prices[d] - prices[d - 1])).toBeLessThanOrEqual(5);
      const long = futuresMarginAccount({ ...input, prices, position: 'long' });
      const short = futuresMarginAccount({ ...input, prices });
      expect(long.totalGain).toBe(-short.totalGain);
      expect(prices).toEqual(seededFuturesPrices(seed));
    }
    for (const seed of [-1, 1.5, Infinity, NaN]) expect(() => seededFuturesPrices(seed)).toThrow(RangeError);
  });

  it('inventario: toda cifra nueva en el texto exige cobertura (incluye referencias y exponentes)', () => {
    const body = chapter.split('---')[2].replace(/^import .*;$/gm, '').replace(/\{,\}/g, ',');
    const numbers = [...new Set((body.match(/\d+(?:,\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.'))))].sort((a, b) => a - b);
    expect(numbers).toEqual([0, 0.9429, 1, 1.04, 1.05, 1.5, 2, 3, 4, 4.74, 4.76, 5, 10, 20, 40, 45, 45.26, 48, 48.672, 48.67, 50, 60, 63, 80, 99, 100, 103, 104, 108, 120, 140, 160, 200, 280, 380].sort((a,b) => a-b));
  });
});
