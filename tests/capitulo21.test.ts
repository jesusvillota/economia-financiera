import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { optionDefaults, optionStrategies, optionStrategyLegs } from '../src/data/optionStrategies';
import { optionPayoff, optionProfit, strategyCost, strategyPayoff, strategyProfit, breakevens,
  bullSpread, straddle, forwardValue, discountFactor } from '../src/lib/finance/derivatives';
import { parts } from '../src/data/curriculum';

const chapter = readFileSync('src/content/chapters/21-opciones.mdx', 'utf8');
const legs = (s: Parameters<typeof optionStrategyLegs>[0]) => optionStrategyLegs(s, optionDefaults);

describe('capítulo 21: cada cifra del texto y las estrategias', () => {
  it('seis secciones, tres Quiz, un explorador y prerrequisito 20; sesiones vacías', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map(m => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('<OptionPayoffs client:visible />');
    for (const line of ['part: 5', 'chapter: 21', 'difficulty: 3', 'prerequisites: [20]', 'sessions: []']) expect(chapter).toContain(line);
    expect(parts.flatMap(p => p.chapters).find(c => c.number === 21))
      .toMatchObject({ slug: '21-opciones', difficulty: 3, prerequisites: [20] });
    expect(chapter).toContain('https://jesusvillota.github.io/options-explained/');
  });

  it.each([[80, 0, -6], [100, 0, -6], [106, 6, 0], [120, 20, 14]])(
    'call: K100, prima6, S=%s → pago%s, beneficio%s; venta invierte el signo', (s, h, profit) => {
      expect(optionPayoff('call', s, 100)).toBe(h);
      expect(optionProfit('call', s, 100, 6)).toBe(profit);
      expect(strategyProfit(legs('call'), s)).toBe(profit);
      expect(strategyProfit(legs('short-call'), s)).toBeCloseTo(-profit);
      expect(strategyCost(legs('short-call'))).toBe(-6);
    });

  it('call: equilibrio106, pérdida máxima6; venta gana como máximo6 y no limita pérdidas', () => {
    expect(breakevens(legs('call'))).toEqual({ points: [106], intervals: [] });
    expect(strategyProfit(legs('call'), 0)).toBe(-6);
    expect(strategyProfit(legs('short-call'), 0)).toBe(6);
    expect(strategyProfit(legs('short-call'), 10000)).toBe(-9894);
    for (const text of ['100 €', '6 €', '120 €', '20 €', '14 €', '80 €', '106 €', '−14 €']) expect(chapter).toContain(text);
  });

  it('put: K100, prima5, pago20 y beneficio15 en S80; equilibrio95; límites−5 y95', () => {
    expect(optionPayoff('put', 80, 100)).toBe(20);
    expect(optionProfit('put', 80, 100, 5)).toBe(15);
    expect(breakevens(legs('put'))).toEqual({ points: [95], intervals: [] });
    expect(strategyProfit(legs('put'), 100)).toBe(-5);
    expect(strategyProfit(legs('put'), 0)).toBe(95);
    for (const s of [0, 80, 95, 100, 200]) expect(strategyProfit(legs('short-put'), s)).toBeCloseTo(-strategyProfit(legs('put'), s));
    for (const text of ['15 €', '95 €', '5 €']) expect(chapter).toContain(text);
  });

  it('spread: ejercicios100/120, primas6/2, coste4, pérdida4, ganancia16, equilibrio104; quiz2', () => {
    const spread = bullSpread(100, 120, 6, 2);
    expect(legs('bull')).toEqual(spread);
    expect(strategyCost(spread)).toBe(4);
    expect(strategyProfit(spread, 0)).toBe(-4);
    expect(strategyProfit(spread, 100)).toBe(-4);
    expect(strategyPayoff(spread, 120)).toBe(20);
    expect(strategyProfit(spread, 120)).toBe(16);
    expect(strategyProfit(spread, 200)).toBe(16);
    expect(breakevens(spread)).toEqual({ points: [104], intervals: [] });
    for (const text of ['2 €', '4 €', '16 €', '104 €', '200 €']) expect(chapter).toContain(text);
    expect(chapter).toContain("options={['20 €', '4 €', '16 €']}");
  });

  it('straddle: coste11, perte11 en100, equilibrios89/111 y ganancia9 en120; quiz3', () => {
    const both = straddle(100, 6, 5);
    expect(legs('straddle')).toEqual(both);
    expect(strategyCost(both)).toBe(11);
    expect(strategyProfit(both, 100)).toBe(-11);
    expect(strategyProfit(both, 120)).toBe(9);
    expect(breakevens(both)).toEqual({ points: [89, 111], intervals: [] });
    for (const s of [89, 111]) expect(strategyProfit(both, s)).toBe(0);
    for (const text of ['11 €', '89 €', '111 €', '9 €']) expect(chapter).toContain(text);
    expect(chapter).toContain("options={['Pierdes 11 €', 'Quedas en equilibrio', 'Ganas 11 €']}");
  });

  it.each([
    ['covered', 94, [94], -94, 6],
    ['protective', 105, [105], -5, 95],
    ['bear', 3, [97], 17, -3],
    ['strangle', 4, [76, 124], 76, 76],
    ['collar', 100, [100], -20, 20],
  ] as const)('%s: patas, coste%s, equilibrios y extremos verificados independientemente', (strategy, cost, zeros, atZero, at200) => {
    expect(strategyCost(legs(strategy))).toBe(cost);
    expect(breakevens(legs(strategy))).toEqual({ points: [...zeros], intervals: [] });
    expect(strategyProfit(legs(strategy), 0)).toBe(atZero);
    expect(strategyProfit(legs(strategy), 200)).toBe(at200);
  });

  it('cada estrategia usa las patas y primas correctas, también al cambiar las entradas', () => {
    const p = { strike: 110, width: 30, call: 8, put: 7, outer: 3, spot: 90 };
    const call = { type: 'call', quantity: 1, strike: 110, premium: 8 };
    const put = { type: 'put', quantity: 1, strike: 110, premium: 7 };
    const low = { type: 'put', quantity: 1, strike: 80, premium: 3 };
    const high = { type: 'call', quantity: -1, strike: 140, premium: 3 };
    const stock = { type: 'stock', quantity: 1, entryPrice: 100 };
    const expected = {
      call: [call], 'short-call': [{ ...call, quantity: -1 }],
      put: [put], 'short-put': [{ ...put, quantity: -1 }],
      covered: [stock, { ...call, quantity: -1 }], protective: [stock, put],
      bull: [call, high], bear: [put, { ...low, quantity: -1 }],
      straddle: [call, put], strangle: [low, { ...high, quantity: 1 }], collar: [stock, low, high],
    };
    expect(optionStrategies).toHaveLength(11);
    for (const s of optionStrategies) expect(optionStrategyLegs(s.value, p)).toEqual(expected[s.value]);
  });

  it('primas cero o coste igual a la anchura: equilibrios completos, sin perder sus extremos', () => {
    expect(breakevens(optionStrategyLegs('call', { ...optionDefaults, call: 0 })))
      .toEqual({ points: [], intervals: [{ from: 0, to: 100 }] });
    expect(breakevens(bullSpread(100, 120, 20, 0)))
      .toEqual({ points: [], intervals: [{ from: 120, to: null }] });
    expect(breakevens(bullSpread(100, 120, 0, 0)))
      .toEqual({ points: [], intervals: [{ from: 0, to: 100 }] });
  });

  it('AUDIT: PS4 Ex10 usa beneficio nominal; el valor actual del forward sigue siendo4,74', () => {
    // Source values are regression context, not copied chapter examples.
    expect(discountFactor(0.04, 1.5)).toBeCloseTo(0.9429, 4);
    expect(forwardValue(50, 48, 0.04, 1.5)).toBeCloseTo(4.74, 2);
    expect(forwardValue(50, 48, 0.04, 1.5)).not.toBeCloseTo(4.76, 2);
    expect(optionProfit('call', 52, 48, 3.5)).toBe(0.5);
    expect(strategyProfit(straddle(48, 3.5, 2), 44)).toBe(-1.5);
    expect(chapter).toContain('sin capitalizar la prima');
  });

  it('inventario: nuevas cifras del cuerpo requieren ampliar la cobertura (incluye rutas, PS4 y claves Quiz)', () => {
    const body = chapter.split('---')[2].replace(/^import .*;$/gm, '').replace(/\{,\}/g, ',');
    const numbers = [...new Set((body.match(/\d+(?:,\d+)?/g) ?? []).map(n => Number(n.replace(',', '.'))))].sort((a, b) => a - b);
    expect(numbers).toEqual([0, 1, 2, 4, 5, 6, 9, 10, 11, 14, 15, 16, 20, 80, 89, 95, 100, 104, 106, 111, 120, 200]);
  });
});
