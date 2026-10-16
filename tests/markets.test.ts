import { describe, expect, it } from 'vitest';
import {
  auctionVolume,
  bestAsk,
  bestBid,
  bookBuildingPrice,
  callAuction,
  commission,
  implicitCost,
  ipoProceeds,
  isMarginCall,
  marginCallPriceLong,
  marginCallPriceShort,
  marginPurchase,
  marketOrder,
  proRata,
  quote,
  shortSale,
  spreadCost,
  underpricing,
  type Book,
  type Level,
} from '../src/lib/finance/markets';
import { rng } from '../src/lib/problems/variant';

// Exercises: source/class_notes/05_* §Ejercicios 1-3 and source/problem_sets/ps4 Ex 1-3
// (docs/audit/ps4.py recomputes ps4; AUDIT.md section 2 finds no errors in Ex 1-3).
const near = (x: number, want: number, tol: number) => expect(Math.abs(x - want)).toBeLessThanOrEqual(tol);

describe('margin purchase', () => {
  it('note 05 Ex 1: 300 Indra at 40 €, loan 4.000 € at 8 %, price falls to 30 €', () => {
    const m = marginPurchase(300, 40, 4000, 30, 0.08);
    expect(m.initialEquity).toBe(8000);
    near(m.debt, 4320, 1e-9);
    near(m.equity, 4680, 1e-9);
    near(m.marginPct, 0.52, 1e-12);
    expect(isMarginCall(m.marginPct, 0.3)).toBe(false);
    near(m.returnOnEquity, -0.415, 1e-12);
    near(m.priceReturn, -0.25, 1e-12);
    near((-3000 - 320) / 8000, m.returnOnEquity, 1e-12); // the note's alternative route
  });

  it('ps4 Ex 1: 400 shares at 35 €, loan 4.500 € at 9 %, price falls to 28 €', () => {
    const m = marginPurchase(400, 35, 4500, 28, 0.09);
    expect(m.cost).toBe(14000);
    expect(m.initialEquity).toBe(9500);
    near(m.initialMarginPct, 0.679, 5e-4);
    near(m.debt, 4905, 1e-9);
    near(m.equity, 6295, 1e-9);
    near(m.marginPct, 0.562, 5e-4);
    expect(isMarginCall(m.marginPct, 0.3)).toBe(false);
    near(m.returnOnEquity, -0.337, 5e-4);
    near(m.priceReturn, -0.2, 1e-12);
  });

  it('note 05 example: 100 shares at 100 €, 60 % initial margin, call below 57,14 €', () => {
    const m = marginPurchase(100, 100, 4000, 70);
    near(m.marginPct, 0.4286, 5e-5);
    const p = marginCallPriceLong(100, 4000, 0.3);
    near(p, 57.14, 0.005);
    near(marginPurchase(100, 100, 4000, p).marginPct, 0.3, 1e-12);
    expect(isMarginCall(marginPurchase(100, 100, 4000, p - 0.01).marginPct, 0.3)).toBe(true);
  });

  it('properties: margin % = equity / value; ROE = price return × leverage − interest effect', () => {
    const r = rng(35);
    for (let i = 0; i < 200; i++) {
      const n = 1 + Math.floor(r() * 1000);
      const p0 = 1 + r() * 100;
      const loan = r() * 0.9 * n * p0;
      const p1 = r() * 2 * p0;
      const rate = r() * 0.15;
      const m = marginPurchase(n, p0, loan, p1, rate);
      near(m.marginPct, m.equity / m.value, 1e-12);
      near(m.returnOnEquity, m.priceReturn * m.leverage - (rate * loan) / m.initialEquity, 1e-9);
      near(m.leverage, 1 / m.initialMarginPct, 1e-9);
    }
  });

  it('rejects negative inputs and a loan that covers the whole purchase', () => {
    expect(() => marginPurchase(-1, 35, 0)).toThrow(RangeError);
    expect(() => marginPurchase(400, -35, 0)).toThrow(RangeError);
    expect(() => marginPurchase(400, 35, 14000)).toThrow(RangeError);
  });
});

describe('short sale', () => {
  it('note 05 Ex 2: 1.000 Indra short at 40 €, 50 % margin, price 50 €, dividend 2 €', () => {
    const s = shortSale(1000, 40, 0.5, 50, 2);
    expect(s.initialMargin).toBe(20000);
    expect(s.equity).toBe(8000);
    near(s.marginPct, 0.16, 1e-12);
    expect(isMarginCall(s.marginPct, 0.3)).toBe(true);
    near(s.returnOnMargin, -0.6, 1e-12);
  });

  it('ps4 Ex 2: 800 shares short at 48 €, 50 % margin, dividend 1,50 €, price 55 €', () => {
    const s = shortSale(800, 48, 0.5, 55, 1.5);
    expect(s.proceeds).toBe(38400);
    expect(s.initialMargin).toBe(19200);
    expect(s.dividends).toBe(1200);
    expect(s.equity).toBe(12400);
    expect(s.liability).toBe(44000);
    near(s.marginPct, 0.282, 5e-4);
    expect(isMarginCall(s.marginPct, 0.35)).toBe(true);
    near(s.returnOnMargin, -0.354, 5e-4);
    near(s.priceReturn, 0.146, 5e-4);
  });

  it('note 05 Dot example: profit 30.000 € at 70 €, call above 115,38 €', () => {
    const s = shortSale(1000, 100, 0.5, 70);
    expect(s.equity - s.initialMargin).toBe(30000);
    const p = marginCallPriceShort(1000, 150000, 0.3);
    near(p, 115.38, 0.005);
    near(shortSale(1000, 100, 0.5, p).marginPct, 0.3, 1e-12);
  });

  it('property: margin % = equity / liability; gain is minus the price change and dividends', () => {
    const r = rng(36);
    for (let i = 0; i < 200; i++) {
      const n = 1 + Math.floor(r() * 1000);
      const p0 = 1 + r() * 100;
      const p1 = r() * 2 * p0;
      const d = r() * 3;
      const s = shortSale(n, p0, 0.5, p1, d);
      near(s.marginPct, s.equity / s.liability, 1e-12);
      near(s.equity - s.initialMargin, -n * (p1 - p0) - n * d, 1e-6);
    }
  });
});

describe('transaction costs', () => {
  it('commission has a minimum; spread cost is round trip', () => {
    expect(commission(10000, 0.001, 8)).toBe(10);
    expect(commission(1000, 0.001, 8)).toBe(8);
    near(spreadCost(61.8, 62.3, 100), 50, 1e-9);
  });

  it('implicit cost has the right sign for a sell', () => {
    const c = implicitCost('sell', 100, 49.5, 50);
    near(c.euros, 50, 1e-9);
    near(c.pct, 0.01, 1e-12);
    expect(() => commission(-1, 0.01)).toThrow(RangeError);
  });
});

// ps4 Ex 3: Soltec, last trade 62 €
const soltec: Book = {
  bids: [
    { price: 61.8, size: 400 },
    { price: 61.5, size: 600 },
    { price: 61.2, size: 500 },
    { price: 60.8, size: 900 },
  ],
  asks: [
    { price: 65.5, size: 600 }, // deliberately unsorted
    { price: 62.3, size: 200 },
    { price: 63.1, size: 300 },
    { price: 64, size: 400 },
  ],
};

// note 05 Ex 3: Inditex, last trade 50 €
const inditex: Book = {
  bids: [
    { price: 49.74, size: 500 },
    { price: 49.5, size: 800 },
    { price: 49.25, size: 500 },
    { price: 49, size: 200 },
    { price: 48.5, size: 600 },
  ],
  asks: [
    { price: 50.25, size: 100 },
    { price: 51.5, size: 100 },
    { price: 54.75, size: 300 },
    { price: 58.25, size: 100 },
  ],
};

describe('order book', () => {
  it('ps4 Ex 3a: spread 0,50 € and average best size 300', () => {
    const q = quote(soltec);
    near(q.spread, 0.5, 1e-9);
    near(q.mid, 62.05, 1e-9);
    expect((bestBid(soltec)!.size + bestAsk(soltec)!.size) / 2).toBe(300);
  });

  it('ps4 Ex 3b-d: market buys of 300 and 900; implicit cost vs 62 €', () => {
    near(marketOrder(soltec, 'buy', 300).avgPrice, 62.57, 0.005);
    const o = marketOrder(soltec, 'buy', 900);
    near(o.total, 56990, 1e-6);
    near(o.avgPrice, 63.32, 0.005);
    expect(o.unfilled).toBe(0);
    const c = implicitCost('buy', 900, o.avgPrice, 62);
    near(c.euros, 1190, 1e-6);
    near(c.pct, 0.0213, 5e-5);
  });

  it('note 05 Ex 3: the first market buy fills at 50,25 €, the next at 51,50 €', () => {
    const first = marketOrder(inditex, 'buy', 100);
    expect(first.avgPrice).toBe(50.25);
    expect(marketOrder(first.book, 'buy', 100).avgPrice).toBe(51.5);
  });

  it('partial fill when the book is too thin; a sell walks the bids', () => {
    const o = marketOrder(inditex, 'buy', 700);
    expect(o.filled).toBe(600);
    expect(o.unfilled).toBe(100);
    expect(o.book.asks).toEqual([]);
    near(marketOrder(inditex, 'sell', 600).avgPrice, (500 * 49.74 + 100 * 49.5) / 600, 1e-9);
    expect(() => marketOrder(inditex, 'buy', -1)).toThrow(RangeError);
  });

  it('properties: up to the best size fills at the best price; buy average is non-decreasing in size', () => {
    const r = rng(37);
    for (let k = 0; k < 50; k++) {
      const asks: Level[] = Array.from({ length: 1 + Math.floor(r() * 6) }, () => ({
        price: Math.round(1000 + r() * 1000) / 100,
        size: 1 + Math.floor(r() * 500),
      }));
      const book = { bids: [], asks };
      const best = bestAsk(book)!;
      const depth = asks.reduce((s, l) => s + l.size, 0);
      for (let q = 1; q <= best.size; q += Math.max(1, Math.floor(best.size / 7))) {
        near(marketOrder(book, 'buy', q).avgPrice, best.price, 1e-12);
      }
      let prev = -Infinity;
      for (let q = 1; q <= depth; q += 3) {
        const avg = marketOrder(book, 'buy', q).avgPrice;
        expect(avg).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = avg;
      }
    }
  });
});

describe('call auction', () => {
  const buys: Level[] = [
    { price: 10.2, size: 300 },
    { price: 10.1, size: 200 },
    { price: 10, size: 400 },
    { price: 9.9, size: 100 },
  ];
  const sells: Level[] = [
    { price: 9.8, size: 200 },
    { price: 9.9, size: 300 },
    { price: 10, size: 300 },
    { price: 10.1, size: 400 },
  ];

  it('hand example: price 10 €, volume 800', () => {
    // at 10: demand 900, supply 800 -> 800; at 10,1: demand 500, supply 1.200 -> 500
    expect(callAuction(buys, sells)).toEqual({ price: 10, volume: 800, imbalance: 100 });
  });

  it('no cross gives volume 0', () => {
    expect(callAuction([{ price: 9, size: 10 }], [{ price: 10, size: 10 }]).volume).toBe(0);
  });

  it('property: the auction price maximises executed volume on a grid', () => {
    const r = rng(38);
    for (let k = 0; k < 50; k++) {
      const side = () =>
        Array.from({ length: 1 + Math.floor(r() * 6) }, () => ({ price: Math.round(950 + r() * 100) / 100, size: 1 + Math.floor(r() * 500) }));
      const b = side();
      const s = side();
      const { price, volume } = callAuction(b, s);
      if (volume > 0) expect(auctionVolume(b, s, price)).toBe(volume);
      for (let p = 9.4; p <= 10.6; p += 0.005) expect(auctionVolume(b, s, p)).toBeLessThanOrEqual(volume);
    }
  });
});

describe('IPO', () => {
  it('gross, fees and net; green shoe adds 15 %', () => {
    const base = ipoProceeds(10_000_000, 20, 0.07);
    expect(base.gross).toBe(200_000_000);
    near(base.fees, 14_000_000, 1e-6);
    near(base.net, 186_000_000, 1e-6);
    const shoe = ipoProceeds(10_000_000, 20, 0.07, 0.15);
    near(shoe.shares, 11_500_000, 1e-6);
    near(shoe.gross - base.gross, 30_000_000, 1e-6);
  });

  it('property: net proceeds plus fees equal gross proceeds', () => {
    const r = rng(39);
    for (let i = 0; i < 100; i++) {
      const p = ipoProceeds(Math.floor(r() * 1e7), r() * 50, r() * 0.1, r() * 0.15);
      near(p.net + p.fees, p.gross, 1e-6);
    }
  });

  it('underpricing: initial return and money left on the table', () => {
    const u = underpricing(10_000_000, 20, 25);
    near(u.initialReturn, 0.25, 1e-12);
    expect(u.moneyLeft).toBe(50_000_000);
  });

  it('book-building price clears the issue', () => {
    const demand: Level[] = [
      { price: 18, size: 6_000_000 },
      { price: 22, size: 2_000_000 },
      { price: 20, size: 5_000_000 },
    ];
    expect(bookBuildingPrice(demand, 7_000_000)).toBe(20);
    expect(bookBuildingPrice(demand, 2_000_000)).toBe(22);
    expect(bookBuildingPrice(demand, 20_000_000)).toBeNull();
  });

  it('fixed price: 3× oversubscribed, pro-rata allocation', () => {
    const { oversubscription, allocations } = proRata([1500, 900, 600], 1000);
    expect(oversubscription).toBe(3);
    expect(allocations).toEqual([500, 300, 200]);
    expect(proRata([100, 200], 1000).allocations).toEqual([100, 200]);
    expect(() => proRata([-1], 10)).toThrow(RangeError);
  });
});
