# TASK-035 outcome

## Acceptance

- [x] `npm test` passes with at least 30 new assertions. Evidence: `npm test` → `Tests 1024 passed (1024)`. `tests/markets.test.ts` holds 24 tests with 89 `expect`/`near` calls. The property loops run several thousand more checks.
- [x] Property tests. Evidence, all in `tests/markets.test.ts`, with seeded `rng` from `src/lib/problems/variant.ts`:
  - margin % = equity / position value: `margin purchase › properties` (200 random cases) and `short sale › property`;
  - return on own capital = price return × leverage − interest effect (`rate × loan / initial equity`): `margin purchase › properties`;
  - a market buy at or below the best size executes at the best price; the buy average price is non-decreasing in size: `order book › properties` (50 random books);
  - the call-auction price maximises executed volume on a 0,005 € grid: `call auction › property` (50 random books);
  - net proceeds + fees = gross proceeds: `IPO › property` (100 cases).
- [x] Note 05 exercises 1 to 3 and ps4 Ex 1 to 3 numeric answers are asserted. Evidence: tests `note 05 Ex 1`, `note 05 Ex 2`, `note 05 Ex 3`, `ps4 Ex 1`, `ps4 Ex 2`, `ps4 Ex 3a`, `ps4 Ex 3b-d`. Values match `docs/audit/ps4.py` and the note's solutions. Note 05's worked examples are also asserted: the margin call price 57,14 € and the short-sale call price 115,38 €.
- [x] `npm run build` passes. Evidence: `astro check` `Result (104 files): 0 errors, 0 warnings`; `17 page(s) built`, `Complete!`.

## Summary

**What.** `src/lib/finance/markets.ts`:
- margin purchase (`marginPurchase`, `marginCallPriceLong`, `isMarginCall`);
- short sale (`shortSale`, `marginCallPriceShort`);
- costs (`commission`, `spreadCost`, `implicitCost`);
- order book (`bestBid`, `bestAsk`, `quote`, `marketOrder` with partial fills and the remaining book);
- call auction (`auctionVolume`, `callAuction`);
- IPO (`ipoProceeds` with a green-shoe fraction, `underpricing`, `bookBuildingPrice`, `proRata`).

Negative or non-finite prices, sizes and rates throw `RangeError`.

**How.** Each function is a pure function. The call auction only tests limit prices, because executed volume changes only at those prices. Ties go to the smallest imbalance, then to the lowest price.

**Deviations.** None from the spec. These are deliberate simplifications, marked `ponytail:` in the code:
- the auction does not use a reference price as the final tie-break, as the BME rule does;
- the pro-rata allocation does not round to whole shares.

**Source errors.** None in note 05 Ex 1 to 3 or ps4 Ex 1 to 3. This agrees with `docs/AUDIT.md` section 2.

**Verified revision.** `bfd0148` (lib and tests). The outcome commit follows it.

**Proposed follow-ups.** TASK-038 and TASK-039 can import these functions. Add a reference-price tie-break only if a chapter needs the BME auction rule.
