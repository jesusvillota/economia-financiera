import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import * as lib from '../src/lib/examen';
import { sessionSchema } from '../src/schemas/problem-session';
import { interpolate, rng, variant, withinTolerance } from '../src/lib/problems/variant';

const fm = sessionSchema.parse(parse(readFileSync('src/content/sesiones/examen-final.mdx', 'utf8').split('---')[1]));
const call = (fn: string, args: number[]) => (lib as Record<string, (...x: number[]) => number>)[fn](...args);

// Independent discounted cash flows: no closed perpetuity formula or copied option.
// Logarithms avoid overflow when an individual distant payment is very large.
const sumRentas = (a: number, beta: number, gamma: number, m: number, k: number, t: number) => {
  let total = 0;
  for (let j = 0; j < 20_000; j++) {
    total += Math.exp(Math.log(a) + j / m * Math.log1p(beta / 100) - k * (t + j / m) * Math.log1p(gamma / 100));
  }
  return total;
};
const options = (a: number, beta: number, gamma: number, m: number, k: number, t: number) => [
  a / ((1 + gamma / 100) ** (k / m) - (1 + beta / 100) ** (1 / m)),
  a / (((1 + gamma / 100) ** (k / m) - (1 + beta / 100) ** (1 / m)) * (1 + gamma / 100) ** (k * (t - 1 / m))),
  a / (((1 + gamma / 100) ** ((k - 1) / m) - (1 + beta / 100) ** (1 / m)) * (1 + gamma / 100) ** ((k - 1) * (t - 1 / m))),
];
const chooseBySum = (...args: [number, number, number, number, number, number]) => {
  const total = sumRentas(...args);
  const matching = options(...args).map((value, index) => ({ value, index })).filter(o => Math.abs(o.value / total - 1) < 1e-9);
  expect(matching).toHaveLength(1);
  return matching[0].index + 1;
};
const paymentsPV = (a: number, r: number, n: number) => Array.from({ length: n }, (_, t) => a / (1 + r / 100) ** (t + 1)).reduce((s, x) => s + x, 0);
const bondFlows = (f: number, c: number, t: number, m: number, y: number) => Array.from({ length: t * m }, (_, j) => ({
  t: (j + 1) / m, pv: (f * c / 100 / m + (j + 1 === t * m ? f : 0)) / (1 + y / 100 / m) ** (j + 1),
}));
const refs: Record<string, (...x: number[]) => number> = {
  rentaConstante: paymentsPV,
  capm: (rf, rm, beta) => rf + beta * (rm - rf),
  van: (coste, a, n, r) => -coste + paymentsPV(a, r, n),
  tir: (coste, a, n) => {
    let lo = 0, hi = 100;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (paymentsPV(a, mid, n) > coste) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  },
  dividendo: (d1, r, g) => d1 / ((r - g) / 100),
  media: (w, a, b) => w / 100 * a + (1 - w / 100) * b,
  riesgo: (w, sa, sb, rho) => Math.sqrt((w / 100 * sa) ** 2 + ((1 - w / 100) * sb) ** 2 + 2 * w / 100 * (1 - w / 100) * sa * sb * rho),
  costeCapital: (e, d, ke, kd, tax) => (e * ke + d * kd * (1 - tax / 100)) / (e + d),
  empresa: (e, d, ke, kd, tax, flujo, g) => flujo * 100 / (refs.costeCapital(e, d, ke, kd, tax) - g),
  precioBono: (...args) => bondFlows(...args as [number, number, number, number, number]).reduce((s, f) => s + f.pv, 0),
  duracion: (...args) => bondFlows(...args as [number, number, number, number, number]).reduce((s, f) => s + f.t * f.pv, 0) / refs.precioBono(...args),
  modificada: (...args) => refs.duracion(...args) / (1 + args[4] / 100 / args[3]),
  rentaDiferida: sumRentas,
  opcionRentas: (...args) => chooseBySum(...args as [number, number, number, number, number, number]),
};

describe('final exam: every answer, canonical parameters and 20 random seeds', () => {
  it('has seven original mixed problems plus rentas, ordered with at least two per difficulty', () => {
    expect(fm.source).toBe('examen');
    expect(fm.exercises).toHaveLength(8);
    expect(fm.exercises.map(e => e.difficulty)).toEqual([1, 1, 2, 2, 2, 3, 3, 3]);
    for (const level of [1, 2, 3]) expect(fm.exercises.filter(e => e.difficulty === level).length).toBeGreaterThanOrEqual(2);
    expect(new Set(fm.exercises.flatMap(e => e.answers.map(a => a.lib.fn)))).toEqual(new Set(Object.keys(refs)));
    expect(new Set(fm.exercises.flatMap(e => e.concepts))).toEqual(new Set(fm.chapters));
  });
  for (const ex of fm.exercises) {
    const defaults = Object.fromEntries(ex.parameters.map(p => [p.id, p.default]));
    it(`${ex.id}: hints and solutions have no unresolved placeholders`, () => {
      expect(ex.hints).toHaveLength(3);
      for (const text of [ex.statement, ...ex.hints]) expect(interpolate(text, defaults)).not.toMatch(/\{\{/);
      const values = { ...defaults, ...Object.fromEntries(ex.answers.map(a => [a.id, call(a.lib.fn, a.lib.args.map(id => defaults[id]))])) };
      for (const step of ex.steps) expect(interpolate(step.body, values)).not.toMatch(/\{\{/);
      for (const id of ex.concepts) expect(fm.chapters).toContain(id);
    });
    for (const answer of ex.answers) {
      it(`${ex.id}.${answer.id}: default equals library, frontmatter and independent calculation`, () => {
        expect(answer.lib.module).toBe('examen');
        const args = answer.lib.args.map(id => defaults[id]);
        const got = call(answer.lib.fn, args);
        expect(got).toBeCloseTo(refs[answer.lib.fn](...args), 6);
        expect(withinTolerance(got, answer.value, answer.tolerance)).toBe(true);
      });
      it(`${ex.id}.${answer.id}: 20 reproducible random seeds`, () => {
        const random = rng(ex.seed);
        for (let i = 0; i < 20; i++) {
          const seed = Math.floor(random() * 2 ** 32);
          const values = variant(ex.parameters, seed);
          expect(values).toEqual(variant(ex.parameters, seed));
          for (const p of ex.parameters) {
            expect(values[p.id]).toBeGreaterThanOrEqual(p.min!);
            expect(values[p.id]).toBeLessThanOrEqual(p.max!);
          }
          const args = answer.lib.args.map(id => values[id]);
          const got = call(answer.lib.fn, args);
          expect(Number.isFinite(got)).toBe(true);
          expect(got).toBeCloseTo(refs[answer.lib.fn](...args), 6);
        }
      });
    }
  }
  it('decides all source options a/b/c by 20,000 payments, then varies both periodicities', () => {
    const ex = fm.exercises.find(e => e.id === 'rentas')!;
    const cases = [Object.fromEntries(ex.parameters.map(p => [p.id, p.default])), ...Array.from({ length: 20 }, (_, i) => variant(ex.parameters, i + 1))];
    expect(new Set(cases.map(p => p.m)).size).toBeGreaterThan(1);
    expect(new Set(cases.map(p => p.k)).size).toBeGreaterThan(1);
    // Also test every periodicity pair at the slowest convergence corner.
    for (let m = 1; m <= 4; m++) for (let k = 3; k <= 6; k++) cases.push({ a: 1500, beta: 2.5, gamma: 3, m, k, t: 2 });
    for (const p of cases) {
      expect((1 + p.gamma / 100) ** ((p.k - 1) / p.m)).toBeGreaterThan((1 + p.beta / 100) ** (1 / p.m));
      const args: [number, number, number, number, number, number] = [p.a, p.beta, p.gamma, p.m, p.k, p.t];
      const candidates = options(...args);
      [lib.opcionA, lib.opcionB, lib.opcionC].forEach((fn, i) => expect(fn(...args)).toBeCloseTo(candidates[i], 6));
      const selected = chooseBySum(...args);
      expect(lib.opcionRentas(...args)).toBe(selected);
      expect(lib.rentaDiferida(...args)).toBeCloseTo(sumRentas(...args), 6);
    }
  });
});
