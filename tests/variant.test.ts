import { describe, expect, it } from 'vitest';
import { fmt, interpolate, parseNumber, variant, withinTolerance } from '../src/lib/problems/variant';

const params = [
  { id: 'va', default: 1000 },
  { id: 'r', default: 0.05, min: 0, max: 0.3, step: 0.01 },
  { id: 't', default: 10, min: 1, max: 40, step: 1 },
];

describe('variant', () => {
  it('same seed gives the same numbers', () => expect(variant(params, 7)).toEqual(variant(params, 7)));
  it('different seeds give different numbers', () => expect(variant(params, 1)).not.toEqual(variant(params, 2)));
  it('keeps defaults of unranged parameters and respects range and step', () => {
    for (let s = 1; s < 200; s++) {
      const v = variant(params, s);
      expect(v.va).toBe(1000);
      expect(v.r).toBeGreaterThanOrEqual(0);
      expect(v.r).toBeLessThanOrEqual(0.3);
      expect(Math.abs(v.r * 100 - Math.round(v.r * 100))).toBeLessThan(1e-9);
      expect(Number.isInteger(v.t) && v.t >= 1 && v.t <= 40).toBe(true);
    }
  });
});

describe('answer checker', () => {
  const abs = { kind: 'abs', value: 0.01 } as const;
  const rel = { kind: 'rel', value: 0.01 } as const;
  it('accepts inside tolerance', () => {
    expect(withinTolerance(1628.9, 1628.894627, abs)).toBe(true);
    expect(withinTolerance(1640, 1628.894627, rel)).toBe(true);
  });
  it('rejects outside tolerance and non-numbers', () => {
    expect(withinTolerance(1628.92, 1628.894627, abs)).toBe(false);
    expect(withinTolerance(1700, 1628.894627, rel)).toBe(false);
    expect(withinTolerance(NaN, 1, rel)).toBe(false);
  });
  it('parses Spanish and English formats', () => {
    expect(parseNumber('1.628,89 €')).toBe(1628.89);
    expect(parseNumber('1628.89')).toBe(1628.89);
    expect(parseNumber('')).toBeNaN();
    expect(parseNumber('abc')).toBeNaN();
  });
});

describe('interpolate', () => {
  it('uses a decimal comma in text and {,} in math', () => {
    expect(interpolate('al {{r}} anual', { r: 0.05 })).toBe('al 0,05 anual');
    expect(interpolate('$(1+{{r}})^{ {{t}} }$', { r: 0.05, t: 10 })).toBe('$(1+0{,}05)^{ 10 }$');
    expect(fmt(2)).toBe('2');
  });
});
