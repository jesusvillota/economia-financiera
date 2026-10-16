/** Auxiliares de la figura "constructor de rentas": pagos, VA por cierre y VA sumando flujos. */
import { annuityPV, growingAnnuityPV, growingPerpetuityPV } from './timeValue.ts';
import { flowsPV, type Flow } from './curves.ts';

/** Pagos de una renta de n términos: primer pago a, crece a tasa g; pospagable (t = 1..n) o prepagable (t = 0..n-1). */
export const annuityFlows = (a: number, g: number, n: number, due: boolean): Flow[] =>
  Array.from({ length: n }, (_, i) => ({ t: due ? i : i + 1, amount: a * (1 + g) ** i }));

/** VA por fórmula cerrada (la prepagable multiplica por 1 + r). */
export const annuityClosedPV = (a: number, r: number, g: number, n: number, due: boolean): number => {
  const v = g === 0 ? annuityPV(a, r, n) : growingAnnuityPV(a, r, g, n);
  return due ? v * (1 + r) : v;
};

/** VA de la renta perpetua equivalente (pospagable A/(r-g); prepagable por 1 + r). null si r <= g. */
export const perpetuityClosedPV = (a: number, r: number, g: number, due: boolean): number | null =>
  r > g && r > 0 ? growingPerpetuityPV(a, r, g) * (due ? 1 + r : 1) : null;

/** VA sumando los pagos descontados uno a uno (debe coincidir con la fórmula cerrada). */
export const annuitySumPV = (a: number, r: number, g: number, n: number, due: boolean): number =>
  flowsPV(r, annuityFlows(a, g, n, due));

