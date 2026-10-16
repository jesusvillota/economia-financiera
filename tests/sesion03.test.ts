import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import * as lib from '../src/lib/sesion03';
import { rng, variant, withinTolerance, interpolate } from '../src/lib/problems/variant';
import { sessionSchema } from '../src/schemas/problem-session';
const fm = sessionSchema.parse(parse(readFileSync('src/content/sesiones/03-carteras-y-capm.mdx', 'utf8').split('---')[1]));
// Independent arithmetic, no finance imports. Units follow the frontmatter.
const refs: Record<string, (...x: number[]) => number> = {
  retorno: (w, a, b) => w / 100 * a + (1 - w / 100) * b,
  riesgo: (w, a, b, r) => Math.sqrt((w / 100 * a) ** 2 + ((1 - w / 100) * b) ** 2 + 2 * w / 100 * (1 - w / 100) * r * a * b),
  pesoMinimo: (a, b, r, noShort) => { const w = (b * b - r * a * b) / (a * a + b * b - 2 * r * a * b); return 100 * (noShort ? Math.max(0, Math.min(1, w)) : w); },
  retornoMinimo: (a, b, sa, sb, r, noShort) => refs.retorno(refs.pesoMinimo(sa, sb, r, noShort), a, b),
  riesgoMinimo: (a, b, r, noShort) => refs.riesgo(refs.pesoMinimo(a, b, r, noShort), a, b, r),
  covarianza: (a, b, r) => a * b * r / 10000,
  retornoTres: (a, b, c) => .4 * a + .35 * b + .25 * c,
  varianzaTres: (a, b, c) => ((.4 * a) ** 2 + (.35 * b) ** 2 + (.25 * c) ** 2 + 2 * (.4 * .35 * a * b * .45 + .4 * .25 * a * c * .3 + .35 * .25 * b * c * .55)) / 10000,
  riesgoTres: (a, b, c) => 100 * Math.sqrt(refs.varianzaTres(a, b, c)),
  retornoMixto: (rf, r, _s, w) => rf + w / 100 * (r - rf),
  riesgoMixto: (_rf, _r, s, w) => Math.abs(w) / 100 * s,
  sharpe: (rf, r, s) => (r - rf) / s,
  asignacion: (_rf, _r, s, target) => 100 * target / s,
  betaActivo: (c, v) => c / v,
  requerido: (rf, rm, b) => rf + b * (rm - rf),
  requeridoCov: (rf, rm, c, v) => rf + c / v * (rm - rf),
  brechaCov: (o, rf, rm, c, v) => o - rf - c / v * (rm - rf),
  betaCartera: (a, b, c, d, n) => n ? .3 * a + .25 * b + .25 * c + .2 * d : .25 * a + .3 * b + .2 * c + .25 * d,
  requeridoCartera: (rf, rm, a, b, c, d, n) => rf + refs.betaCartera(a, b, c, d, n) * (rm - rf),
  sharpeMinimo: (rf, a, b, sa, sb, r, n) => (refs.retornoMinimo(a, b, sa, sb, r, n) - rf) / refs.riesgoMinimo(sa, sb, r, n),
  asignacionMinima: (_rf, _a, _b, sa, sb, r, n, target) => 100 * target / refs.riesgoMinimo(sa, sb, r, n),
  efectivoMinimo: (...args) => 100 - refs.asignacionMinima(...args),
};
const call = (fn: string, args: number[]) => (lib as Record<string, (...x: number[]) => number>)[fn](...args);

describe('PS3: every exercise, canonical numbers and 20 reproducible random seeds', () => {
  it('covers all source exercises, both correlations and the approved short-sale variant', () => {
    expect(fm.number).toBe(3);
    expect(fm.source).toBe('ps3');
    expect(fm.exercises.map(e => e.id)).toEqual(['ej1', 'ej2_pos', 'ej2_neg', 'ej2_corto', 'ej3', 'ej4', 'ej5', 'ej6', 'ej7']);
    expect(fm.chapters).toEqual(['07-dos-activos', '08-markowitz', '09-activo-libre-riesgo', '10-capm']);
    expect(new Set(fm.exercises.flatMap(e => e.answers.map(a => a.lib.fn)))).toEqual(new Set(Object.keys(refs)));
  });
  for (const ex of fm.exercises) {
    const defaults = Object.fromEntries(ex.parameters.map(p => [p.id, p.default]));
    it(`${ex.id}: valid hints, ranges and solution placeholders`, () => {
      expect(ex.hints.length).toBeGreaterThanOrEqual(2);
      expect(ex.hints.length).toBeLessThanOrEqual(3);
      expect(ex.parameters.some(p => p.min !== undefined && p.max! > p.min)).toBe(true);
      for (const p of ex.parameters) if (p.min !== undefined) {
        expect(p.default).toBeGreaterThanOrEqual(p.min);
        expect(p.default).toBeLessThanOrEqual(p.max!);
      }
      const values = {...defaults, ...Object.fromEntries(ex.answers.map(a => [a.id, a.value]))};
      for (const step of ex.steps) expect(interpolate(step.body, values)).not.toMatch(/\{\{/);
    });
    for (const a of ex.answers) {
      it(`${ex.id}.${a.id}: default UI state equals library, independent calculation and frontmatter`, () => {
        expect(a.lib.module).toBe('sesion03');
        const args = a.lib.args.map(id => defaults[id]);
        const got = call(a.lib.fn, args);
        expect(got).toBeCloseTo(refs[a.lib.fn](...args), 10);
        expect(withinTolerance(got, a.value, a.tolerance)).toBe(true);
      });
      it(`${ex.id}.${a.id}: 20 random seeds`, () => {
        const random = rng(ex.seed);
        for (let s = 0; s < 20; s++) {
          const seed = Math.floor(random() * 2 ** 32);
          const params = variant(ex.parameters, seed);
          expect(params).toEqual(variant(ex.parameters, seed));
          const args = a.lib.args.map(id => params[id]);
          const got = call(a.lib.fn, args);
          expect(Number.isFinite(got)).toBe(true);
          expect(got).toBeCloseTo(refs[a.lib.fn](...args), 10);
          for (const p of ex.parameters) if (p.min !== undefined) {
            expect(params[p.id]).toBeGreaterThanOrEqual(p.min);
            expect(params[p.id]).toBeLessThanOrEqual(p.max!);
          }
        }
      });
    }
  }
  it('correlation matrices are PSD over the entire allowed parameter domain', () => {
    // All variable matrices are 2x2: determinant 1-rho² >= 0 including endpoints.
    for (const ex of fm.exercises) for (const p of ex.parameters.filter(p => p.id.startsWith('rho'))) {
      for (const r of [p.min ?? p.default, p.max ?? p.default]) expect(1 - r * r).toBeGreaterThanOrEqual(0);
    }
    // The fixed 3x3 correlation matrix has positive leading minors and determinant.
    expect(1 - .45 ** 2).toBeGreaterThan(0);
    expect(1 + 2 * .45 * .3 * .55 - .45 ** 2 - .3 ** 2 - .55 ** 2).toBeCloseTo(.5535, 12);
    // Positive volatility scaling preserves PSD, so every variant remains valid.
    for (const ex of fm.exercises) for (const p of ex.parameters.filter(p => /^s[abc]$/.test(p.id))) expect(p.min ?? p.default).toBeGreaterThan(0);
  });
  it('approved rho=.95 case binds the short-sale restriction in every variant', () => {
    const ex = fm.exercises.find(e => e.id === 'ej2_corto')!;
    for (let seed = 1; seed <= 20; seed++) {
      const p = variant(ex.parameters, seed);
      expect(lib.pesoMinimo(p.sa, p.sb, p.rho, 0)).toBeCloseTo(-37.5, 10);
      expect(lib.pesoMinimo(p.sa, p.sb, p.rho, 1)).toBe(0);
      expect(lib.riesgoMinimo(p.sa, p.sb, p.rho, 0)).toBeLessThan(lib.riesgoMinimo(p.sa, p.sb, p.rho, 1));
    }
  });
  it('asserts all corrected docs/AUDIT.md Exercise 7 values without intermediate rounding', () => {
    expect(lib.riesgo(50, 20, 16, .35)).toBeCloseTo(14.832396974191325, 12);
    expect(lib.riesgo(50, 20, 16, .35).toFixed(2)).toBe('14.83');
    expect(lib.sharpeMinimo(3, 12, 9, 20, 16, .35, 0)).toBeCloseTo(.4853626716970755, 12);
    expect(lib.sharpeMinimo(3, 12, 9, 20, 16, .35, 0).toFixed(4)).toBe('0.4854');
    const y = lib.asignacionMinima(3, 12, 9, 20, 16, .35, 0, 10);
    expect(y / 100).toBeCloseTo(.6933752452815365, 12);
    expect((y / 100).toFixed(4)).toBe('0.6934');
    expect(y.toFixed(2)).toBe('69.34');
    expect(lib.efectivoMinimo(3, 12, 9, 20, 16, .35, 0, 10).toFixed(2)).toBe('30.66');
  });
});
