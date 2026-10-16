/** Exam wrappers: rates, volatilities and weights in percent; times in years.
 * Rentas gamma is effective per discount period; bond yield is nominal annual.
 */
import { annuityPV, equivalentRate, growingPerpetuityPV, pv } from './finance/timeValue';
import { npv, irr } from './finance/appraisal';
import { gordonPrice, wacc } from './finance/valuation';
import { twoAssetReturn, twoAssetVariance } from './finance/portfolio';
import { securityMarketLine } from './finance/capm';
import { bondPrice, macaulayDuration, modifiedDuration } from './finance/bonds';

export const rentaConstante = (a: number, r: number, n: number) => annuityPV(a, r / 100, n);
export const capm = (rf: number, rm: number, beta: number) => 100 * securityMarketLine(rf / 100, rm / 100, beta);
export const van = (coste: number, a: number, n: number, r: number) => npv(r / 100, [-coste, ...Array<number>(n).fill(a)]);
export const tir = (coste: number, a: number, n: number) => 100 * irr([-coste, ...Array<number>(n).fill(a)]).roots[0];
export const dividendo = (d1: number, r: number, g: number) => gordonPrice(d1, r / 100, g / 100);
export const media = (w: number, a: number, b: number) => 100 * twoAssetReturn(w / 100, a / 100, b / 100);
export const riesgo = (w: number, sa: number, sb: number, rho: number) => 100 * Math.sqrt(twoAssetVariance(w / 100, sa / 100, sb / 100, rho));
export const costeCapital = (e: number, d: number, ke: number, kd: number, tax: number) => 100 * wacc(e, d, ke / 100, kd / 100, tax / 100);
export const empresa = (e: number, d: number, ke: number, kd: number, tax: number, flujo: number, g: number) => growingPerpetuityPV(flujo, costeCapital(e, d, ke, kd, tax) / 100, g / 100);
const bond = (face: number, coupon: number, years: number, m: number) => ({ face, couponRate: coupon / 100, maturity: years, frequency: m });
export const precioBono = (f: number, c: number, t: number, m: number, y: number) => bondPrice(bond(f, c, t, m), y / 100);
export const duracion = (f: number, c: number, t: number, m: number, y: number) => macaulayDuration(bond(f, c, t, m), y / 100);
export const modificada = (f: number, c: number, t: number, m: number, y: number) => modifiedDuration(bond(f, c, t, m), y / 100);

/** A at T, then every 1/m years; annual growth beta, effective gamma k times/year. */
export const opcionA = (a: number, beta: number, gamma: number, m: number, k: number, _t: number) =>
  growingPerpetuityPV(a, equivalentRate((1 + gamma / 100) ** k - 1, m), equivalentRate(beta / 100, m));
export const rentaDiferida = (a: number, beta: number, gamma: number, m: number, k: number, t: number) =>
  pv(opcionA(a, beta, gamma, m, k, t), gamma / 100, k * (t - 1 / m));
export const opcionB = rentaDiferida;
/** Distractor: treats the quoted effective rate as if there were k-1 periods/year. */
export const opcionC = (a: number, beta: number, gamma: number, m: number, k: number, t: number) =>
  rentaDiferida(a, beta, gamma, m, k - 1, t);
/** Encode a/b/c as 1/2/3 for the shared numeric checker. */
export const opcionRentas = (...args: [number, number, number, number, number, number]) => {
  const target = rentaDiferida(...args);
  const distances = [opcionA, opcionB, opcionC].map(fn => Math.abs(fn(...args) - target));
  return distances.indexOf(Math.min(...distances)) + 1;
};
