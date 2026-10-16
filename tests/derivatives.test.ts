import { describe, expect, it } from 'vitest';
import {
  bearSpread, basis, breakevens, bullSpread, collar, coveredCall, discountFactor,
  forwardPayoff, forwardPrice, forwardValue, fraPayoff, futuresMarginAccount,
  legPayoff, optionPayoff, optionProfit, payoffParityResidual, protectivePut,
  putCallParityResidual, straddle, strangle, strategyCost, strategyPayoff, strategyProfit,
  type ForwardCarry, type FuturesMarginInput, type Position, type StrategyLeg,
} from '../src/lib/finance/derivatives';
import { rng } from '../src/lib/problems/variant';

describe('forward replication and value', () => {
  it('annual effective rates, fractional years, continuous rates and zero maturity', () => {
    expect(discountFactor(0.04, 2)).toBeCloseTo(1 / 1.0816, 12);
    expect(discountFactor(0.04, 1.5)).toBeCloseTo(0.9428660343181924, 12);
    expect(discountFactor(0.05, 2, 'continuous')).toBeCloseTo(Math.exp(-0.1), 12);
    expect(discountFactor(-0.05, 2)).toBeCloseTo(1 / 0.95 ** 2, 12);
    expect(forwardPrice(100, 0.05, 2)).toBeCloseTo(110.25, 12);
    expect(forwardPrice(100, 0.05, 2, { compounding: 'continuous' })).toBeCloseTo(110.51709180756477, 10);
    expect(forwardPrice(100, 0.05, 0)).toBe(100);
    expect(forwardValue(90, 100, 0.05, 0)).toBe(-10);
    expect(forwardValue(90, 100, 0.05, 0, 'short')).toBe(10);
  });

  it('known cash income is discounted at its own date, then carried to delivery', () => {
    // Two dividends, 5 € at year 1 and 6 € at year 2. Replication costs 100 − PV(dividends).
    const carry = { income: [{ amount: 5, time: 1 }, { amount: 6, time: 2 }] };
    expect(forwardPrice(100, 0.1, 2, carry)).toBeCloseTo(109.5, 10);
    expect(forwardValue(100, 105, 0.1, 2, 'long', carry)).toBeCloseTo(4.5 / 1.21, 10);
    expect(forwardPrice(100, 0.1, 2, { income: [{ amount: 3, time: 0 }] })).toBeCloseTo(117.37, 10);
  });

  it('continuous and discrete proportional yields reduce the prepaid spot', () => {
    expect(forwardPrice(100, 0.05, 2, {
      compounding: 'continuous', yield: { rate: 0.02, compounding: 'continuous' },
    })).toBeCloseTo(100 * Math.exp(0.06), 10);
    expect(forwardPrice(100, 0.05, 2, {
      yield: { rate: 0.02, compounding: 'annual' },
    })).toBeCloseTo(100 * (1.05 / 1.02) ** 2, 10);
    expect(forwardPrice(100, 0.05, 2, { yield: { rate: 0, compounding: 'annual' } }))
      .toBeCloseTo(110.25, 10);
  });

  it('cash storage cost is supplied as present value, separately from income', () => {
    expect(forwardPrice(100, 0.1, 2, { storageCostPV: 5 })).toBeCloseTo(127.05, 10);
    expect(forwardPrice(100, 0.1, 2, {
      storageCostPV: 5, income: [{ amount: 5.5, time: 1 }],
    })).toBeCloseTo(121, 10);
  });

  it('forward payoff and basis use explicit long/short and spot-minus-future signs', () => {
    expect(forwardPayoff(120, 100)).toBe(20);
    expect(forwardPayoff(120, 100, 'short')).toBe(-20);
    expect(forwardPayoff(80, 100, 'short')).toBe(20);
    expect(basis(100, 104)).toBe(-4);
    expect(basis(100, 98)).toBe(2);
    expect(basis(100, 100)).toBe(0);
  });

  it('property: zero value at inception for every carry convention and both positions', () => {
    const random = rng(4301);
    expect.assertions(2400);
    for (let i = 0; i < 200; i++) {
      const spot = 20 + random() * 200;
      const rate = -0.02 + random() * 0.15;
      const maturity = random() * 5;
      const carries: ForwardCarry[] = [
        {}, { compounding: 'continuous' },
        { income: [{ amount: spot * 0.02, time: maturity / 2 }] },
        { yield: { rate: random() * 0.05, compounding: 'annual' } },
        { compounding: 'continuous', yield: { rate: random() * 0.05, compounding: 'continuous' } },
        { storageCostPV: random() * 10 },
      ];
      for (const carry of carries) {
        const delivery = forwardPrice(spot, rate, maturity, carry);
        expect(forwardValue(spot, delivery, rate, maturity, 'long', carry)).toBe(0);
        expect(Math.abs(forwardValue(spot, delivery, rate, maturity, 'short', carry))).toBe(0);
      }
    }
  });
});

describe('forward rate agreement', () => {
  it('pays the fixed-rate borrower when the floating rate rises; start vs end settlement', () => {
    expect(fraPayoff(1_000_000, 0.04, 0.06, 0.5)).toBeCloseTo(9708.73786407767, 8);
    expect(fraPayoff(1_000_000, 0.04, 0.06, 0.5, 'short')).toBeCloseTo(-9708.73786407767, 8);
    expect(fraPayoff(1_000_000, 0.04, 0.06, 0.5, 'long', 'end')).toBeCloseTo(10000, 8);
    expect(fraPayoff(1_000_000, 0.04, 0.02, 0.5)).toBeCloseTo(-9900.990099009901, 8);
    expect(fraPayoff(1_000_000, 0.04, 0.04, 0.5)).toBe(0);
    expect(fraPayoff(1_000_000, -0.02, -0.01, 0.5)).toBeCloseTo(5025.125628140703, 8);
    expect(fraPayoff(1_000_000, 0.04, 0.06, 0)).toBe(0);
  });
});

// Original missing PS4 futures exercise (not copied from a source):
// Sell 2 futures at 100 €/unit, multiplier 10 units/contract. Initial margin 200 € TOTAL,
// maintenance 120 €. Daily settlements 103, 108, 104, 99. No interest or fees.
// Restore to 200 € after a strict breach of 120 €. Withdraw 80 € and 100 € on days 3/4.
// Daily VM −60, −100, +80, +100; one margin call of 160 €. Net trading gain = 20 €.
const futuresExercise: FuturesMarginInput = {
  prices: [100, 103, 108, 104, 99], position: 'short', contracts: 2, multiplier: 10,
  initialMargin: 200, maintenanceMargin: 120, withdrawals: [0, 0, 80, 100],
};

describe('futures daily settlement and margin account', () => {
  it('original PS4 exercise: daily variation, strict maintenance breach, top-up and withdrawals', () => {
    const result = futuresMarginAccount(futuresExercise);
    expect(result.days.map(d => d.variationMargin)).toEqual([-60, -100, 80, 100]);
    expect(result.days.map(d => d.balanceBeforeCall)).toEqual([140, 40, 280, 300]);
    expect(result.days.map(d => d.marginCall)).toEqual([0, 160, 0, 0]);
    expect(result.days.map(d => d.payout)).toEqual([0, 0, 80, 100]);
    expect(result.days.map(d => d.withdrawal)).toEqual([0, -160, 80, 100]);
    expect(result.days.map(d => d.balance)).toEqual([140, 200, 200, 200]);
    expect(result.totalGain).toBe(20);
    expect(result.cumulativeWithdrawals).toBe(20);
    expect(result.balance).toBe(200);
    expect(result.days[1].price).toBe(108);
    expect(result.days[1].day).toBe(2);
  });

  it('does not call at exactly maintenance; a deficit below zero is fully replenished', () => {
    const account = { ...futuresExercise, contracts: 1, multiplier: 1, initialMargin: 10, maintenanceMargin: 5, withdrawals: undefined };
    const equal = futuresMarginAccount({ ...account, prices: [100, 105] });
    expect(equal.days[0].marginCall).toBe(0);
    expect(equal.balance).toBe(5);
    const deficit = futuresMarginAccount({ ...account, prices: [100, 125] });
    expect(deficit.days[0].balanceBeforeCall).toBe(-15);
    expect(deficit.days[0].marginCall).toBe(25);
    expect(deficit.balance).toBe(10);
    expect(deficit.totalGain).toBe(-25);
  });

  it('supports long positions and an opening price with no settlement yet', () => {
    const long = futuresMarginAccount({ ...futuresExercise, position: 'long', withdrawals: undefined });
    expect(long.days.map(d => d.variationMargin)).toEqual([60, 100, -80, -100]);
    expect(long.totalGain).toBe(-20);
    expect(long.balance).toBe(180);
    expect(futuresMarginAccount({ ...futuresExercise, prices: [100], withdrawals: [] }))
      .toEqual({ days: [], balance: 200, totalGain: 0, cumulativeWithdrawals: 0 });
  });

  it('property: a short forward and short futures have equal nominal gains at flat rates', () => {
    // Deterministic flat rates give equal inception forward/futures prices. Daily VM telescopes.
    // Compare undiscounted trading gains; funding/reinvestment of daily cash flows is excluded.
    // At zero rates this is also equality of terminal funded gains.
    const random = rng(4302);
    expect.assertions(400);
    for (let i = 0; i < 200; i++) {
      const rate = i % 2 === 0 ? 0 : 0.01 + random() * 0.1;
      const opening = forwardPrice(20 + random() * 200, rate, 1);
      const prices = [opening, ...Array.from({ length: 10 }, () => random() * 200)];
      const contracts = 1 + Math.floor(random() * 5);
      const multiplier = 10;
      const account = futuresMarginAccount({ prices, position: 'short', contracts, multiplier, initialMargin: 1000, maintenanceMargin: 500 });
      const gain = contracts * multiplier * forwardPayoff(prices[10], opening, 'short');
      expect(account.totalGain).toBeCloseTo(gain, 7);
      const long = futuresMarginAccount({ prices, position: 'long', contracts, multiplier, initialMargin: 1000, maintenanceMargin: 500 });
      expect(account.totalGain + long.totalGain).toBeCloseTo(0, 7);
    }
  });

  it('property: balance = initial + cumulative VM − net withdrawals, including margin-call deposits', () => {
    const random = rng(4303);
    expect.assertions(6000);
    for (let i = 0; i < 200; i++) {
      const position: Position = i % 2 ? 'long' : 'short';
      const prices = [100, ...Array.from({ length: 10 }, () => 80 + Math.floor(random() * 40))];
      const account: FuturesMarginInput = { prices, position, contracts: 1, multiplier: 10, initialMargin: 200, maintenanceMargin: 120 };
      const withoutWithdrawals = futuresMarginAccount(account);
      // Taking available profits leaves the same future calls valid; simulator recomputes each one.
      const withdrawals = withoutWithdrawals.days.map(d => Math.max(0, d.variationMargin) / 2);
      // Build a legal withdrawal schedule from the running balance (includes profits held below initial).
      let balance = 200;
      withdrawals.forEach((amount, day) => {
        const before = balance + signForTest(position) * 10 * (prices[day + 1] - prices[day]);
        const topped = before < 120 ? 200 : before;
        withdrawals[day] = Math.min(amount, Math.max(0, topped - 200));
        balance = topped - withdrawals[day];
      });
      const result = futuresMarginAccount({ ...account, withdrawals });
      let vm = 0;
      let netWithdrawals = 0;
      for (const day of result.days) {
        vm += day.variationMargin;
        netWithdrawals += day.payout - day.marginCall;
        expect(day.balance).toBeCloseTo(200 + vm - netWithdrawals, 10);
        expect(day.cumulativeWithdrawals).toBeCloseTo(netWithdrawals, 10);
        expect(day.balance).toBeGreaterThanOrEqual(120);
      }
    }
  });
});

const signForTest = (position: Position) => position === 'long' ? 1 : -1;

describe('option payoffs and premium-inclusive profit', () => {
  it.each([
    ['call', 120, 20], ['call', 100, 0], ['call', 80, 0],
    ['put', 120, 0], ['put', 100, 0], ['put', 80, 20],
  ] as const)('%s at spot %s has intrinsic value %s and opposite short payoff', (type, spot, intrinsic) => {
    expect(optionPayoff(type, spot, 100)).toBe(intrinsic);
    expect(optionPayoff(type, spot, 100, 'short') + intrinsic).toBe(0);
    expect(optionProfit(type, spot, 100, 5)).toBe(intrinsic - 5);
    expect(optionProfit(type, spot, 100, 5, 'short')).toBe(5 - intrinsic);
  });

  it('property: put-call payoff parity holds; price parity is only a residual check', () => {
    const random = rng(4304);
    expect.assertions(600);
    for (let i = 0; i < 200; i++) {
      const spot = random() * 300;
      const strike = random() * 300;
      expect(optionPayoff('call', spot, strike) - optionPayoff('put', spot, strike))
        .toBeCloseTo(spot - strike, 10);
      expect(payoffParityResidual(spot, strike)).toBeCloseTo(0, 10);
      const df = discountFactor(0.05, 2);
      const difference = spot - strike * df;
      const put = 10 + Math.max(0, -difference);
      expect(putCallParityResidual(put + difference, put, spot, strike, df)).toBeCloseTo(0, 10);
    }
  });

  it('price-parity check reports inconsistent observed premiums', () => {
    expect(putCallParityResidual(10, 5, 100, 100, 0.95)).toBe(0);
    expect(putCallParityResidual(11, 5, 100, 100, 0.95)).toBe(1);
    expect(payoffParityResidual(0, 100)).toBe(0);
    expect(payoffParityResidual(100, 0)).toBe(0);
  });
});

const strategies = [
  { name: 'covered call', legs: coveredCall(100, 110, 5), cost: 95, payoffs: [70, 100, 110], profits: [-25, 5, 15], roots: [95] },
  { name: 'protective put', legs: protectivePut(100, 90, 4), cost: 104, payoffs: [90, 100, 130], profits: [-14, -4, 26], roots: [104] },
  { name: 'bull call spread', legs: bullSpread(90, 110, 15, 5), cost: 10, payoffs: [0, 10, 20], profits: [-10, 0, 10], roots: [100] },
  { name: 'bear put spread', legs: bearSpread(90, 110, 5, 15), cost: 10, payoffs: [20, 10, 0], profits: [10, 0, -10], roots: [100] },
  { name: 'straddle', legs: straddle(100, 6, 4), cost: 10, payoffs: [30, 0, 30], profits: [20, -10, 20], roots: [90, 110] },
  { name: 'strangle', legs: strangle(90, 110, 3, 2), cost: 5, payoffs: [20, 0, 20], profits: [15, -5, 15], roots: [85, 115] },
  { name: 'collar', legs: collar(100, 90, 110, 4, 5), cost: 99, payoffs: [90, 100, 110], profits: [-9, 1, 11], roots: [99] },
];

describe('option strategies as portfolios of signed legs', () => {
  it.each(strategies)('$name: hand payoffs, profit, cost and breakeven', ({ legs, cost, payoffs, profits, roots }) => {
    expect(strategyCost(legs)).toBe(cost);
    [70, 100, 130].forEach((spot, i) => {
      expect(strategyPayoff(legs, spot)).toBe(payoffs[i]);
      expect(strategyProfit(legs, spot)).toBe(profits[i]);
    });
    expect(breakevens(legs)).toEqual({ points: roots, intervals: [] });
  });

  it('property: each strategy payoff equals the independent sum of its leg payoffs', () => {
    const random = rng(4305);
    expect.assertions(5600);
    for (let i = 0; i < 200; i++) {
      const spot = random() * 250;
      const lower = 20 + random() * 100;
      const upper = lower + 1 + random() * 50;
      const p = random() * 10;
      const c = random() * 10;
      const entry = 20 + random() * 200;
      const portfolios = [coveredCall(entry, upper, c), protectivePut(entry, lower, p),
        bullSpread(lower, upper, p + c, c), bearSpread(lower, upper, p, p + c),
        straddle(lower, c, p), strangle(lower, upper, p, c), collar(entry, lower, upper, p, c)];
      for (const legs of portfolios) {
        const expected = legs.reduce((sum, leg) => sum + leg.quantity * (leg.type === 'stock' ? spot
          : leg.type === 'call' ? Math.max(spot - leg.strike, 0) : Math.max(leg.strike - spot, 0)), 0);
        expect(strategyPayoff(legs, spot)).toBeCloseTo(expected, 10);
        expect(strategyPayoff(legs, spot)).toBeCloseTo(legs.reduce((sum, leg) => sum + legPayoff(leg, spot), 0), 10);
        expect(strategyProfit(legs, spot)).toBeCloseTo(expected - strategyCost(legs), 10);
        const scaled = legs.map(leg => ({ ...leg, quantity: leg.quantity * -2.5 }));
        expect(strategyPayoff(scaled, spot)).toBeCloseTo(-2.5 * expected, 10);
      }
    }
  });

  it('breakevens include zero intervals, domain boundaries and empty/no-root portfolios', () => {
    expect(breakevens(straddle(100, 0, 0))).toEqual({ points: [100], intervals: [] });
    expect(breakevens(bullSpread(90, 110, 0, 0))).toEqual({ points: [], intervals: [{ from: 0, to: 90 }] });
    expect(breakevens(bullSpread(90, 110, 20, 0))).toEqual({ points: [], intervals: [{ from: 110, to: null }] });
    expect(breakevens(collar(100, 90, 110, 0, 10))).toEqual({ points: [], intervals: [{ from: 0, to: 90 }] });
    expect(breakevens([])).toEqual({ points: [], intervals: [{ from: 0, to: null }] });
    expect(breakevens([{ type: 'put', quantity: 1, strike: 10, premium: 20 }])).toEqual({ points: [], intervals: [] });
    expect(breakevens([{ type: 'stock', quantity: 1, entryPrice: 0 }])).toEqual({ points: [0], intervals: [] });
    const cancel: StrategyLeg[] = [{ type: 'call', quantity: 1, strike: 100, premium: 5 },
      { type: 'call', quantity: -1, strike: 100, premium: 5 }];
    expect(breakevens(cancel)).toEqual({ points: [], intervals: [{ from: 0, to: null }] });
    expect(strategyPayoff([], 100)).toBe(0);
    expect(strategyProfit([], 100)).toBe(0);
  });

  it('every reported isolated breakeven has zero profit', () => {
    for (const { legs } of strategies) {
      for (const root of breakevens(legs).points) expect(strategyProfit(legs, root)).toBeCloseTo(0, 10);
    }
  });
});

describe('PS4 Exercise 10 regression, including docs/AUDIT.md correction', () => {
  it('10a: no-dividend two-year delivery price is 48.67 €', () => {
    expect(forwardPrice(45, 0.04, 2)).toBeCloseTo(48.672, 10);
    expect(forwardPrice(45, 0.04, 2)).toBeCloseTo(48.67, 2);
    expect(forwardValue(45, 48.672, 0.04, 2)).toBeCloseTo(0, 10);
  });

  it('10b: six months elapsed; remaining 1.5 years, DF 0.9429, PV(K) 45.26, value 4.74', () => {
    const df = discountFactor(0.04, 2 - 0.5);
    expect(df).toBeCloseTo(0.9429, 4); // source incorrectly prints 0.9426
    expect(48 * df).toBeCloseTo(45.26, 2); // source incorrectly prints 45.24
    expect(forwardValue(50, 48, 0.04, 1.5)).toBeCloseTo(4.74, 2); // NOT 4.76
    expect(forwardValue(50, 48, 0.04, 1.5, 'short')).toBeCloseTo(-4.74, 2);
    expect(Math.abs(forwardValue(50, 48, 0.04, 1.5) - 4.76)).toBeGreaterThan(0.01);
  });

  it('10c: call payoff 4/0/0; profit 0.50/−3.50/−3.50; breakeven 51.50', () => {
    expect([52, 48, 44].map(spot => optionPayoff('call', spot, 48))).toEqual([4, 0, 0]);
    expect([52, 48, 44].map(spot => optionProfit('call', spot, 48, 3.5))).toEqual([0.5, -3.5, -3.5]);
    expect(breakevens([{ type: 'call', strike: 48, premium: 3.5, quantity: 1 }]).points).toEqual([51.5]);
  });

  it('10d: straddle pays 4 €, costs 5.50 €, loses 1.50 € at S = 44', () => {
    const legs = straddle(48, 3.5, 2);
    expect(optionPayoff('put', 44, 48)).toBe(4);
    expect(strategyPayoff(legs, 44)).toBe(4);
    expect(strategyCost(legs)).toBe(5.5);
    expect(strategyProfit(legs, 44)).toBe(-1.5);
    expect(breakevens(legs).points).toEqual([42.5, 53.5]);
  });
});

describe('invalid financial inputs', () => {
  it.each([-1, NaN, Infinity, -Infinity])('rejects negative/nonfinite prices and maturities: %s', bad => {
    expect(() => forwardPrice(bad, 0.04, 1)).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, bad)).toThrow(RangeError);
    expect(() => forwardValue(50, bad, 0.04, 1)).toThrow(RangeError);
    expect(() => forwardPayoff(bad, 50)).toThrow(RangeError);
    expect(() => optionPayoff('call', 50, bad)).toThrow(RangeError);
    expect(() => optionPayoff('put', bad, 50)).toThrow(RangeError);
    expect(() => optionProfit('call', 50, 50, bad)).toThrow(RangeError);
    expect(() => basis(50, bad)).toThrow(RangeError);
    expect(() => strategyProfit([], bad)).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { storageCostPV: bad })).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { income: [{ amount: bad, time: 0.5 }] })).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { income: [{ amount: 1, time: bad }] })).toThrow(RangeError);
    expect(() => fraPayoff(100, 0.03, 0.04, bad)).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, prices: [100, bad] })).toThrow(RangeError);
  });

  it('rejects invalid rates, inconsistent carry and cash income greater than spot', () => {
    expect(() => discountFactor(-1, 1)).toThrow(RangeError);
    expect(() => discountFactor(NaN, 1)).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { yield: { rate: -1, compounding: 'annual' } })).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { income: [{ amount: 1, time: 2 }] })).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, { income: [{ amount: 100, time: 0 }] })).toThrow(RangeError);
    expect(() => forwardPrice(50, 0.04, 1, {
      income: [{ amount: 1, time: 0 }], yield: { rate: 0.02, compounding: 'annual' },
    })).toThrow(RangeError);
    expect(() => fraPayoff(-1, 0.04, 0.05, 1)).toThrow(RangeError);
    expect(() => fraPayoff(100, 0.04, -1, 1)).toThrow(RangeError);
    expect(() => fraPayoff(100, -1, 0.04, 1)).toThrow(RangeError);
    expect(() => fraPayoff(100, Infinity, 0.04, 1)).toThrow(RangeError);
    expect(() => putCallParityResidual(1, 1, 1, 1, 0)).toThrow(RangeError);
  });

  it('rejects impossible margin parameters and excess withdrawals', () => {
    expect(() => futuresMarginAccount({ ...futuresExercise, prices: [] })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, contracts: 0 })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, contracts: 0.5 })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, multiplier: 0 })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, maintenanceMargin: 201 })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, initialMargin: -1 })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, withdrawals: [] })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, withdrawals: [0, 0, 81, 0] })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, withdrawals: [0, 1, 0, 0] })).toThrow(RangeError);
    expect(() => futuresMarginAccount({ ...futuresExercise, withdrawals: [-1, 0, 0, 0] })).toThrow(RangeError);
  });

  it('rejects negative strategy prices, nonfinite quantities and reversed strike order', () => {
    expect(() => coveredCall(-1, 100, 1)).toThrow(RangeError);
    expect(() => protectivePut(100, -1, 1)).toThrow(RangeError);
    expect(() => straddle(100, -1, 1)).toThrow(RangeError);
    expect(() => bullSpread(110, 90, 1, 1)).toThrow(RangeError);
    expect(() => bearSpread(90, 90, 1, 1)).toThrow(RangeError);
    expect(() => strangle(110, 90, 1, 1)).toThrow(RangeError);
    expect(() => collar(100, 110, 90, 1, 1)).toThrow(RangeError);
    expect(() => legPayoff({ type: 'stock', quantity: NaN, entryPrice: 100 }, 100)).toThrow(RangeError);
    expect(() => breakevens([{ type: 'put', quantity: 0, strike: -1, premium: 1 }])).toThrow(RangeError);
  });
});
