/** Original teaching example. Requests are incremental limit bids, not cumulative totals. */
export const chapter14IPO = {
  company: 'Brisa Sensores',
  shares: 1000,
  offerPrice: 16,
  firstClose: 20,
  feeRate: 0.04,
  demand: [
    { price: 20, size: 200 },
    { price: 18, size: 400 },
    { price: 16, size: 600 },
    { price: 14, size: 800 },
    { price: 12, size: 1000 },
  ],
};
