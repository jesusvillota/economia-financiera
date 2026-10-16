export interface Param { id: string; default: number; min?: number; max?: number; step?: number }
export interface Tolerance { kind: 'abs' | 'rel'; value: number }

/** mulberry32: small seeded RNG, same seed gives the same sequence. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;

/** Parameter values for a seed: ranged parameters get a random multiple of `step` in [min, max]; others keep their default. */
export function variant(params: Param[], seed: number): Record<string, number> {
  const rand = rng(seed);
  const out: Record<string, number> = {};
  for (const p of params) {
    const r = rand(); // always draw, so one parameter's range does not shift the others
    if (p.min === undefined || p.max === undefined) { out[p.id] = p.default; continue; }
    const step = p.step ?? 1;
    const n = Math.floor(r * (Math.floor((p.max - p.min) / step + 1e-9) + 1));
    out[p.id] = Number((p.min + n * step).toFixed(Math.max(decimals(step), decimals(p.min))));
  }
  return out;
}

/** Parse user input; accepts "1.234,56", "1234.56", "1 234,5" and a trailing €/%. */
export function parseNumber(input: string): number {
  let s = input.trim().replace(/[€$%\s]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}

export function withinTolerance(got: number, expected: number, tol: Tolerance): boolean {
  const allowed = tol.kind === 'abs' ? tol.value : tol.value * Math.abs(expected);
  return Number.isFinite(got) && Math.abs(got - expected) <= allowed;
}

/** Spanish decimal comma; inside TeX use `{,}` so no space follows it. */
export const fmt = (x: number, tex = false) => {
  const s = String(Number(x.toFixed(6))).replace('.', ',');
  return tex ? s.replace(',', '{,}') : s;
};

/** Replace `{{id}}` with the parameter value (TeX-safe inside `$...$`). */
export function interpolate(text: string, values: Record<string, number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, id: string, offset: number) => {
    if (!(id in values)) return _m;
    const dollars = (text.slice(0, offset).match(/(?<!\\)\$/g) ?? []).length;
    return fmt(values[id], dollars % 2 === 1);
  });
}
