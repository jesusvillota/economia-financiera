/** Auxiliares de las figuras compartidas (línea temporal de flujos y curvas de crecimiento). */
import { fv, pv, effectiveFromNominal, simpleFV } from './timeValue.ts';

/** Un flujo de caja: `amount` > 0 entra, < 0 sale, en el instante `t` (años). */
export interface Flow {
  t: number;
  amount: number;
}

/** VA (en t = 0) de una lista de flujos a la tasa r. */
export const flowsPV = (r: number, flows: Flow[]): number => flows.reduce((s, f) => s + pv(f.amount, r, f.t), 0);

/** VF en el instante `horizon` de una lista de flujos a la tasa r. */
export const flowsFV = (r: number, flows: Flow[], horizon: number): number =>
  flows.reduce((s, f) => s + fv(f.amount, r, horizon - f.t), 0);

/** Capital final con interés simple a nominal r durante t años. */
export const simpleGrowth = simpleFV;

/** Capital final con interés compuesto: nominal r, k capitalizaciones al año, t años. */
export const compoundGrowth = (va: number, r: number, k: number, t: number): number =>
  fv(va, effectiveFromNominal(r, k), t);

/** Años exactos para duplicar con interés compuesto (nominal r, k al año). null si r <= 0. */
export const doublingTime = (r: number, k: number): number | null =>
  r > 0 ? Math.LN2 / (k * Math.log(1 + r / k)) : null;

/** Regla del 72: años aproximados para duplicar. null si r <= 0. */
export const rule72 = (r: number): number | null => (r > 0 ? 0.72 / r : null);
