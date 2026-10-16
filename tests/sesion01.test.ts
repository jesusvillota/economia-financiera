import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { variant, withinTolerance } from '../src/lib/problems/variant';
import * as lib from '../src/lib/sesion01';
import { annuityPV, growingAnnuityPV, annuityDuePV, equivalentRate } from '../src/lib/finance/timeValue';

const fm = parse(readFileSync('src/content/sesiones/01-interes-y-rentas.mdx', 'utf8').split('---')[1]);
type P = Record<string, number>;
const r = (x: number) => x / 100;
const ann = (a: number, i: number, n: number) => (a * (1 - (1 + i) ** -n)) / i;
const gann = (a: number, i: number, g: number, n: number) => (a * (1 - ((1 + g) / (1 + i)) ** n)) / (i - g);
const van = (i: number, f: number[]) => f.reduce((s, c, t) => s + c / (1 + i) ** t, 0);
const pm = (f: number[]) => { let c = f[0]; for (let t = 1; t < f.length; t++) { if (c + f[t] >= 0) return t - 1 - c / f[t]; c += f[t]; } return NaN; };
const quad = (c0: number, c: number) => ((c + Math.sqrt(c * c + 4 * c0 * c)) / (2 * c0) - 1) * 100;
const im = (i: number) => (1 + r(i)) ** (1 / 12) - 1;

// Independent closed forms (plain arithmetic, not src/lib/finance) for every answer.
const ref: Record<string, (p: P) => number> = {
  'ej1.res_a': (p) => p.c0 * (1 + r(p.i) * p.t),
  'ej1.res_b': (p) => p.i / p.k,
  'ej1.res_c': (p) => (p.c0 * r(p.i)) / p.k,
  'ej1.res_d': (p) => p.vf / (1 + r(p.ip) * p.tp),
  'ej2.res_a': (p) => p.c0 * (1 + r(p.i)) ** p.t,
  'ej2.res_b': (p) => ((1 + r(p.i)) ** (1 / p.k) - 1) * 100,
  'ej2.res_c': (p) => { const m = (1 + r(p.i)) ** (1 / p.k) - 1; return p.c0 * m * (1 + m); },
  'ej2.res_d': (p) => p.vf / (1 + r(p.j)) ** p.tp,
  'ej3.res_a': (p) => p.c0 * (1 + 2 * r(p.is)) * (1 + r(p.ic)) ** 2,
  'ej3.res_b': (p) => (((1 + 2 * r(p.is)) * (1 + r(p.ic)) ** 2) ** (1 / 3) - 1) * 100,
  'ej3.res_c': (p) => p.c0 * (1 + 12 * r(p.iq)),
  'ej3.res_d': (p) => p.c0 * (1 + r(p.ib)) ** 9,
  'ej4.res_a': (p) => ann(p.a, r(p.r), p.n),
  'ej4.res_b': (p) => gann(p.a, r(p.r), r(p.g), p.n),
  'ej4.res_c': (p) => { // brute-force sum of discounted payments
    let s = 0;
    for (let t = 1; t <= p.n; t++) s += (t <= p.m ? p.a : p.a * (1 + r(p.g)) ** (t - p.m - 1)) / (1 + r(p.r)) ** t;
    return s;
  },
  'ej5.res_a': (p) => p.a / r(p.r),
  'ej5.res_b': (p) => p.a / (r(p.r) - r(p.g)),
  'ej5.res_c': (p) => (p.a * (1 + r(p.g)) ** p.k) / ((r(p.r) - r(p.g)) * (1 + r(p.r)) ** p.k),
  'ej6.res_a': (p) => ann(p.cuota, im(p.i), 12 * p.anios),
  'ej6.res_b': (p) => gann(p.a, r(p.i), r(p.g), p.anios),
  'ej6.res_c': (p) => ann(p.cuota, im(p.i), 12 * p.anios) + gann(p.a, r(p.i), r(p.g), p.anios),
  'ej6.res_d': (p) => ann(p.cuota, im(p.i), 12 * p.anios) * (1 + im(p.i)),
  'ej7.res_a': (p) => van(r(p.r), [-p.i0, p.c1, p.c2, p.c3, p.c4]),
  'ej8.res_a': (p) => pm([-p.i0, p.c1, p.c2, p.c3, p.c4]),
  'ej8.res_b': (p) => pm([-p.i0, p.c1, p.c2, p.c3, p.c4].map((c, t) => c / (1 + r(p.r)) ** t)),
  'ej9.res_a': (p) => quad(p.c0, p.c),
  'ej9.res_b': (p) => van(r(p.r), [-p.c0, p.c, p.c]),
  'ej10.res_a': (p) => van(r(p.r), [-p.a0, p.a1]),
  'ej10.res_b': (p) => van(r(p.r), [-p.a0, p.b1, p.b2]),
  'ej10.res_c': (p) => van(r(p.r), [-p.a0, p.b1, p.b2]) - van(r(p.r), [-p.a0, p.a1]),
  'ej10.res_d': (p) => pm([-p.a0, p.b1, p.b2]),
  'ej10.res_e': (p) => pm([-p.a0, p.b1, p.b2].map((c, t) => c / (1 + r(p.r)) ** t)),
  'ej10.res_f': (p) => (p.a1 / p.a0 - 1) * 100,
  'ej10.res_g': (p) => ((p.b1 + Math.sqrt(p.b1 ** 2 + 4 * p.a0 * p.b2)) / (2 * p.a0) - 1) * 100,
};

const call = (a: any, p: P) => (lib as any)[a.lib.fn](...a.lib.args.map((n: string) => p[n]));

describe('sesión 1', () => {
  it('has 10 exercises and a reference for every answer', () => {
    expect(fm.exercises).toHaveLength(10);
    const keys = fm.exercises.flatMap((e: any) => e.answers.map((a: any) => `${e.id}.${a.id}`));
    expect(keys.sort()).toEqual(Object.keys(ref).sort());
  });

  it('sources of the audited values: ps1 corrected numbers (docs/AUDIT.md)', () => {
    expect(annuityPV(5000, 0.09, 8)).toBeCloseTo(27674, -0.1);
    expect(growingAnnuityPV(5000, 0.09, 0.03, 8)).toBeCloseTo(30354, -0.1);
    expect(lib.s4Mixta(5000, 9, 3, 8, 3)).toBeCloseTo(28522, -0.1);
    expect(lib.s5Diferida(2500, 8, 2, 5)).toBeCloseTo(31309, -0.1);
    expect(annuityPV(600, equivalentRate(0.09, 12), 120)).toBeCloseTo(48083, -0.1);
    expect(lib.s6Total(600, 2000, 9, 4, 10)).toBeCloseTo(63073, -0.1);
    expect(annuityDuePV(600, equivalentRate(0.09, 12), 120)).toBeCloseTo(48430, -0.1);
    expect(lib.s7Van(120000, 40000, 45000, 50000, 55000, 10)).toBeCloseTo(28685, -0.1);
    expect(lib.s8PaybackDescontado(120000, 40000, 45000, 50000, 55000, 10)).toBeCloseTo(3.24, 2);
    expect(lib.s9Tir(100, 60)).toBeCloseTo(13.07, 2);
  });

  for (const ex of fm.exercises) {
    const defaults = Object.fromEntries(ex.parameters.map((x: any) => [x.id, x.default]));
    for (const a of ex.answers) {
      const key = `${ex.id}.${a.id}`;
      it(`${key}: default-seed answer equals the library and the frontmatter value`, () => {
        const got = call(a, defaults);
        expect(withinTolerance(got, a.value, a.tolerance)).toBe(true);
        expect(withinTolerance(ref[key](defaults), got, a.tolerance)).toBe(true);
      });
      it(`${key}: 20 random seeds are self-consistent`, () => {
        for (let s = 1; s <= 20; s++) {
          const p = variant(ex.parameters, ex.seed + s);
          const got = call(a, p);
          expect(Number.isFinite(got)).toBe(true);
          expect(withinTolerance(ref[key](p), got, a.tolerance)).toBe(true);
        }
      });
    }
  }
});
