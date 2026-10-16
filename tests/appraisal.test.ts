import { describe, expect, it } from 'vitest';
import { discountedPayback, irr, npv, payback, profitabilityIndex } from '../src/lib/finance/appraisal';

// Numbers from docs/audit/recompute.py (ps1 Ex 7-10), corrected values per docs/AUDIT.md.
const near = (x: number, want: number, tol: number) => expect(Math.abs(x - want)).toBeLessThanOrEqual(tol);
const ex7 = [-120000, 40000, 45000, 50000, 55000];

describe('npv', () => {
  it('ps1 Ex 7: NPV at 10%', () => {
    near(npv(0.1, ex7), 28685, 1); // doc 28,684 truncates the terms
    near(40000 / 1.1, 36364, 1);
    near(55000 / 1.1 ** 4, 37565, 1);
  });
  it('rate 0 is the plain sum; negative flows allowed', () => {
    expect(npv(0, ex7)).toBe(70000);
    expect(npv(0.05, [-100, -100])).toBeCloseTo(-195.238095238095, 9);
  });
  it('ps1 Ex 10a: equal NPVs', () => {
    near(npv(0.1, [-1000, 1200]), 90.91, 0.006);
    near(npv(0.1, [-1000, 200, 1100]), 90.91, 0.006);
  });
});

describe('irr', () => {
  it('ps1 Ex 9: -100, 60, 60 -> (sqrt69 - 7)/10', () => {
    const { roots, multiple } = irr([-100, 60, 60]);
    expect(multiple).toBe(false);
    expect(roots).toHaveLength(1);
    near(roots[0], 0.1307, 5e-5);
    near(roots[0], (Math.sqrt(69) - 7) / 10, 1e-9);
  });
  it('ps1 Ex 10c: IRR of A and B', () => {
    near(irr([-1000, 1200]).roots[0], 0.2, 1e-9);
    near(irr([-1000, 200, 1100]).roots[0], 0.154, 5e-4);
  });
  it('NPV at the IRR is 0 within 1e-9', () => {
    for (const f of [ex7, [-100, 60, 60], [-1000, 200, 1100], [-50, -20, 90, 40]]) {
      for (const r of irr(f).roots) near(npv(r, f), 0, 1e-9);
    }
  });
  it('no IRR when all flows share a sign', () => {
    expect(irr([100, 50, 20]).roots).toEqual([]);
    expect(irr([-100, -50]).multiple).toBe(false);
  });
  it('reports multiple IRRs', () => {
    // -(x-1.1)(x-1.2)(x-1.3) scaled: roots 10%, 20%, 30%
    const f = [-1000, 3600, -4310, 1716]; // roots 10%, 20%, 30%
    const { roots, multiple } = irr(f);
    expect(multiple).toBe(true);
    expect(roots).toHaveLength(3);
    [0.1, 0.2, 0.3].forEach((r, i) => near(roots[i], r, 1e-9));
  });
  it('negative IRR', () => {
    near(irr([-100, 50, 40]).roots[0], 1 / ((-50 + Math.sqrt(18500)) / 80) - 1, 1e-9); // 40y^2+50y-100=0, y=1/(1+r)
    near(npv(irr([-100, 50, 40]).roots[0], [-100, 50, 40]), 0, 1e-9);
  });
});

describe('payback, discounted payback, PI', () => {
  it('ps1 Ex 8 (corrected): PR 2.70, PRD 3.24', () => {
    near(payback(ex7)!, 2.7, 0.005);
    near(discountedPayback(0.1, ex7)!, 3.24, 0.005); // doc 3.46 was wrong
  });
  it('ps1 Ex 10b', () => {
    near(payback([-1000, 1200])!, 0.833, 5e-4);
    near(payback([-1000, 200, 1100])!, 1.73, 0.005);
    near(discountedPayback(0.1, [-1000, 1200])!, 0.917, 5e-4);
    near(discountedPayback(0.1, [-1000, 200, 1100])!, 1.9, 0.005);
  });
  it('never recovered -> null; zero outlay -> 0', () => {
    expect(payback([-100, 10, 10])).toBeNull();
    expect(discountedPayback(0.5, [-100, 60, 60])).toBeNull();
    expect(payback([0, 5])).toBe(0);
  });
  it('profitability index', () => {
    expect(profitabilityIndex(0.1, [-1000, 1100])).toBeCloseTo(1, 12);
    near(profitabilityIndex(0.1, ex7), 148685.2 / 120000, 1e-4);
  });
});
