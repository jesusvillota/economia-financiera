import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chapter14IPO as e } from '../src/data/ipo';
import { bookBuildingPrice, ipoDemandAtPrice, ipoProceeds, underpricing } from '../src/lib/finance/markets';
import { parts } from '../src/data/curriculum';

const text = readFileSync('src/content/chapters/14-opv.mdx', 'utf8').replaceAll('\u00a0', ' ');
const euro = (v: number) => `${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`;
const pct = (v: number, digits = 0) => `${(v * 100).toFixed(digits).replace('.', ',').replace('-', '−')} %`;
const proceeds = ipoProceeds(e.shares, e.offerPrice, e.feeRate);
const initial = underpricing(e.shares, e.offerPrice, e.firstClose);

describe('capítulo 14: every numerical claim is recomputed with markets.ts', () => {
  it('metadata, six sections, one widget and three quizzes', () => {
    expect([...text.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(text.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(text.match(/<BookBuilding client:visible/g)).toHaveLength(1);
    expect(text).toContain('sessions: []');
    const chapter = parts.flatMap((p) => p.chapters).find((c) => c.number === 14)!;
    expect(chapter).toMatchObject({ slug: '14-opv', prerequisites: [5], difficulty: 2 });
    for (const value of ['part: 4', 'chapter: 14', 'difficulty: 2', 'prerequisites: [5]']) expect(text).toContain(value);
    expect(text).toContain('/chapters/05-empresa-wacc/');
    expect(text).toContain('capítulo 5: flujos descontados y WACC');
  });

  it('hook: original shares, price, close, initial return and money left', () => {
    expect(e.shares).toBe(1000);
    expect(e.offerPrice).toBe(16);
    expect(e.firstClose).toBe(20);
    expect(initial.initialReturn).toBeCloseTo(0.25, 14);
    expect(initial.moneyLeft).toBe(4000);
    const hook = text.split('## <span class="section-tag">Intuición')[0];
    for (const value of ['1000 acciones nuevas', euro(e.offerPrice), euro(e.firstClose), pct(initial.initialReturn), euro(initial.moneyLeft)])
      expect(hook).toContain(value);
  });

  it.each([
    [20, 200, 200], [18, 400, 600], [16, 600, 1200], [14, 800, 2000], [12, 1000, 3000],
  ])('table: limit %s, additional request %s, cumulative demand %s', (price, size, total) => {
    expect(e.demand.find((l) => l.price === price)?.size).toBe(size);
    expect(ipoDemandAtPrice(e.demand, price)).toBe(total);
    expect(text).toContain(`| ${price} € | ${size} | ${total} |`);
  });

  it('price ceiling: 16 covers 1000 shares; 18 covers only 600', () => {
    expect(bookBuildingPrice(e.demand, e.shares)).toBe(16);
    expect(ipoDemandAtPrice(e.demand, 16)).toBe(1200);
    expect(ipoDemandAtPrice(e.demand, 18)).toBe(600);
    expect(text).toContain('Para colocar 1000 acciones, el máximo precio compatible con este libro es 16 €');
    expect(text).toContain('A 18 € solo quedan peticiones por 600 acciones');
    expect(text).toContain('A 16 € hay demanda para 1200');
  });

  it('proceeds and quiz 1: 16000 gross − 640 fees = 15360 net, at 4%', () => {
    expect(e.feeRate).toBe(0.04);
    expect(proceeds).toEqual({ shares: 1000, gross: 16000, fees: 640, net: 15360 });
    for (const value of [euro(proceeds.gross), euro(proceeds.fees), euro(proceeds.net), pct(e.feeRate)]) expect(text).toContain(value);
    expect(text).toContain("answer={1}\n  explanation=\"Son 16.000 € brutos menos 640 €");
    for (const formula of ['1000\\cdot16=16{.}000', '0{,}04\\cdot16{.}000=640', '16{.}000-640=15{.}360'])
      expect(text).toContain(formula);
  });

  it('worked return: 20/16−1 = 0.25, difference per share 4, total 4000', () => {
    expect(initial.initialReturn).toBe(0.25);
    expect(underpricing(1, 16, 20).moneyLeft).toBe(4);
    expect(initial.moneyLeft).toBe(4000);
    for (const formula of ['20/16-1=0{,}25', '20-16=4', '1000\\cdot4=4000']) expect(text).toContain(formula);
  });

  it('playground at 14: demand 2000; gross 14000; fees 560; net 13440; 42.86%; 6000', () => {
    const p = ipoProceeds(e.shares, 14, e.feeRate);
    const u = underpricing(e.shares, 14, 20);
    expect(ipoDemandAtPrice(e.demand, 14)).toBe(2000);
    expect(p).toEqual({ shares: 1000, gross: 14000, fees: 560, net: 13440 });
    expect(u.initialReturn).toBeCloseTo(3 / 7, 14);
    expect(pct(u.initialReturn, 2)).toBe('42,86 %');
    expect(u.moneyLeft).toBe(6000);
    for (const value of ['2000 acciones', euro(p.gross), euro(p.fees), euro(p.net), pct(u.initialReturn, 2), euro(u.moneyLeft)])
      expect(text).toContain(value);
  });

  it('uncovered offer is withdrawn; zero sales and proceeds; quiz 2 sums 200+400=600', () => {
    const demand = ipoDemandAtPrice(e.demand, 18);
    expect(demand).toBe(e.demand[0].size + e.demand[1].size);
    expect(demand).toBeLessThan(e.shares);
    expect(ipoProceeds(demand >= e.shares ? e.shares : 0, 18, e.feeRate))
      .toEqual({ shares: 0, gross: 0, fees: 0, net: 0 });
    expect(text).toContain('los ingresos son cero');
    expect(text).toContain("answer={2}\n  explanation=\"A 18 €");
    expect(text).toContain('200 más 400');
  });

  it('audit note 04: zero and negative first-day returns refute universal underpricing; quiz 3', () => {
    expect(underpricing(1000, 16, 16)).toEqual({ initialReturn: 0, moneyLeft: 0 });
    expect(underpricing(1000, 16, 12)).toEqual({ initialReturn: -0.25, moneyLeft: -4000 });
    for (const value of ['cierre fuera 16 €', '0 %', 'Si fuera 12 €', '−25 %', '−4000 €']) expect(text).toContain(value);
    expect(text).toContain("answer={1}\n  explanation=\"12 dividido entre 16");
    const audit = readFileSync('docs/AUDIT.md', 'utf8');
    expect(audit).toContain('### Note 04: underpricing is not universal');
    expect(audit).toContain('tests/capitulo14.test.ts');
  });

  it('numerical token inventory prevents untested figures entering the text', () => {
    // Ignore frontmatter, imports, links, JSX answer indices and the numbered prompt markers.
    // Decimal TeX commas and thousands separators are normalised before the inventory.
    const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/^import .*$/gm, '').replace(/\]\([^)]*\)/g, ']')
      .replace(/answer=\{\d+\}/g, '').replace(/^\d+\. /gm, '')
      .replaceAll('{,}', ',').replaceAll('{.}', '.');
    const tokens = [...new Set(body.match(/−?\d+(?:[.,]\d+)*/g))].sort();
    expect(tokens).toEqual([
      '0', '0,04', '0,25', '1', '1000', '12', '1200', '14', '14.000', '13.440', '15.360',
      '16', '16.000', '18', '20', '200', '2000', '25', '3000', '4', '400', '4000', '42,86',
      '5', '560', '600', '6000', '640', '800', '−25', '−4000',
    ].sort());
  });
});

describe('book-building demand helper used by every widget state', () => {
  it.each([[12, 3000], [13, 2000], [14, 2000], [15, 1200], [16, 1200], [17, 600], [18, 600], [19, 200], [20, 200]])
   ('price %s has %s requests, with inclusive limits', (price, demand) => {
      expect(ipoDemandAtPrice(e.demand, price)).toBe(demand);
    });
  it('handles no demand, insufficient demand, shuffled levels and equal limits', () => {
    expect(ipoDemandAtPrice([], 16)).toBe(0);
    expect(bookBuildingPrice([], 1000)).toBeNull();
    expect(bookBuildingPrice(e.demand, 3001)).toBeNull();
    expect(ipoDemandAtPrice([...e.demand].reverse(), 16)).toBe(1200);
    expect(ipoDemandAtPrice([{ price: 16, size: 200 }, { price: 16, size: 800 }], 16)).toBe(1000);
    expect(ipoDemandAtPrice(e.demand, 21)).toBe(0);
    expect(ipoDemandAtPrice(e.demand, 0)).toBe(3000);
  });
  it('rejects invalid prices and limit requests', () => {
    for (const price of [-1, NaN, Infinity]) expect(() => ipoDemandAtPrice(e.demand, price)).toThrow(RangeError);
    expect(() => ipoDemandAtPrice([{ price: -1, size: 20 }], 16)).toThrow(RangeError);
    expect(() => ipoDemandAtPrice([{ price: 16, size: NaN }], 16)).toThrow(RangeError);
  });
});
