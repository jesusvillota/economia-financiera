import { describe, expect, it } from 'vitest';
import { annuityClosedPV, annuityFlows, annuitySumPV, perpetuityClosedPV } from '../src/lib/finance/annuities';
import { pv, annuityPV, annuityDuePV, growingAnnuityPV, perpetuityPV } from '../src/lib/finance/timeValue';

// Every number quoted in src/content/chapters/02-valor-actual.mdx.
describe('numbers of chapter 2', () => {
  it('discounting one flow: 1.000 € in 5 years at 5 %', () => {
    expect(pv(1000, 0.05, 5)).toBeCloseTo(783.53, 2);
    expect(1.05 ** -5).toBeCloseTo(0.7835, 4);
  });
  it('annuity of 1.000 €, 10 years, 5 %', () => {
    expect(annuityPV(1000, 0.05, 10)).toBeCloseTo(7721.73, 2);
    expect((1 - 1.05 ** -10) / 0.05).toBeCloseTo(7.7217, 4);
    expect(annuityDuePV(1000, 0.05, 10)).toBeCloseTo(8107.82, 2);
  });
  it('perpetuity 1.000 € at 5 %', () => {
    expect(perpetuityPV(1000, 0.05)).toBe(20000);
    expect(1000 / 1.05 ** 10 / 0.05).toBeCloseTo(12278.27, 2); // value of the tail after year 10
    expect(20000 - annuityPV(1000, 0.05, 10)).toBeCloseTo(12278.27, 2);
    expect(annuityPV(1000, 0.05, 50)).toBeCloseTo(18255.93, 2);
  });
  it('growing annuity 1.000 €, g = 5 %, r = 10 %, n = 10 (the source says 7.710: wrong)', () => {
    expect(growingAnnuityPV(1000, 0.1, 0.05, 10)).toBeCloseTo(7439.81, 2);
    expect(1000 * 1.05 ** 9).toBeCloseTo(1551.33, 2);
    expect((1.05 / 1.1) ** 10).toBeCloseTo(0.628, 3);
    expect(perpetuityClosedPV(1000, 0.1, 0.05, false)).toBeCloseTo(20000, 6);
  });
});

describe('builder', () => {
  it.each([[0, false], [0, true], [0.03, false], [0.03, true]])('closed form = sum of flows (g=%s, due=%s)', (g, due) => {
    expect(annuityClosedPV(300, 0.07, g, 12, due)).toBeCloseTo(annuitySumPV(300, 0.07, g, 12, due), 8);
  });
  it('flow dates', () => {
    expect(annuityFlows(100, 0, 3, false).map((f) => f.t)).toEqual([1, 2, 3]);
    expect(annuityFlows(100, 0.1, 3, true).map((f) => f.t)).toEqual([0, 1, 2]);
    expect(annuityFlows(100, 0.1, 3, true)[2].amount).toBeCloseTo(121, 10);
  });
  it('perpetuity is the limit of the annuity; undefined if r <= g', () => {
    expect(annuityClosedPV(100, 0.05, 0, 2000, false)).toBeCloseTo(perpetuityClosedPV(100, 0.05, 0, false)!, 6);
    expect(perpetuityClosedPV(100, 0.05, 0.05, false)).toBeNull();
  });
});
