import { describe, expect, it } from 'vitest';
import {
  accruedCoupon, bondCashFlows, bondConvexity, bondPrice, bondPriceFromSpots,
  bootstrapSpotCurve, cashFlowRisk, cleanPrice, dirtyPrice, durationPriceChange,
  forwardRate, macaulayDuration, modifiedDuration, priceFromCashFlows,
  priceFromSpotCurve, spotFromZeroPrice, yieldFromCashFlows, yieldToMaturity,
  type Bond, type SpotRate,
} from '../src/lib/finance/bonds';

const near = (actual: number, expected: number, tolerance: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const annual: Bond = { face: 1000, couponRate: 0.05, maturity: 2 };
const curve: SpotRate[] = [
  { t: 1, rate: 0.03 }, { t: 2, rate: 0.035 }, { t: 3, rate: 0.04 },
  { t: 4, rate: 0.042 }, { t: 5, rate: 0.043 },
];
const date = (s: string) => new Date(`${s}T00:00:00Z`);

describe('bond hand values and conventions', () => {
  it('builds annual and quarterly coupon schedules', () => {
    expect(bondCashFlows(annual)).toEqual([{ t: 1, amount: 50 }, { t: 2, amount: 1050 }]);
    expect(bondCashFlows({ face: 1000, couponRate: 0.08, maturity: 0.5, frequency: 4 }))
      .toEqual([{ t: 0.25, amount: 20 }, { t: 0.5, amount: 1020 }]);
    expect(bondCashFlows({ ...annual, couponRate: 0 })).toEqual([{ t: 1, amount: 0 }, { t: 2, amount: 1000 }]);
  });

  it('prices explicit annual and semiannual cash flows', () => {
    near(bondPrice(annual, 0.04), 50 / 1.04 + 1050 / 1.04 ** 2, 1e-10);
    near(bondPrice({ ...annual, frequency: 2 }, 0.04),
      25 / 1.02 + 25 / 1.02 ** 2 + 25 / 1.02 ** 3 + 1025 / 1.02 ** 4, 1e-10);
    expect(bondPrice(annual, 0)).toBe(1100);
    near(bondPrice({ ...annual, couponRate: 0 }, -0.5), 4000, 1e-10);
  });

  it('uses annual effective spots even for quarterly coupons', () => {
    const bond = { ...annual, maturity: 0.5, frequency: 4 };
    const spots = [{ t: 0.25, rate: 0.04 }, { t: 0.5, rate: 0.05 }];
    near(bondPriceFromSpots(bond, spots), 12.5 / 1.04 ** 0.25 + 1012.5 / 1.05 ** 0.5, 1e-10);
    near(spotFromZeroPrice(1000, 1000 / 1.06 ** 2.5, 2.5), 0.06, 1e-12);
    near(spotFromZeroPrice(1000, 1100, 1), 1000 / 1100 - 1, 1e-12);
  });

  it.each([-1 + Number.EPSILON / 2, -0.999, -0.8, -0.03, 0, 0.05, 2, 25])('finds YTM without a fixed positive bracket: %s', (y) => {
    const zero = { face: 1000, couponRate: 0, maturity: 1 };
    const price = 1000 / (1 + y);
    const result = yieldToMaturity(zero, price);
    near(result, y, 1e-10);
    near(bondPrice(zero, result) / price, 1, 1e-12);
  });

  it('solves irregular positive cash flows with an annual effective yield by default', () => {
    const flows = [{ t: 2 / 12, amount: 36.25 }, { t: 4 / 12, amount: 1014.03 }];
    const target = 36.25 / 1.08 ** (2 / 12) + 1014.03 / 1.08 ** (4 / 12);
    near(yieldFromCashFlows(flows, target), 0.08, 1e-12);
  });

  it('matches analytic zero-coupon duration and convexity', () => {
    const zero = { ...annual, couponRate: 0, maturity: 5 };
    near(macaulayDuration(zero, 0.06), 5, 1e-12);
    near(modifiedDuration(zero, 0.06), 5 / 1.06, 1e-12);
    near(bondConvexity(zero, 0.06), 5 * 6 / 1.06 ** 2, 1e-12);
    near(bondConvexity({ ...zero, frequency: 2 }, 0.06), 5 * 5.5 / 1.03 ** 2, 1e-12);
  });
});

describe('Actual/Actual coupon-period accrued interest', () => {
  const previous = date('2025-11-15'), next = date('2026-02-15');
  it('counts actual days rather than month fractions', () => {
    near(accruedCoupon(36.25, previous, date('2025-12-15'), next), 36.25 * 30 / 92, 1e-12);
    near(accruedCoupon(36.25, date('2026-02-15'), date('2026-04-15'), date('2026-05-15')),
      36.25 * 59 / 89, 1e-12);
  });
  it('handles leap days, UTC civil dates and coupon boundaries', () => {
    near(accruedCoupon(50, date('2024-02-01'), date('2024-03-01'), date('2024-04-01')), 50 * 29 / 60, 1e-12);
    expect(accruedCoupon(36.25, previous, previous, next)).toBe(0);
    expect(accruedCoupon(36.25, previous, next, next)).toBe(36.25);
    expect(accruedCoupon(0, previous, previous, next)).toBe(0);
    expect(accruedCoupon(36.25, previous, new Date('2025-12-15T23:59:00Z'), next))
      .toBe(accruedCoupon(36.25, previous, date('2025-12-15'), next));
  });
  it('converts clean and dirty euro prices without rounding', () => {
    const accrued = accruedCoupon(36.25, previous, date('2025-12-15'), next);
    near(dirtyPrice(1011.6, accrued), 1023.420652173913, 1e-10);
    near(cleanPrice(dirtyPrice(1011.6, accrued), accrued), 1011.6, 1e-10);
  });
});

describe('grid properties of regular bonds', () => {
  // 3 faces × 3 maturities × 3 coupons × 3 frequencies × 4 yields = 324 cases.
  // Each case makes 10 assertions, independently checking the pricing derivatives.
  it.each([1, 2, 4])('cash flows, YTM, monotonicity, convexity and duration at frequency %s', (frequency) => {
    expect.assertions(1080);
    for (const face of [100, 1000, 10000]) for (const maturity of [1, 2, 7]) {
      for (const couponRate of [0, 0.03, 0.12]) for (const y of [-0.02, 0, 0.05, 0.2]) {
        const bond = { face, maturity, couponRate, frequency };
        const h = 1e-5;
        const price = bondPrice(bond, y);
        // Independent textbook sum, not bondCashFlows/priceFromCashFlows.
        const sum = Array.from({ length: maturity * frequency }, (_, i) =>
          (face * couponRate / frequency + (i + 1 === maturity * frequency ? face : 0)) /
          (1 + y / frequency) ** (i + 1)).reduce((a, b) => a + b, 0);
        near(price, sum, face * 1e-10);
        near(bondPrice(bond, yieldToMaturity(bond, price)), sum, face * 1e-10);
        const lower = bondPrice(bond, y - h), upper = bondPrice(bond, y + h);
        expect(lower).toBeGreaterThan(price);
        expect(price).toBeGreaterThan(upper);
        expect(lower + upper - 2 * price).toBeGreaterThan(0);
        near(modifiedDuration(bond, y), -(upper - lower) / (2 * h * price), 1e-7);
        near(bondConvexity(bond, y), (lower + upper - 2 * price) / (h * h * price), 2e-4);
        near(bondPrice({ ...bond, couponRate: Math.max(0, y) }, Math.max(0, y)), face, face * 1e-10);
        near(macaulayDuration({ ...bond, couponRate: 0 }, y), maturity, 1e-10);
        expect(bondConvexity(bond, y)).toBeGreaterThan(0);
      }
    }
  });

  it.each([1, 2, 4])('duration plus convexity improves the small-shift price estimate, frequency %s', (frequency) => {
    for (const maturity of [1, 5, 10]) for (const y of [-0.01, 0.03, 0.12]) {
      for (const dy of [-0.005, 0.005]) {
        const bond = { ...annual, maturity, frequency };
        const exact = bondPrice(bond, y + dy) - bondPrice(bond, y);
        const first = durationPriceChange(bond, y, dy);
        const second = durationPriceChange(bond, y, dy, true);
        expect(Math.abs(second - exact)).toBeLessThan(Math.abs(first - exact));
        expect(first * dy).toBeLessThan(0);
      }
    }
    expect(durationPriceChange(annual, 0.04, 0, true)).toBe(0);
  });
});

describe('curve properties on a grid', () => {
  it.each([1, 2, 4])('bootstrapped spots reprice every input bond, frequency %s', (frequency) => {
    for (const level of [-0.02, 0, 0.04]) for (const slope of [-0.001, 0, 0.003]) {
      const known = Array.from({ length: 5 * frequency }, (_, i) => ({
        t: (i + 1) / frequency, rate: level + slope * (i + 1) / frequency,
      }));
      const inputs = known.map(({ t }, i) => {
        const bond = { face: 1000, maturity: t, frequency, couponRate: 0.02 + (i % 3) * 0.01 };
        const price = Array.from({ length: i + 1 }, (_, k) =>
          (1000 * bond.couponRate / frequency + (k === i ? 1000 : 0)) /
          (1 + known[k].rate) ** known[k].t).reduce((a, b) => a + b, 0);
        return { ...bond, price };
      });
      const snapshot = JSON.stringify(inputs);
      const bootstrapped = bootstrapSpotCurve([...inputs].reverse());
      expect(JSON.stringify(inputs)).toBe(snapshot);
      bootstrapped.forEach((node, i) => {
        near(node.rate, known[i].rate, 1e-12);
        near(bondPriceFromSpots(inputs[i], bootstrapped), inputs[i].price, 1e-8);
      });
    }
  });

  it('bootstraps a standalone zero without unused intermediate spots', () => {
    const zero = { ...annual, couponRate: 0, maturity: 3, price: 900 };
    const spots = bootstrapSpotCurve([zero]);
    expect(spots).toHaveLength(1);
    near(spots[0].rate, (1000 / 900) ** (1 / 3) - 1, 1e-12);
    near(bondPriceFromSpots(zero, spots), 900, 1e-10);
  });

  it('forwards of arbitrary starts and lengths compound to the ending spot', () => {
    for (const level of [-0.03, 0, 0.03]) for (const slope of [-0.002, 0, 0.004]) {
      const spots = Array.from({ length: 12 }, (_, i) => ({ t: (i + 1) / 4, rate: level + slope * (i + 1) / 4 }));
      for (const start of [0, 0.25, 0.75, 1.5]) for (const length of [0.25, 0.5, 1.25]) {
        const f = forwardRate(spots, start, length);
        const startFactor = (1 + level + slope * start) ** start;
        near(startFactor * (1 + f) ** length, (1 + level + slope * (start + length)) ** (start + length), 1e-12);
      }
    }
    near(forwardRate(curve, 0, 3), 0.04, 1e-12);
  });
});

describe('PS4 audited answers (docs/AUDIT.md §2 and docs/audit/ps4_findings.md)', () => {
  it('Ex 6a: corrected final payment PV 980.19 and bond price 1028.73', () => {
    const zero = { ...annual, couponRate: 0 };
    near(bondPriceFromSpots(zero, curve), 933.51, 0.005);
    near(priceFromSpotCurve([{ t: 1, amount: 50 }], curve), 48.54, 0.005);
    near(priceFromSpotCurve([{ t: 2, amount: 1050 }], curve), 980.19, 0.005);
    near(bondPriceFromSpots(annual, curve), 1028.73, 0.005);
  });
  it('Ex 6b/c: purchased-price yields and Macaulay durations', () => {
    const zero = { ...annual, couponRate: 0 };
    const yA = yieldToMaturity(zero, 925), yB = yieldToMaturity(annual, 1035);
    near(yA * 100, 3.975, 0.0005);
    near(yB * 100, 3.17, 0.005);
    near(bondPrice(annual, yB), 1035, 1e-9);
    near(macaulayDuration(zero, yA), 2, 1e-12);
    near(macaulayDuration(annual, yB), 1.953, 0.0005);
  });
  it('Ex 6d: spot implied by the new forward, then the source-rounded 4% curve', () => {
    const r2 = Math.sqrt(1.035 * 1.045) - 1;
    near(r2 * 100, 4.0, 0.005);
    near(forwardRate([{ t: 1, rate: 0.035 }, { t: 2, rate: r2 }], 1, 1), 0.045, 1e-12);
    // The printed price answers use the rounded spot r2 = 4%, as the audit records.
    const shifted = [{ t: 1, rate: 0.035 }, { t: 2, rate: 0.04 }];
    near(bondPriceFromSpots({ ...annual, couponRate: 0 }, shifted), 924.56, 0.005);
    near(bondPriceFromSpots(annual, shifted), 1019.09, 0.005);
  });
  it('Ex 8: corrected f_{2,1} = 5.01%, and the other implied forwards', () => {
    near(forwardRate(curve, 1, 1) * 100, 4.00, 0.005);
    near(forwardRate(curve, 2, 1) * 100, 5.01, 0.005);
    near(forwardRate(curve, 1, 2) * 100, 4.50, 0.005);
    expect(forwardRate(curve, 2, 1)).toBeGreaterThan(0.045);
  });
  it('Ex 9a/b: printed purchase figures and corrected effective annual YTM 14.76%', () => {
    // PS4 uses 1/3 of a quarter and printed rounding, not Actual/Actual dates.
    near((150000 * 101 + 150000 * 101.2 + 50000 * 101.5) / 350000, 101.16, 0.005);
    near(36.25 / 3, 12.08, 0.005);
    expect(dirtyPrice(1011.6, 12.08)).toBeCloseTo(1023.68, 10);
    near(350 * dirtyPrice(1011.6, 12.08), 358288, 1e-8);
    const flows = Array.from({ length: 12 }, (_, i) => ({
      t: (3 * (i + 1) - 1) / 12, amount: 36.25 + (i === 11 ? 1000 : 0),
    }));
    const y = yieldFromCashFlows(flows, 1023.68); // Annual effective, as in the source equation.
    near(y * 100, 14.76, 0.005);
    near(priceFromCashFlows(flows, y), 1023.68, 1e-9);
  });
  it('Ex 9c: corrected sale 98.99%, proceeds 1014.03 and annual IRR 8.14%', () => {
    const salePercent = (100000 * 99.2 + 150000 * 99 + 100000 * 98.75) / 350000;
    near(salePercent, 98.99, 0.005);
    near(10 * salePercent, 989.86, 0.005);
    near(36.25 * 2 / 3, 24.17, 0.005);
    const proceeds = dirtyPrice(10 * salePercent, 36.25 * 2 / 3);
    near(proceeds, 1014.0238095238095, 1e-10);
    // The audit's printed 1014.03 adds the separately rounded 989.86 and 24.17.
    near(dirtyPrice(989.86, 24.17), 1014.03, 1e-10);
    const flows = [{ t: 2 / 12, amount: 36.25 }, { t: 4 / 12, amount: proceeds }];
    // Keep unrounded sale/accrual for IRR, as docs/audit/ps4.py does.
    const y = yieldFromCashFlows(flows, 1023.68);
    near(y * 100, 8.14, 0.005);
    near(priceFromCashFlows(flows, y), 1023.68, 1e-9);
  });
});

describe('input validation', () => {
  it.each([0, -1, NaN, Infinity])('rejects invalid maturity %s', (maturity) => {
    expect(() => bondPrice({ ...annual, maturity }, 0.05)).toThrow(RangeError);
    expect(() => spotFromZeroPrice(1000, 900, maturity)).toThrow(RangeError);
  });
  it.each([-1, -1.01, NaN, Infinity])('rejects invalid yield %s', (y) => {
    expect(() => bondPrice(annual, y)).toThrow(RangeError);
    expect(() => modifiedDuration(annual, y)).toThrow(RangeError);
    expect(() => bondPriceFromSpots(annual, [{ t: 1, rate: y }, { t: 2, rate: 0.04 }])).toThrow(RangeError);
  });
  it.each([0, -2, 1.5, Infinity])('rejects invalid frequency %s', (frequency) => {
    expect(() => bondPrice({ ...annual, frequency }, 0.05)).toThrow(RangeError);
    expect(() => yieldFromCashFlows([{ t: 1, amount: 100 }], 90, frequency)).toThrow(RangeError);
  });
  it('rejects invalid face, coupon, stub schedule and cash flows', () => {
    expect(() => bondCashFlows({ ...annual, face: 0 })).toThrow(RangeError);
    expect(() => bondCashFlows({ ...annual, couponRate: -0.01 })).toThrow(RangeError);
    expect(() => bondCashFlows({ ...annual, maturity: 1.3 })).toThrow(RangeError);
    expect(() => priceFromCashFlows([], 0.05)).toThrow(RangeError);
    expect(() => priceFromCashFlows([{ t: 0, amount: 100 }], 0.05)).toThrow(RangeError);
    expect(() => priceFromCashFlows([{ t: 1, amount: -100 }], 0.05)).toThrow(RangeError);
    expect(() => priceFromCashFlows([{ t: 1, amount: 0 }], 0.05)).toThrow(RangeError);
    expect(() => priceFromCashFlows([{ t: 1, amount: NaN }], 0.05)).toThrow(RangeError);
    expect(() => yieldToMaturity(annual, 0)).toThrow(RangeError);
    expect(() => yieldToMaturity({ ...annual, frequency: 4 }, 1e10)).toThrow(RangeError);
    expect(() => cashFlowRisk([{ t: 1000, amount: 1 }], 10)).toThrow(RangeError);
    expect(() => durationPriceChange(annual, 0.05, NaN)).toThrow(RangeError);
    expect(() => durationPriceChange(annual, 0.05, -1.1)).toThrow(RangeError);
  });
  it('rejects missing or duplicated spot nodes and invalid bootstrap data', () => {
    expect(() => bondPriceFromSpots(annual, [])).toThrow(RangeError);
    expect(() => bondPriceFromSpots(annual, [curve[0], curve[0]])).toThrow(RangeError);
    expect(() => bootstrapSpotCurve([])).toThrow(RangeError);
    expect(() => bootstrapSpotCurve([{ ...annual, price: 1000 }])).toThrow(RangeError);
    expect(() => bootstrapSpotCurve([{ ...annual, maturity: 1, price: -1 }])).toThrow(RangeError);
    expect(() => bootstrapSpotCurve([
      { ...annual, maturity: 1, price: 1000 }, { ...annual, price: 1 },
    ])).toThrow(RangeError);
    expect(() => bootstrapSpotCurve([
      { ...annual, maturity: 1, price: 1000 }, { ...annual, maturity: 1, price: 999 },
    ])).toThrow(RangeError);
    expect(() => forwardRate(curve, -1, 2)).toThrow(RangeError);
    expect(() => forwardRate(curve, 1, 0)).toThrow(RangeError);
    expect(() => forwardRate(curve, 0.5, 1)).toThrow(RangeError);
  });
  it('rejects invalid dates, out-of-period settlements and invalid prices', () => {
    const a = date('2026-01-01'), b = date('2026-02-01'), c = date('2026-03-01');
    expect(() => accruedCoupon(50, a, new Date(NaN), c)).toThrow(RangeError);
    expect(() => accruedCoupon(50, a, a, a)).toThrow(RangeError);
    expect(() => accruedCoupon(50, b, a, c)).toThrow(RangeError);
    expect(() => accruedCoupon(50, a, c, b)).toThrow(RangeError);
    expect(() => accruedCoupon(-1, a, b, c)).toThrow(RangeError);
    expect(() => cleanPrice(10, 11)).toThrow(RangeError);
    expect(() => dirtyPrice(10, -1)).toThrow(RangeError);
    expect(() => spotFromZeroPrice(1000, 0, 2)).toThrow(RangeError);
  });
});
