import type { Book } from '../lib/finance/markets';

/** Original chapter 13 examples. Financial calculations live in markets.ts. */
export const tradingBook: Book = {
  bids: [{ price: 39, size: 100 }, { price: 38, size: 100 }, { price: 37, size: 200 }],
  asks: [{ price: 40, size: 100 }, { price: 41, size: 100 }, { price: 42, size: 200 }],
};
export const tradingAccount = {
  shares: 200, initialPrice: 40, loan: 4000, loanRate: 0.05,
  initialShortMargin: 0.5, dividend: 1, maintenance: 0.3,
};
export const tradingFees = { rate: 0.001, minimum: 2 };
