import { describe, expect, it } from 'vitest';
import { compound } from '../src/lib/compound';
import { splitMath } from '../src/components/ui/Tex';
import katex from 'katex';
import { katexMacros, katexOptions } from '../src/lib/katexMacros';

describe('compound', () => {
  it('computes VF = VA (1+r)^t', () => {
    expect(compound(100, 0.05, 10)).toBeCloseTo(162.889462677744, 9);
    expect(compound(100, 0, 10)).toBe(100);
  });
});

describe('RichText / macros', () => {
  it('splits $math$ and keeps \\$ literal', () => {
    expect(splitMath('a $x$ cuesta 5 \\$')).toEqual([
      { text: 'a ', math: false },
      { text: 'x', math: true },
      { text: ' cuesta 5 $', math: false },
    ]);
  });
  it('defines the generic finance macros', () => {
    for (const m of ['VA', 'VF', 'VAN', 'TIR', 'Rate', 'E', 'Var', 'Cov']) expect(katexMacros[`\\${m}`]).toBeDefined();
  });
});

describe('katexMacros render', () => {
  // Macros with an argument get a dummy one; every macro must render with throwOnError.
  for (const [name, def] of Object.entries(katexMacros)) {
    it(`renders ${name}`, () => {
      const src = def.includes('#1') ? `${name}{x}` : name;
      expect(() => katex.renderToString(src, { ...katexOptions, throwOnError: true })).not.toThrow();
    });
  }
});
