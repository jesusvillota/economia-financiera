import { describe, expect, it } from 'vitest';
import {
  ValuationError, capitalWeights, discountedCashFlow, dividendPrice, dividendSchedule,
  enterpriseToEquity, fcfe, fcfeFromFcff, fcff, gordonPrice, impliedGrowth,
  multiStageDDM, pricePerShare, requiredReturn, terminalValue, wacc,
} from '../src/lib/finance/valuation';
import { pv } from '../src/lib/finance/timeValue';
import { npv } from '../src/lib/finance/appraisal';
import { holdingPeriodReturn } from '../src/lib/finance/risk';

// Independent answer constants: docs/audit/ps2.py and ps2_findings.md.
// Preserve audit tolerances, with the documented corrections. Monetary values are millions in Ex 4/5/7.
type Answer = [label: string, actual: number, expected: number, tolerance: number];
const cents = 0.006;
const exact = 1e-9;
const d1 = [2.2, 2.38, 2.56];
const p01 = dividendPrice(d1, 0.11, 34);
const dividendsPV = dividendPrice(d1, 0.11);
const d = dividendSchedule(1.1, [{ growth: 0.15, periods: 3 }]);
const p3a = gordonPrice(d[2] * 1.04, 0.1, 0.04);
const p3b = gordonPrice(d[2] * 1.05, 0.1, 0.05);
const p0a = multiStageDDM(1.1, [{ growth: 0.15, periods: 3 }], 0.1, 0.04);
const p0b = multiStageDDM(1.1, [{ growth: 0.15, periods: 3 }], 0.1, 0.05);
const p1 = dividendPrice(d.slice(1), 0.1, p3a);
// CAPM is TASK-023's API. Here these two audited inputs are calculated directly for the WACC regressions.
const ke5 = 0.03 + 1.2 * (0.09 - 0.03);
const w5 = wacc(600, 400, ke5, 0.05, 0.3);
const firmFlows = [95, 110, 125, 140, 150];
const tv5 = terminalValue(150, w5, 0.03);
const ev5 = discountedCashFlow(firmFlows, w5, tv5);
const tv3 = terminalValue(96, 0.1, 0.02);
const equity5 = discountedCashFlow([85, 90, 96], 0.1, tv3);
const ke7 = 0.025 + 1.25 * 0.06;
const w7 = wacc(0.2, 0.8, ke7, 0.052, 0.3);
const projectFlows = [55, 60, 68, 75];
const project = (r: number) => discountedCashFlow(projectFlows, r, terminalValue(75, r, 0.02));
const van = project(w7) - 950;
const vanLow = project(w7 - 0.01) - 950;
const vanHigh = project(w7 + 0.01) - 950;

const answers: Answer[] = [
  // Ex 1: P0 = 2.2/1.11 + 2.38/1.11² + (2.56+34)/1.11³.
  ['1 PV D1', pv(d1[0], 0.11, 1), 1.982, 0.0006],
  ['1 PV D2', pv(d1[1], 0.11, 2), 1.932, 0.0006],
  ['1 PV D3+P3', pv(d1[2] + 34, 0.11, 3), 26.732, 0.0006],
  ['1 P0', p01, 30.65, cents],
  ['1 PV D3 corrected rounding', pv(d1[2], 0.11, 3), 1.872, 0.0006],
  ['1 PV dividends', dividendsPV, 5.785, 0.0006],
  ['1 dividends % corrected', 100 * dividendsPV / p01, 18.88, cents],
  ['1 resale % corrected', 100 * pv(34, 0.11, 3) / p01, 81.12, cents],
  // Ex 2: g = .09-1.5/30 = .04; a 5% increase in D1 raises P0 by 5%.
  ['2a implied g', impliedGrowth(30, 1.5, 0.09), 0.04, exact],
  ['2b new D1', dividendSchedule(1.5, [{ growth: 0.05, periods: 1 }])[0], 1.575, exact],
  ['2b new P0', gordonPrice(1.5 * 1.05, 0.09, 0.04), 31.5, cents],
  ['2b change %', 100 * (gordonPrice(1.575, 0.09, 0.04) / 30 - 1), 5, cents],
  // Ex 3: Dk=1.1(1.15)^k; P3=D3(1+g2)/(.10-g2).
  ['3 D1', d[0], 1.265, 0.00005],
  ['3 D2', d[1], 1.4548, 0.0001],
  ['3 D3', d[2], 1.6730, 0.00005],
  ['3a D4', d[2] * 1.04, 1.7399, 0.00005],
  ['3a P3', p3a, 28.998, 0.0006],
  ['3a PV D1', pv(d[0], 0.1, 1), 1.150, 0.0006],
  ['3a PV D2', pv(d[1], 0.1, 2), 1.202, 0.0006],
  // The source's intermediate PV uses its rounded terminal price 29.00.
  ['3a PV D3+rounded P3', pv(d[2] + 29, 0.1, 3), 23.045, 0.0006],
  ['3a P0 exact chain', p0a, 25.40, cents],
  ['3b D4', d[2] * 1.05, 1.7567, 0.0001],
  ['3b P3', p3b, 35.134, 0.003],
  ['3b PV D3+rounded P3', pv(d[2] + 35.13, 0.1, 3), 27.651, 0.0006],
  ['3b P0 exact chain', p0b, 30.00, cents],
  ['3b price increase corrected', p0b - p0a, 4.61, cents],
  ['3b price increase %', 100 * (p0b / p0a - 1), 18.1, 0.06],
  ['3c PV D2 at t1', pv(d[1], 0.1, 1), 1.3225, 0.00006],
  ['3c PV D3+P3 at t1 corrected', pv(d[2] + p3a, 0.1, 2), 25.3479, 0.00006],
  ['3c P1', p1, 26.67, cents],
  ['3c dividend yield %', 100 * d[0] / p0a, 4.98, cents],
  ['3c capital gain % corrected', 100 * holdingPeriodReturn(p0a, p1), 5.02, cents],
  ['3c total return %', 100 * holdingPeriodReturn(p0a, p1, d[0]), 10, exact],
  // Ex 4: FCFF = 200(.7)+25-60-15=90; FCFE=90+25-60-15+10=50.
  ['4a EBIT after tax', fcff(200, 0.3, 0, 0, 0), 140, exact],
  ['4a FCFF', fcff(200, 0.3, 25, 60, 15), 90, exact],
  ['4b FCFE', fcfe(90, 25, 60, 15, 10), 50, exact],
  // Ex 5: WACC=.6(.102)+.4(.05)(.7)=.0752; TV5=154.5/.0452.
  ['5a ke %', 100 * ke5, 10.2, exact],
  ['5a WACC %', 100 * w5, 7.52, exact],
  ...[88.36, 95.15, 100.56, 104.75, 104.39].map((expected, i): Answer =>
    [`5b PV FCFF${i + 1}`, pv(firmFlows[i], w5, i + 1), expected, cents]),
  ['5b FCFF6', 150 * 1.03, 154.5, exact],
  ['5b TV5', tv5, 3418.14, cents],
  ['5b PV TV', pv(tv5, w5, 5), 2378.72, cents],
  ['5b EV rounded terms', [88.36, 95.15, 100.56, 104.75, 104.39, 2378.72].reduce((a, b) => a + b), 2871.93, cents],
  ['5b EV exact', ev5, 2871.93, cents],
  // Ex 5c: 96/1.1³=72.12622; TV3=96(1.02)/.08=1224; equity=1143.38843.
  ['5c PV FCFE1', pv(85, 0.1, 1), 77.27, cents],
  ['5c PV FCFE2', pv(90, 0.1, 2), 74.38, cents],
  ['5c PV FCFE3 corrected', pv(96, 0.1, 3), 72.13, cents],
  ['5c TV3', tv3, 1224, cents],
  ['5c PV TV3 corrected', pv(tv3, 0.1, 3), 919.61, cents],
  ['5c equity corrected', equity5, 1143.39, cents],
  ['5c price/share', pricePerShare(equity5, 60), 19.06, cents],
  // Ex 7: WACC=.2(.10)+.8(.052)(.7)=.04912. NPV=PV(flows+TV)-950.
  ['7a ke %', 100 * ke7, 10, exact],
  ['7a after-tax debt %', 100 * wacc(0, 1, ke7, 0.052, 0.3), 3.64, exact],
  ['7a WACC %', 100 * w7, 4.912, 0.0005],
  ...[
    { tag: 'b', r: w7, pvs: [52.42, 54.51, 58.89, 61.91], tv: 2627.06, pvtv: 2168.55, roundedTotal: 2396.28, total: 2396.29, npv: 1446.29 },
    { tag: 'c low corrected', r: w7 - 0.01, pvs: [52.93, 55.57, 60.61, 64.33], tv: 4001.05, pvtv: 3431.71, roundedTotal: 3665.15, total: 3665.14, npv: 2715.14 },
    { tag: 'c high corrected', r: w7 + 0.01, pvs: [51.93, 53.49, 57.24, 59.60], tv: 1955.52, pvtv: 1554.11, roundedTotal: 1776.37, total: 1776.37, npv: 826.37 },
  ].flatMap(({ tag, r, pvs, tv, pvtv, roundedTotal, total, npv: expectedNPV }): Answer[] => [
    ...pvs.map((expected, i): Answer => [`7${tag} PV${i + 1}`, pv(projectFlows[i], r, i + 1), expected, cents]),
    [`7${tag} TV4`, terminalValue(75, r, 0.02), tv, cents],
    [`7${tag} PV TV`, pv(terminalValue(75, r, 0.02), r, 4), pvtv, cents],
    [`7${tag} total rounded terms`, pvs.reduce((a, b) => a + b, pvtv), roundedTotal, cents],
    [`7${tag} total exact`, project(r), total, cents],
    [`7${tag} NPV`, project(r) - 950, expectedNPV, cents],
  ]),
  ['7c low WACC %', 100 * (w7 - 0.01), 3.912, 0.0005],
  ['7c high WACC %', 100 * (w7 + 0.01), 5.912, 0.0005],
  ['7c NPV increase corrected', vanLow - van, 1268.85, cents],
  ['7c NPV increase %', 100 * (vanLow / van - 1), 87.7, 0.06],
  ['7c NPV decrease corrected', van - vanHigh, 619.92, cents],
  ['7c NPV decrease %', 100 * (1 - vanHigh / van), 42.9, 0.06],
];

describe('PS2 valuation: every audited answer, Ex 1–5 and 7', () => {
  it.each(answers)('audited PS2 answer: %s', (_label, actual, expected, tolerance) => {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance + Number.EPSILON);
  });
});

describe('valuation formulas and properties', () => {
  it('PS2 Ex 7c: discount-rate sensitivity is convex, not exponential', () => {
    const step = 0.001;
    expect(project(w7 - step) + project(w7 + step)).toBeGreaterThan(2 * project(w7));
    // An exponential has equal ratios over equal rate steps; this DCF does not.
    expect(project(w7 - 0.01) / project(w7)).not.toBeCloseTo(project(w7) / project(w7 + 0.01), 3);
    expect(terminalValue(75, w7, 0.02)).toBeCloseTo(2627.06, 2);
  });
  it.each([-0.1, 0, 0.03, 0.1])('Gordon equals a long discounted dividend sum (g=%s)', (g) => {
    const r = g + 0.06;
    // Sum D1 [(1+g)/(1+r)]^(t-1)/(1+r); 2,000 periods make the tail negligible.
    const dividends = Array.from({ length: 2000 }, (_, i) => 2 * (1 + g) ** i);
    expect(dividendPrice(dividends, r)).toBeCloseTo(gordonPrice(2, r, g), 10);
  });
  it('Gordon inverse formulas recover price and rates', () => {
    for (const r of [0.02, 0.1, 0.25]) for (const g of [-0.02, 0, 0.01]) {
      const price = gordonPrice(2, r, g);
      expect(impliedGrowth(price, 2, r)).toBeCloseTo(g, 12);
      expect(requiredReturn(price, 2, g)).toBeCloseTo(r, 12);
    }
  });
  it.each([[0, 400], [600, 0], [600, 400], [1e-6, 1e6], [20, 80]])('WACC weights sum to 1 (E=%s,D=%s)', (e, d) => {
    const weights = capitalWeights(e, d);
    expect(weights.equity + weights.debt).toBeCloseTo(1, 14);
    expect(wacc(e, d, 0.1, 0.05, 0.3)).toBeCloseTo(weights.equity * 0.1 + weights.debt * 0.035, 14);
  });
  it('applies the tax shield only to debt', () => {
    expect(wacc(600, 400, 0.1, 0.05, 0)).toBeCloseTo(0.08, 12);
    expect(wacc(600, 400, 0.1, 0.05, 1)).toBeCloseTo(0.06, 12);
  });
  it('places terminal value after the final dividend, including one-period and empty horizons', () => {
    expect(dividendPrice([2], 0.1, 20)).toBeCloseTo(20, 12); // (2+20)/1.1
    expect(dividendPrice([], 0.1, 20)).toBe(20);
    expect(dividendPrice([2, 2], 0)).toBe(4);
    expect(dividendPrice([2], -0.5)).toBe(4);
    expect(gordonPrice(0, 0.1, 0.02)).toBe(0);
    expect(terminalValue(100, 0.1, -1)).toBe(0);
  });
  it('supports multiple explicit stages without shifting the terminal date', () => {
    const stages = [{ growth: 0.1, periods: 2 }, { growth: 0, periods: 1 }];
    expect(dividendSchedule(2, stages)).toEqual([2.2, 2.4200000000000004, 2.4200000000000004]);
    // D1=2.2, D2=D3=2.42; P3=2.42(1.02)/.08=30.855.
    expect(multiStageDDM(2, stages, 0.1, 0.02)).toBeCloseTo(2.2 / 1.1 + 2.42 / 1.21 + (2.42 + 30.855) / 1.331, 10);
    expect(multiStageDDM(2, [], 0.1, 0.02)).toBeCloseTo(gordonPrice(2.04, 0.1, 0.02), 12);
  });
  it('reconciles FCFF/FCFE and bridges enterprise to equity value', () => {
    expect(fcfeFromFcff(90, 50 / 0.7, 0.3, 10)).toBeCloseTo(50, 12);
    expect(enterpriseToEquity(ev5, 400, 20)).toBeCloseTo(2491.93396106, 7);
    expect(enterpriseToEquity(100, 150)).toBe(-50);
    expect(fcff(-20, 0.3, 5, 10, -2)).toBe(-17);
    expect(fcfe(-10, 5, 10, -2, -3)).toBe(-16);
    expect(discountedCashFlow([-10, 20], 0.1)).toBeCloseTo(-10 / 1.1 + 20 / 1.21, 12);
    expect(terminalValue(-10, 0.1, 0.02)).toBeCloseTo(-127.5, 12);
    expect(project(w7) - 950).toBeCloseTo(npv(w7, [-950, 55, 60, 68, 75 + terminalValue(75, w7, 0.02)]), 10);
  });
});

describe('typed valuation domain errors', () => {
  const invalid: [string, () => unknown][] = [
    ['r=g', () => gordonPrice(2, 0.04, 0.04)],
    ['r<g', () => gordonPrice(2, 0.03, 0.04)],
    ['nonfinite rate', () => gordonPrice(2, NaN, 0.02)],
    ['negative dividend', () => gordonPrice(-1, 0.1, 0)],
    ['growth below -100%', () => terminalValue(2, 0.1, -1.1)],
    ['terminal r=g', () => terminalValue(2, 0.1, 0.1)],
    ['zero price', () => impliedGrowth(0, 2, 0.1)],
    ['zero next dividend', () => requiredReturn(20, 0, 0.02)],
    ['invalid implied growth', () => impliedGrowth(1, 10, 0.1)],
    ['invalid required return', () => requiredReturn(20, 2, -2)],
    ['infinite dividend', () => dividendPrice([Infinity], 0.1)],
    ['negative explicit dividend', () => dividendPrice([-1], 0.1)],
    ['negative terminal price', () => dividendPrice([1], 0.1, -1)],
    ['discount rate -100%', () => dividendPrice([1], -1)],
    ['infinite cash flow', () => discountedCashFlow([Infinity], 0.1)],
    ['infinite terminal', () => discountedCashFlow([], 0.1, Infinity)],
    ['negative D0', () => dividendSchedule(-1, [])],
    ['fractional stage', () => dividendSchedule(1, [{ growth: 0.1, periods: 1.5 }])],
    ['zero stage', () => dividendSchedule(1, [{ growth: 0.1, periods: 0 }])],
    ['invalid stage growth', () => dividendSchedule(1, [{ growth: -2, periods: 1 }])],
    ['invalid terminal growth', () => multiStageDDM(1, [], 0.1, 0.1)],
    ['zero capital', () => capitalWeights(0, 0)],
    ['negative capital', () => capitalWeights(-1, 2)],
    ['nonfinite capital', () => capitalWeights(Infinity, 1)],
    ['invalid cost', () => wacc(1, 1, NaN, 0.05, 0.3)],
    ['tax >1', () => wacc(1, 1, 0.1, 0.05, 1.1)],
    ['tax <0', () => fcff(1, -0.1, 0, 0, 0)],
    ['nonfinite FCFE', () => fcfe(NaN, 0, 0, 0, 0)],
    ['invalid reconciliation tax', () => fcfeFromFcff(1, 1, NaN, 0)],
    ['negative bridge debt', () => enterpriseToEquity(1, -1)],
    ['negative bridge cash', () => enterpriseToEquity(1, 0, -1)],
    ['zero shares', () => pricePerShare(1, 0)],
  ];
  it.each(invalid)('%s', (_label, run) => expect(run).toThrow(ValuationError));
});
