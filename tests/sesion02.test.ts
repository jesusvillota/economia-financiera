import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import katex from 'katex';
import { katexOptions } from '../src/lib/katexMacros';
import { sessionSchema } from '../src/schemas/problem-session';
import { interpolate, variant, withinTolerance } from '../src/lib/problems/variant';
import * as lib from '../src/lib/sesion02';
import { parts } from '../src/data/curriculum';

const fm = sessionSchema.parse(parse(readFileSync('src/content/sesiones/02-acciones-empresas-riesgo.mdx', 'utf8').split('---')[1]));
type P = Record<string, number>;
type Ref = Record<string, number>;
const defaults = (ex: typeof fm.exercises[number]) => Object.fromEntries(ex.parameters.map(p => [p.id, p.default]));
const call = (answer: typeof fm.exercises[number]['answers'][number], p: P) => {
  const fn = lib[answer.lib.fn as keyof typeof lib] as (...args: number[]) => number;
  return fn(...answer.lib.args.map(id => p[id]));
};
// Independent arithmetic: these references never call the production finance library.
const discount = (flows: number[], rate: number, terminal = 0) => flows.reduce((sum, c, i) => sum + c / (1 + rate) ** (i + 1), terminal / (1 + rate) ** flows.length);
const cost = (p: P) => (p.e * (p.rf + p.beta * p.premium) + p.debt * p.kd * (1 - p.tax / 100)) / (p.e + p.debt);
const terminal = (flow: number, r: number, g: number) => flow * (1 + g / 100) / ((r - g) / 100);
const stage = (p: P, g: number) => {
  let d = p.d0;
  const flows = [];
  for (let t = 1; t <= p.n; t++) { d *= 1 + p.g1 / 100; flows.push(d); }
  const tv = d * (1 + g / 100) / ((p.r - g) / 100);
  return { flows, tv, price: discount(flows, p.r / 100, tv) };
};
const ref: Record<string, (p: P) => Ref> = {
  ej1: p => {
    const dividends = discount([p.d1, p.d2, p.d3], p.r / 100);
    const resale = p.sale / (1 + p.r / 100) ** 3;
    return { price: dividends + resale, div_share: 100 * dividends / (dividends + resale), sale_share: 100 * resale / (dividends + resale) };
  },
  ej2: p => ({ growth: p.r - 100 * p.d1 / p.price, new_price: p.price * (1 + p.change / 100), price_change: p.change }),
  ej3: p => {
    const { flows, tv, price } = stage(p, p.g2);
    // Revalue the remaining cash flows at t=1 independently, rather than use P0(1+r)-D1.
    const p1 = discount(flows.slice(1), p.r / 100, tv);
    return { price, terminal: tv, alternative: stage(p, p.g_alt).price, year_one: p1, yield: 100 * flows[0] / price, gain: 100 * (p1 - price) / price, total: 100 * (p1 + flows[0] - price) / price };
  },
  ej4: p => ({ firm_flow: p.ebit * (1 - p.tax / 100) + p.dep - p.capex - p.wc, equity_flow: p.income + p.dep - p.capex - p.wc + p.debt }),
  ej5: p => {
    const r = cost(p);
    const tv = terminal(p.c5, r, p.g);
    const equity = discount([p.f1, p.f2, p.f3], p.re / 100, terminal(p.f3, p.re, p.ge));
    return { cost: p.rf + p.beta * p.premium, capital_cost: r, terminal: tv, firm_value: discount([p.c1, p.c2, p.c3, p.c4, p.c5], r / 100, tv), third_pv: p.f3 / (1 + p.re / 100) ** 3, equity_value: equity, price: equity / p.shares };
  },
  ej7: p => {
    const r = cost(p);
    const project = (shift: number) => discount([p.c1, p.c2, p.c3, p.c4], (r + shift) / 100, terminal(p.c4, r + shift, p.g)) - p.investment;
    return { capital_cost: r, npv: project(0), npv_low: project(-1), npv_high: project(1) };
  },
  ej8: p => {
    const prob = [p.p1, p.p2, 1 - p.p1 - p.p2];
    const a = [p.a1, p.a2, p.a3].map(x => x / 100);
    const b = [p.b1, p.b2, p.b3].map(x => x / 100);
    const m = [p.m1, p.m2, p.m3].map(x => x / 100);
    const mean = (x: number[]) => x.reduce((sum, r, i) => sum + prob[i] * r, 0);
    // Raw second moments give an independent check of the centered production formulas.
    const variance = (x: number[]) => mean(x.map(r => r * r)) - mean(x) ** 2;
    const covariance = (x: number[], y: number[]) => mean(x.map((r, i) => r * y[i])) - mean(x) * mean(y);
    return { a_mean: 100 * mean(a), b_mean: 100 * mean(b), a_var: variance(a), b_var: variance(b), a_sd: 100 * Math.sqrt(variance(a)), b_sd: 100 * Math.sqrt(variance(b)), covariance: covariance(a, b), correlation: covariance(a, b) / Math.sqrt(variance(a) * variance(b)), beta_a: covariance(a, m) / variance(m), beta_b: covariance(b, m) / variance(m) };
  },
  ej9: p => {
    const returns = Array.from({ length: 6 }, (_, i) => (p[`p${i + 1}`] + (i < 4 ? p.d : p.dl)) / p[`p${i}`] - 1);
    const mean = returns.reduce((s, r) => s + r, 0) / 6;
    const sd = Math.sqrt(returns.reduce((s, r) => s + (r - mean) ** 2, 0) / 5);
    return { ...Object.fromEntries(returns.map((r, i) => [`r${i + 1}`, 100 * r])), mean: 100 * mean, sd: 100 * sd, annual: 100 * sd * Math.sqrt(12) };
  },
};

describe('sesión 2: every active source exercise', () => {
  it('covers the active TeX inventory and every requested answer', () => {
    const tex = readFileSync('source/problem_sets/ps2/ps2_wordings.tex', 'utf8').split('\n').filter(line => !line.trimStart().startsWith('%')).join('\n');
    const ids = [...tex.matchAll(/\\begin\{ejercicio\}\{(\d+)/g)].map(m => `ej${m[1]}`);
    expect(fm.exercises.map(e => e.id)).toEqual(ids);
    expect(fm.exercises.map(e => e.id)).toEqual(Object.keys(ref));
    expect(fm.exercises.reduce((n, e) => n + e.answers.length, 0)).toBe(45);
    expect(fm.chapters).toEqual(parts[1].chapters.map(c => c.slug));
    expect(fm.number).toBe(2);
    expect(fm.source).toBe('ps2');
  });

  for (const ex of fm.exercises) {
    it(`${ex.id}: references, hints, placeholders and parameters are complete`, () => {
      const p = defaults(ex);
      expect(ex.answers.map(a => a.id).sort()).toEqual(Object.keys(ref[ex.id](p)).sort());
      expect(ex.hints).toHaveLength(3);
      expect(ex.concepts.every(c => fm.chapters.includes(c))).toBe(true);
      expect(ex.parameters.some(p => p.min !== undefined)).toBe(true);
      for (const a of ex.answers) {
        expect(a.lib.module).toBe('sesion02');
        expect(a.lib.args.every(id => id in p)).toBe(true);
      }
      const answerIds = new Set(ex.answers.map(a => a.id));
      const values = { ...p, ...Object.fromEntries(ex.answers.map(a => [a.id, call(a, p)])) };
      for (const text of [ex.statement, ...ex.hints, ...ex.steps.map(s => s.body)]) {
        expect(text).not.toMatch(/[\u0000-\u001f]/);
        for (const match of interpolate(text, values).matchAll(/\$([^$]+)\$/g)) {
          expect(() => katex.renderToString(match[1], { ...katexOptions, throwOnError: true })).not.toThrow();
        }
      }
      for (const text of [ex.statement, ...ex.hints]) for (const match of text.matchAll(/\{\{(\w+)\}\}/g)) expect(match[1] in p).toBe(true);
      for (const step of ex.steps) for (const match of step.body.matchAll(/\{\{(\w+)\}\}/g)) expect(match[1] in p || answerIds.has(match[1])).toBe(true);
    });
    for (const answer of ex.answers) {
      it(`${ex.id}.${answer.id}: canonical variant matches library, frontmatter and independent calculation`, () => {
        const p = defaults(ex);
        const got = call(answer, p);
        expect(withinTolerance(got, answer.value, answer.tolerance)).toBe(true);
        expect(got).toBeCloseTo(ref[ex.id](p)[answer.id], 10);
      });
      it(`${ex.id}.${answer.id}: 20 seeded variants and range boundaries remain valid`, () => {
        const cases = Array.from({ length: 20 }, (_, seed) => variant(ex.parameters, ex.seed + seed + 1));
        for (const edge of ['min', 'max'] as const) cases.push(Object.fromEntries(ex.parameters.map(p => [p.id, p[edge] ?? p.default])));
        for (const p of cases) {
          for (const spec of ex.parameters) {
            if (spec.min !== undefined) expect(p[spec.id]).toBeGreaterThanOrEqual(spec.min);
            if (spec.max !== undefined) expect(p[spec.id]).toBeLessThanOrEqual(spec.max);
          }
          const got = call(answer, p);
          expect(Number.isFinite(got)).toBe(true);
          expect(got).toBeCloseTo(ref[ex.id](p)[answer.id], 9);
          // The displayed solution must also be accepted at the checker's precision.
          expect(withinTolerance(Number(got.toFixed(answer.unit === '€' ? 2 : 4)), got, answer.tolerance)).toBe(true);
        }
      });
    }
  }

  it('asserts the corrected AUDIT numbers, including Ex 5c, 7c and the appendix', () => {
    const d = (id: string) => defaults(fm.exercises.find(e => e.id === id)!);
    const five = ref.ej5(d('ej5'));
    expect(five.third_pv).toBeCloseTo(72.13, 2);
    expect(five.equity_value).toBeCloseTo(1143.39, 2);
    expect(lib.equityValue(85, 90, 96, 10, 2)).toBeCloseTo(1143.39, 2);
    expect(lib.equityPrice(85, 90, 96, 10, 2, 60)).toBeCloseTo(19.06, 2);
    expect(lib.flowPV(1224, 10, 3)).toBeCloseTo(919.61, 2);
    const seven = ref.ej7(d('ej7'));
    expect(seven.npv_low).toBeCloseTo(2715.14, 2);
    expect(seven.npv_high).toBeCloseTo(826.37, 2);
    expect(seven.npv_low - seven.npv).toBeCloseTo(1268.85, 2);
    expect(seven.npv - seven.npv_high).toBeCloseTo(619.92, 2);
    for (const [flow, r, t, expected] of [[60, 3.912, 2, 55.57], [68, 3.912, 3, 60.61], [75, 3.912, 4, 64.33], [60, 5.912, 2, 53.49], [68, 5.912, 3, 57.24], [75, 5.912, 4, 59.60]]) expect(lib.flowPV(flow, r, t)).toBeCloseTo(expected, 2);
    expect(lib.mean(8, 5, 1, .3, .5)).toBeCloseTo(5.1, 12);
    expect(lib.dividendShare(2.2, 2.38, 2.56, 34, 11)).toBeCloseTo(18.88, 2);
    expect(lib.capitalGain(1.1, 15, 3, 4, 10)).toBeCloseTo(5.02, 2);
  });
});
