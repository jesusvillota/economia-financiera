import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bondCashFlows, bondPrice, cashFlowRisk, durationPriceChange, bondPriceFromSpots,
  yieldToMaturity, macaulayDuration, forwardRate, priceFromSpotCurve } from '../src/lib/finance/bonds';
import { parts } from '../src/data/curriculum';

const chapter = readFileSync('src/content/chapters/19-duracion.mdx', 'utf8');
const bond = { face: 1000, couponRate: 0.04, maturity: 5 };
const y = 0.04;
const num = (x: number, digits = 2) => x.toFixed(digits).replace('.', ',');
const near = (x: number, expected: number, decimals = 2) => expect(x).toBeCloseTo(expected, decimals);
const printed = (value: number, digits = 2) => {
  const text = num(value, digits);
  expect(chapter.replaceAll('{,}', ',')).toContain(text);
};

describe('capítulo 19: cada número del texto', () => {
  it('seis secciones ordenadas, tres Quiz, un explorador y metadatos del currículo', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('<DurationExplorer client:visible />');
    for (const line of ['part: 5', 'chapter: 19', 'difficulty: 3', 'prerequisites: [17]', 'sessions: [04-mercados-bonos-derivados]']) expect(chapter).toContain(line);
    expect(parts.flatMap((p) => p.chapters).find((c) => c.number === 19))
      .toMatchObject({ slug: '19-duracion', difficulty: 3, prerequisites: [17] });
    expect(chapter).toContain('/chapters/17-bonos/');
  });

  it('nominal 1000, cupón 4 %, cinco años: cobros 40 y 1040 y precio inicial 1000', () => {
    const flows = bondCashFlows(bond);
    expect(flows).toEqual([
      { t: 1, amount: 40 }, { t: 2, amount: 40 }, { t: 3, amount: 40 },
      { t: 4, amount: 40 }, { t: 5, amount: 1040 },
    ]);
    near(bondPrice(bond, y), 1000, 10);
    near(flows.reduce((sum, f) => sum + f.amount / (1 + y) ** f.t / bondPrice(bond, y), 0), 1, 12);
    for (const amount of ['1000', '40', '1040']) expect(chapter).toContain(`${amount} €`);
  });

  it('Macaulay 4,630, modificada 4,452, convexidad 25,012; quiz 1', () => {
    const risk = cashFlowRisk(bondCashFlows(bond), y);
    near(risk.macaulay, 4.630, 3); printed(risk.macaulay, 3);
    near(risk.modified, 4.452, 3); printed(risk.modified, 3);
    near(risk.convexity, 25.012, 3); printed(risk.convexity, 3);
    near(risk.modified, risk.macaulay / (1 + y), 12);
    expect(risk.macaulay).toBeLessThan(5);
    const zero = { ...bond, couponRate: 0 };
    near(macaulayDuration(zero, y), 5, 12);
    // First and second derivatives verify the formula conventions used in the derivation.
    const h = 1e-4;
    near((bondPrice(bond, y - h) - bondPrice(bond, y + h)) / (2 * h * risk.price), risk.modified, 5);
    near((bondPrice(bond, y + h) - 2 * risk.price + bondPrice(bond, y - h)) / (h * h * risk.price), risk.convexity, 5);
  });

  it('subida 4 % a 5 %: shock 0,01, precio 956,71, pérdidas 43,29 / 44,52 / 43,27 y errores 1,22 / 0,03', () => {
    const shock = 0.05 - y;
    near(shock, 0.01, 12);
    const price = bondPrice(bond, y + shock);
    const actual = price - bondPrice(bond, y);
    const linear = durationPriceChange(bond, y, shock);
    const quadratic = durationPriceChange(bond, y, shock, true);
    near(price, 956.71); printed(price);
    near(-actual, 43.29); printed(-actual);
    near(-linear, 44.52); printed(-linear);
    near(-quadratic, 43.27); printed(-quadratic);
    near(Math.abs(actual - linear), 1.22); printed(Math.abs(actual - linear));
    near(Math.abs(actual - quadratic), 0.03); printed(Math.abs(actual - quadratic));
  });

  it('bajada simétrica: ganancia 45,80, corrección positiva; cero y cupón cero del juego; quiz 2', () => {
    const gain = bondPrice(bond, y - 0.01) - bondPrice(bond, y);
    near(gain, 45.80); printed(gain);
    expect(gain).toBeGreaterThan(bondPrice(bond, y) - bondPrice(bond, y + 0.01));
    for (const shock of [-0.02, -0.01, 0.01, 0.02]) {
      const actual = bondPrice(bond, y + shock) - bondPrice(bond, y);
      const linear = durationPriceChange(bond, y, shock);
      const quadratic = durationPriceChange(bond, y, shock, true);
      expect(quadratic).toBeGreaterThan(linear);
      expect(Math.abs(quadratic - actual)).toBeLessThan(Math.abs(linear - actual));
    }
    near(durationPriceChange(bond, y, 0), 0, 12);
    near(durationPriceChange(bond, y, 0, true), 0, 12);
    near(bondPrice(bond, y + 0) - bondPrice(bond, y), 0, 12);
    for (const maturity of [1, 5, 15]) near(macaulayDuration({ ...bond, maturity, couponRate: 0 }, y), maturity, 12);
  });

  const zero = { face: 1000, couponRate: 0, maturity: 2 };
  const coupon = { ...zero, couponRate: 0.05 };
  const oldCurve = [{ t: 1, rate: 0.03 }, { t: 2, rate: 0.035 }];
  const roundedCurve = [{ t: 1, rate: 0.035 }, { t: 2, rate: 0.04 }];

  it('PS4 6c: TIR de compra a 925 / 1035; Macaulay 2 / 1,953; no se mezcla la curva', () => {
    const zeroYield = yieldToMaturity(zero, 925), couponYield = yieldToMaturity(coupon, 1035);
    near(bondPrice(zero, zeroYield), 925, 10);
    near(bondPrice(coupon, couponYield), 1035, 10);
    near(macaulayDuration(zero, zeroYield), 2, 12);
    near(macaulayDuration(coupon, couponYield), 1.953, 3);
    printed(macaulayDuration(coupon, couponYield), 3);
    expect(couponYield).not.toBe(0.035);
  });

  it('audit PS4 6d: pierde más euros el bono con cupón, más porcentaje el cero; quiz 3', () => {
    const priceA = bondPriceFromSpots(zero, oldCurve), newA = bondPriceFromSpots(zero, roundedCurve);
    const priceB = bondPriceFromSpots(coupon, oldCurve), newB = bondPriceFromSpots(coupon, roundedCurve);
    for (const [actual, expected] of [[priceA, 933.51], [newA, 924.56], [priceB, 1028.73], [newB, 1019.09],
      [priceA - newA, 8.95], [priceB - newB, 9.64]]) { near(actual, expected); printed(actual); }
    near(100 * (1 - newA / priceA), 0.959, 3); printed(100 * (1 - newA / priceA), 3);
    near(100 * (1 - newB / priceB), 0.937, 3); printed(100 * (1 - newB / priceB), 3);
    expect(priceB - newB).toBeGreaterThan(priceA - newA);
    expect(1 - newA / priceA).toBeGreaterThan(1 - newB / priceB);
    expect(chapter).toContain('el bono con cupón pierde más **euros**');
    // Audit 6a: corrected 980.19 and 1028.73, never copy the source's 1028.72.
    near(priceFromSpotCurve([{ t: 2, amount: 1050 }], oldCurve), 980.19);
    expect(chapter).not.toContain('1028,72');
    // 6d printed prices use rounded 4%; the exact forward implies a slightly smaller spot.
    const exactSpot = Math.sqrt(1.035 * 1.045) - 1;
    near(forwardRate([{ t: 1, rate: 0.035 }, { t: 2, rate: exactSpot }], 1, 1), 0.045, 12);
    expect(exactSpot).toBeLessThan(0.04);
    near(exactSpot, 0.04, 4);
    expect(bondPriceFromSpots(coupon, [{ t: 1, rate: 0.035 }, { t: 2, rate: exactSpot }]))
      .not.toBeCloseTo(newB, 2);
  });

  it('inventario numérico: una cifra nueva exige ampliar la cobertura', () => {
    const body = chapter.split('---')[2].replace(/^import .*;$/gm, '').replaceAll('{,}', ',');
    const numbers = [...new Set((body.match(/\d+(?:,\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.'))))].sort((a, b) => a - b);
    // Includes formula constants, quiz indexes, PS4 exercise number and prerequisite link.
    expect(numbers).toEqual([0.01, 0.03, 0.937, 0.959, 1, 1.22, 1.953, 2, 3, 3.5, 4, 4.452, 4.5, 4.63, 5, 6,
      8.95, 9.64, 17, 25.012, 40, 43.27, 43.29, 44.52, 45.8, 924.56, 925, 933.51, 956.71,
      1000, 1019.09, 1028.73, 1035, 1040]);
  });
});
