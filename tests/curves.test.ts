import { describe, expect, it } from 'vitest';
import { compoundGrowth, doublingTime, flowsFV, flowsPV, rule72, simpleGrowth } from '../src/lib/finance/curves';
import { npv } from '../src/lib/finance/appraisal';

const flows = [{ t: 0, amount: -100 }, { t: 2, amount: 40 }, { t: 3, amount: 40 }, { t: 5, amount: 60 }];

describe('flows', () => {
  it('VA agrees with npv on integer dates', () => {
    expect(flowsPV(0.1, flows)).toBeCloseTo(npv(0.1, [-100, 0, 40, 40, 0, 60]), 10);
  });
  it('VF at the horizon is VA (1+r)^T', () => {
    expect(flowsFV(0.1, flows, 5)).toBeCloseTo(flowsPV(0.1, flows) * 1.1 ** 5, 10);
  });
  it('r = 0 just adds', () => {
    expect(flowsPV(0, flows)).toBe(40);
  });
});

describe('growth', () => {
  it('simple vs compound', () => {
    expect(simpleGrowth(100, 0.05, 10)).toBeCloseTo(150, 10);
    expect(compoundGrowth(100, 0.05, 1, 10)).toBeCloseTo(162.889462677744, 9);
    expect(compoundGrowth(100, 0.12, 12, 1)).toBeCloseTo(112.68250301319698, 9);
  });
  it('doubling time doubles the capital; rule of 72 is close', () => {
    const d = doublingTime(0.08, 1)!;
    expect(compoundGrowth(100, 0.08, 1, d)).toBeCloseTo(200, 8);
    expect(d).toBeCloseTo(9.006468, 5);
    expect(rule72(0.08)).toBeCloseTo(9, 10);
    expect(doublingTime(0, 1)).toBeNull();
    expect(rule72(0)).toBeNull();
  });
});
