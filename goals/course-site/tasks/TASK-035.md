---
id: TASK-035
title: 'Finance maths library: markets (margin, short sales, order book, IPO)'
milestone: M-4
state: approved
depends_on: [TASK-017]
delivery: pr
---

## Why

SC-4: maths for chapters 13 and 14 and for Problem Session 4 (Ex 1 to 3).

## Scope

Add `src/lib/finance/markets.ts`: margin purchase (initial margin in euros and %, margin after interest, margin % vs maintenance margin, margin call and the price that triggers it, return on own capital vs price change); short sale (proceeds, margin after dividend and price change, margin call, return on initial margin); transaction costs (commissions, bid-ask spread cost, implicit cost of a market order vs a reference price); limit order book (best bid/ask, spread, mid, average execution price and total cost of a market order that walks several levels, partial fills); call-auction clearing price (price that maximises executed volume). IPO helpers: gross and net proceeds after underwriting fee, initial return (underpricing) and money left on the table, green-shoe (over-allotment) proceeds, book-building price from a demand schedule, fixed-price oversubscription and pro-rata allocation. Tests in `tests/markets.test.ts`: hand values, `source/class_notes/05_*` exercises 1 to 3, `source/problem_sets/ps4` Ex 1 to 3 (read `docs/AUDIT.md` section 2 first). Input validation: negative prices or sizes throw. No UI. Out of scope: bond and derivative maths, chapters.

## Acceptance

- `npm test` passes with at least 30 new assertions.
- Property tests: margin % equals equity over position value; return on own capital equals price return times leverage minus interest effect; a market order at or below the best size executes at the best price; the average price is non-decreasing in order size for a buy; the call-auction price maximises executed volume on a grid; net proceeds plus fees equal gross proceeds.
- Note 05 exercises 1 to 3 and ps4 Ex 1 to 3 numeric answers are asserted.
- `npm run build` passes.

## Verify

```sh
npm test
npm run build
```
