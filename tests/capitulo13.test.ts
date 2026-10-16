import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { commission, implicitCost, isMarginCall, limitOrder, marginCallPriceLong, marginCallPriceShort, marginPurchase, marketOrder, quote, shortSale, spreadCost } from '../src/lib/finance/markets';
import { tradingAccount as a, tradingBook as book, tradingFees } from '../src/data/trading';

const text = readFileSync('src/content/chapters/13-negociacion.mdx', 'utf8');
const long = (p: number) => marginPurchase(a.shares, a.initialPrice, a.loan, p, a.loanRate);
const short = (p: number) => shortSale(a.shares, a.initialPrice, a.initialShortMargin, p, a.dividend);

describe('capítulo 13: todos los números del texto', () => {
  it('seis secciones, tres quizzes, ambos widgets y ninguna sesión sin publicar', () => {
    expect([...text.matchAll(/^## <span class="section-tag">([^<]+)/gm)].map(m => m[1])).toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(text.match(/<Quiz client:visible/g)).toHaveLength(3);
    for (const widget of ['OrderBook', 'MarginAccount']) expect(text).toContain(`<${widget} client:visible />`);
    expect(text).toMatch(/^sessions: \[\]$/m);
  });

  it('cada nivel del libro, cotización, media, cantidades pendientes y costes', () => {
    expect(book.bids).toEqual([{ price: 39, size: 100 }, { price: 38, size: 100 }, { price: 37, size: 200 }]);
    expect(book.asks).toEqual([{ price: 40, size: 100 }, { price: 41, size: 100 }, { price: 42, size: 200 }]);
    book.bids.forEach((b, i) => expect(text).toContain(`| ${b.price} € | ${b.size} | ${book.asks[i].price} € | ${book.asks[i].size} |`));
    expect(quote(book)).toEqual({ bid: 39, ask: 40, spread: 1, mid: 39.5 });
    const order = marketOrder(book, 'buy', 150);
    expect(order.fills).toEqual([{ price: 40, size: 100 }, { price: 41, size: 50 }]);
    expect(order.total).toBe(6050);
    expect(order.avgPrice).toBeCloseTo(40.3333333333, 8);
    expect(order.avgPrice.toFixed(2)).toBe('40.33');
    expect(tradingFees).toEqual({ rate: 0.001, minimum: 2 });
    expect(commission(order.total, tradingFees.rate, tradingFees.minimum)).toBe(6.05);
    expect(implicitCost('buy', order.filled, order.avgPrice, quote(book).mid).euros).toBeCloseTo(125, 8);
    const limited = limitOrder(book, 'buy', 150, 40);
    expect([limited.filled, limited.unfilled, limited.total, limited.avgPrice]).toEqual([100, 50, 4000, 40]);
    expect(commission(limited.total, tradingFees.rate, tradingFees.minimum)).toBe(4);
    expect(implicitCost('buy', limited.filled, limited.avgPrice, quote(book).mid).euros).toBe(50);
    expect(spreadCost(39, 40, 100)).toBe(100);
  });

  it('compra financiada: aportación, interés, margen, rentabilidad y umbral exacto', () => {
    expect(a).toEqual({ shares: 200, initialPrice: 40, loan: 4000, loanRate: 0.05, initialShortMargin: 0.5, dividend: 1, maintenance: 0.3 });
    const unchanged = long(40);
    expect(unchanged.cost).toBe(8000);
    expect(unchanged.initialEquity).toBe(4000);
    expect(unchanged.initialMarginPct).toBe(0.5);
    expect(unchanged.debt).toBe(4200);
    expect(unchanged.equity).toBe(3800);
    expect(unchanged.marginPct).toBe(0.475);
    expect(unchanged.returnOnEquity).toBe(-0.05);
    expect(marginCallPriceLong(a.shares, unchanged.debt, a.maintenance)).toBe(30);
    expect(long(30).equity).toBe(1800);
    expect(long(30).marginPct).toBe(0.3);
    expect(long(30).returnOnEquity).toBe(-0.55);
    expect(isMarginCall(long(30).marginPct, a.maintenance)).toBe(false);
    expect(isMarginCall(long(29.9).marginPct, a.maintenance)).toBe(true);
  });

  it('corto: garantía, dividendo, activos, obligación y rentabilidad', () => {
    const account = short(55);
    expect(account.proceeds).toBe(8000);
    expect(account.initialMargin).toBe(4000);
    expect(account.dividends).toBe(200);
    expect(account.assets).toBe(11800);
    expect(account.liability).toBe(11000);
    expect(account.equity).toBe(800);
    expect(account.marginPct * 100).toBeCloseTo(7.27, 2);
    expect(account.returnOnMargin).toBe(-0.8);
    const threshold = marginCallPriceShort(a.shares, account.assets, a.maintenance);
    expect(threshold).toBeCloseTo(45.3846153846, 8);
    expect(threshold.toFixed(2)).toBe('45.38');
    expect(isMarginCall(short(threshold - 0.001).marginPct, a.maintenance)).toBe(false);
    expect(isMarginCall(short(threshold + 0.001).marginPct, a.maintenance)).toBe(true);
    expect(short(40).equity).toBe(3800);
    expect(short(40).returnOnMargin).toBe(-0.05);
    expect(isMarginCall(account.marginPct, a.maintenance)).toBe(true);
  });

  it('inventario automático: ningún literal numérico queda fuera de los ejemplos verificados', () => {
    // Ignore metadata, imports, component answer indices and list numbering; retain quiz prose and formula numbers.
    const prose = text.replace(/^---[\s\S]*?---/, '').replace(/^import .*$/gm, '')
      .replace(/^\s*answer=\{\d+\}$/gm, '').replace(/^\d+\. /gm, '')
      .replaceAll('{,}', ',').replaceAll('{.}', '.');
    const order = marketOrder(book, 'buy', 150);
    const checked = [0, 1, 150, 50, ...book.bids.flatMap(l => [l.price, l.size]), ...book.asks.flatMap(l => [l.price, l.size]),
      quote(book).mid, quote(book).spread, order.total, Number(order.avgPrice.toFixed(2)), Math.trunc(order.avgPrice * 1000) / 1000,
      commission(order.total, tradingFees.rate, tradingFees.minimum), tradingFees.rate * 100, tradingFees.minimum,
      implicitCost('buy', order.filled, order.avgPrice, quote(book).mid).euros,
      implicitCost('buy', 100, 40, quote(book).mid).euros, commission(4000, tradingFees.rate, tradingFees.minimum),
      a.shares, a.initialPrice, a.loan, a.loanRate * 100, a.initialShortMargin * 100, a.maintenance, a.maintenance * 100,
      long(40).cost, long(40).debt, long(40).equity, long(40).marginPct * 100, long(40).returnOnEquity * 100,
      long(30).equity, long(30).returnOnEquity * 100, marginCallPriceLong(a.shares, long(40).debt, a.maintenance),
      a.dividend, short(55).dividends, short(55).assets, short(55).equity, 55,
      Number((short(55).marginPct * 100).toFixed(2)), short(55).returnOnMargin * 100,
      Number(marginCallPriceShort(a.shares, short(55).assets, a.maintenance).toFixed(2))];
    for (const token of prose.match(/−?\d+(?:[.,]\d+)*/g) ?? []) {
      const n = Number(token.replaceAll('−', '-').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
      expect(checked.some(value => Math.abs(n - value) < 1e-8), `untested chapter literal: ${token}`).toBe(true);
    }
  });
});

describe('audit note 05 §3 and limit-order library addition', () => {
  it('audit note 05 §3: market depth cannot guarantee execution', () => {
    const result = marketOrder(book, 'buy', 500);
    expect([result.filled, result.unfilled]).toEqual([400, 100]);
    expect(result.book.asks).toEqual([]);
    const empty = marketOrder(result.book, 'buy', 100);
    expect(empty.filled).toBe(0);
    expect(Number.isNaN(empty.avgPrice)).toBe(true);
    expect(text).toContain('no garantiza ejecución completa');
  });
  it('audit note 05 §3: investor limit differs from best-level execution', () => {
    const original = structuredClone(book);
    const cross = limitOrder(book, 'buy', 150, 41);
    expect(cross.fills).toEqual([{ price: 40, size: 100 }, { price: 41, size: 50 }]);
    expect(cross.book.asks).toEqual([{ price: 41, size: 50 }, { price: 42, size: 200 }]);
    expect(limitOrder(book, 'buy', 150, 40).book.bids[0]).toEqual({ price: 40, size: 50 });
    const passive = limitOrder(book, 'buy', 150, 39.5);
    expect(passive.filled).toBe(0);
    expect(passive.book.asks).toEqual(book.asks);
    expect(passive.book.bids[0]).toEqual({ price: 39.5, size: 150 });
    expect(book).toEqual(original);
    expect(text).toContain('Su resto queda limitado al precio de esa primera ejecución');
    expect(text).toContain('sí lleva un límite del inversor');
  });
  it('sell limit reverses the price condition and rests only the remainder', () => {
    const order = limitOrder(book, 'sell', 250, 38);
    expect(order.fills).toEqual([{ price: 39, size: 100 }, { price: 38, size: 100 }]);
    expect(order.unfilled).toBe(50);
    expect(order.book.bids).toEqual([{ price: 37, size: 200 }]);
    expect(order.book.asks[0]).toEqual({ price: 38, size: 50 });
    expect(implicitCost('sell', 100, 39, 39.5).euros).toBe(50);
    expect(limitOrder(book, 'sell', 100, 42).filled).toBe(0);
    expect(limitOrder(book, 'buy', 0, 40).book).toEqual(book);
    expect(() => limitOrder(book, 'buy', 100, -1)).toThrow(RangeError);
    expect(() => limitOrder(book, 'sell', -1, 40)).toThrow(RangeError);
  });
  it('audit note 05 §3: a lower repurchase price need not yield a net profit', () => {
    const account = shortSale(200, 40, 0.5, 39.5, 1);
    expect(account.priceReturn).toBeLessThan(0);
    expect(account.returnOnMargin).toBe(-0.025);
    expect(text).toContain('puede desaparecer al pagar dividendos');
  });
});
