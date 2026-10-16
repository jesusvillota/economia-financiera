import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parse } from 'yaml';

// Every numeric answer must match its src/lib function at the default parameters.
const dir = 'src/content/sesiones';
for (const f of readdirSync(dir).filter((f) => /\.mdx?$/.test(f))) {
  const fm = parse(readFileSync(`${dir}/${f}`, 'utf8').split('---')[1]);
  for (const ex of fm.exercises)
    for (const a of ex.answers)
      it(`${f} ${ex.id}.${a.id}`, async () => {
        const mod = await import(`../src/lib/${a.lib.module}.ts`);
        const p = Object.fromEntries(ex.parameters.map((x: any) => [x.id, x.default]));
        const got = mod[a.lib.fn](...a.lib.args.map((n: string) => p[n]));
        const tol = a.tolerance.kind === 'abs' ? a.tolerance.value : a.tolerance.value * Math.abs(a.value);
        expect(Math.abs(got - a.value)).toBeLessThanOrEqual(tol);
      });
}
