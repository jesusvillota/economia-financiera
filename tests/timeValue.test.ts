import { describe, expect, it } from 'vitest';
import * as tv from '../src/lib/finance/timeValue';

// Numbers from docs/audit/recompute.py (ps1 Ex 1-6), corrected values per docs/AUDIT.md.
const near = (x: number, want: number, tol: number) => expect(Math.abs(x - want)).toBeLessThanOrEqual(tol);

describe('capitalisation and rates', () => {
  it('ps1 Ex 1: simple interest', () => {
    expect(tv.simpleFV(150000, 0.06, 3.5)).toBeCloseTo(181500, 6);
    near(10000 / (1 + 0.05 * 10), 6666.67, 0.006);
    near(10000 / (1 + 0.03 * 3), 9174.31, 0.006);
    near(tv.proportionalRate(0.06, 4) * 150000, 2250, 0.006);
    for (const [k, d] of [[12, 0.005], [6, 0.01], [4, 0.015], [3, 0.02], [2, 0.03], [0.5, 0.12]]) {
      near(tv.proportionalRate(0.06, k), d, 1e-9);
    }
  });

  it('ps1 Ex 2: compound interest and equivalent rates', () => {
    near(tv.fv(25000, 0.08, 5), 36733.2, 1); // doc prints 36,734 (truncated)
    // tolerances: half a unit of the last printed digit; i_6 and i_3 are corrected digits
    near(tv.equivalentRate(0.08, 12), 0.006434, 5e-7);
    near(tv.equivalentRate(0.08, 6), 0.012909, 5e-7);
    near(tv.equivalentRate(0.08, 4), 0.019427, 5e-7);
    near(tv.equivalentRate(0.08, 3), 0.025986, 5e-7);
    near(tv.equivalentRate(0.08, 2), 0.03923, 5e-7);
    near(tv.equivalentRate(0.08, 0.5), 0.1664, 5e-7);
    near(25000 * tv.equivalentRate(0.08, 12), 160.85, 0.006);
    near(tv.pv(10000, 0.05, 10), 6139.13, 0.006);
    near(tv.equivalentRate(0.06, 12), 0.004868, 5e-7);
    near(tv.pv(10000, 0.06, 1.5), 9163, 1); // doc 9,165 is wrong; corrected 9,163
  });

  it('ps1 Ex 3: successive rates', () => {
    const c3 = 100000 * 1.06 * 1.08 ** 2;
    near(c3, 123638.4, 0.006);
    near((c3 / 1e5 - 1) / 3, 0.078794, 1e-5);
    near((c3 / 1e5) ** (1 / 3) - 1, 0.0732, 1e-4);
    near(tv.simpleFV(100000, 0.02, 12), 124000, 0.006);
    near(tv.effectiveFromNominal(0.06, 3) , 0.061208, 1e-6);
    near(tv.fv(100000, 0.02, 9), 119509, 1); // doc 119,500 rounds 1.02^9
  });

  it('nominal / effective / TAE round trips', () => {
    expect(tv.tae(0.12, 12)).toBeCloseTo(0.126825030131969, 12);
    expect(tv.nominalFromEffective(tv.effectiveFromNominal(0.06, 4), 4)).toBeCloseTo(0.06, 12);
    expect(tv.effectiveFromNominal(0.05, 1)).toBeCloseTo(0.05, 12);
  });
});

describe('present and future value', () => {
  it('PV(FV(x)) = x, incl. rate 0 and negative flows', () => {
    for (const [x, r, t] of [[1000, 0.07, 12], [-250, 0.03, 4.5], [42, 0, 9], [1000, -0.02, 3]]) {
      expect(tv.pv(tv.fv(x, r, t), r, t)).toBeCloseTo(x, 9);
    }
  });
});

describe('annuities', () => {
  const sumPV = (n: number, f: (t: number) => number, r: number) =>
    Array.from({ length: n }, (_, t) => f(t + 1) / (1 + r) ** (t + 1)).reduce((a, b) => a + b, 0);

  it('formula equals sum of discounted flows', () => {
    expect(tv.annuityPV(5000, 0.09, 8)).toBeCloseTo(sumPV(8, () => 5000, 0.09), 9);
    expect(tv.growingAnnuityPV(5000, 0.09, 0.03, 8)).toBeCloseTo(sumPV(8, (t) => 5000 * 1.03 ** (t - 1), 0.09), 9);
    expect(tv.annuityDuePV(100, 0.05, 6)).toBeCloseTo(sumPV(6, () => 100, 0.05) * 1.05, 9);
    expect(tv.annuityFV(100, 0.05, 6)).toBeCloseTo(tv.annuityPV(100, 0.05, 6) * 1.05 ** 6, 9);
    expect(tv.annuityDueFV(100, 0.05, 6)).toBeCloseTo(tv.annuityFV(100, 0.05, 6) * 1.05, 9);
  });

  it('rate 0 and r = g limits', () => {
    expect(tv.annuityPV(100, 0, 7)).toBe(700);
    expect(tv.annuityFV(100, 0, 7)).toBe(700);
    expect(tv.growingAnnuityPV(100, 0.05, 0.05, 4)).toBeCloseTo(400 / 1.05, 9);
    expect(tv.annuityPV(100, 1e-9, 7)).toBeCloseTo(700, 3);
  });

  it('ps1 Ex 4: corrected values (doc 29,269 / 31,885 / ... were wrong)', () => {
    near(tv.annuityPV(5000, 0.09, 8), 27674, 1);
    near(tv.growingAnnuityPV(5000, 0.09, 0.03, 8), 30354, 1);
    const t1 = tv.annuityPV(5000, 0.09, 3);
    const v3 = tv.growingAnnuityPV(5000, 0.09, 0.03, 5);
    near(t1, 12657, 1);
    near(v3, 20546, 1);
    near(tv.pv(v3, 0.09, 3), 15865, 1);
    near(t1 + tv.pv(v3, 0.09, 3), 28522, 1);
  });

  it('ps1 Ex 5: perpetuities', () => {
    near(tv.perpetuityPV(2500, 0.08), 31250, 1);
    near(tv.perpetuityPV(2500, 0.06), 41667, 1);
    near(2500 * 1.02 ** 5, 2760, 1);
    near(tv.perpetuityPV(2500 * 1.02 ** 5, 0.06), 46004, 1);
    near(tv.pv(tv.perpetuityPV(2500 * 1.02 ** 5, 0.06), 0.08, 5), 31309, 1); // doc 31,318
    expect(tv.growingPerpetuityPV(100, 0.1, 0.05)).toBeCloseTo(2000, 9);
    expect(() => tv.perpetuityPV(1, 0)).toThrow();
    expect(() => tv.growingPerpetuityPV(1, 0.05, 0.05)).toThrow();
  });

  it('ps1 Ex 6: corrected values (doc 55,612 / 16,756 / ... were wrong)', () => {
    const im = tv.equivalentRate(0.09, 12);
    near(im, 0.007207, 5e-7);
    const vm = tv.annuityPV(600, im, 120);
    const vg = tv.growingAnnuityPV(2000, 0.09, 0.04, 10);
    near(vm, 48083, 1);
    near(vg, 14989, 1);
    near(vm + vg, 63073, 1);
    near(tv.annuityDuePV(600, im, 120), 48430, 1);
  });
});
