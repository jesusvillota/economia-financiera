/**
 * Respuestas de la sesión 1 (src/content/sesiones/01-interes-y-rentas.mdx).
 * Los tipos entran en % (6 = 6 %) porque así se muestran; los cálculos viven en src/lib/finance.
 */
import { simpleFV, fv, pv, equivalentRate, annuityPV, growingAnnuityPV, perpetuityPV, growingPerpetuityPV, annuityDuePV } from './finance/timeValue';
import { npv, irr, payback, discountedPayback } from './finance/appraisal';

const p = (x: number) => x / 100;

// Ej 1: interés simple
export const s1Final = (c0: number, i: number, t: number) => simpleFV(c0, p(i), t);
export const s1Periodo = (i: number, k: number) => i / k;
export const s1Interes = (c0: number, i: number, k: number) => (c0 * p(i)) / k;
export const s1ValorActual = (vf: number, i: number, t: number) => vf / (1 + p(i) * t);

// Ej 2: interés compuesto
export const s2Montante = (c0: number, i: number, t: number) => fv(c0, p(i), t);
export const s2Periodo = (i: number, k: number) => equivalentRate(p(i), k) * 100;
export const s2InteresMes2 = (c0: number, i: number, k: number) => {
  const m = equivalentRate(p(i), k);
  return c0 * (1 + m) * m;
};
export const s2ValorActual = (vf: number, i: number, t: number) => pv(vf, p(i), t);

// Ej 3: tramo simple (año 1, tipo semestral) + tramo compuesto (años 2 y 3)
export const s3Mixto = (c0: number, is: number, ic: number) => c0 * (1 + 2 * p(is)) * (1 + p(ic)) ** 2;
export const s3TipoEquivalente = (c0: number, is: number, ic: number) => ((s3Mixto(c0, is, ic) / c0) ** (1 / 3) - 1) * 100;
export const s3AltA = (c0: number, iq: number) => simpleFV(c0, p(iq), 12);
export const s3AltB = (c0: number, ib: number) => fv(c0, p(ib), 9);

// Ej 4: rentas finitas; el tramo 2 crece desde el año m+1 con primer pago A
export const s4Constante = (a: number, r: number, n: number) => annuityPV(a, p(r), n);
export const s4Creciente = (a: number, r: number, g: number, n: number) => growingAnnuityPV(a, p(r), p(g), n);
export const s4Mixta = (a: number, r: number, g: number, n: number, m: number) =>
  annuityPV(a, p(r), m) + growingAnnuityPV(a, p(r), p(g), n - m) / (1 + p(r)) ** m;

// Ej 5: perpetuidades; el primer pago de la diferida es A(1+g)^k en t = k+1
export const s5Constante = (a: number, r: number) => perpetuityPV(a, p(r));
export const s5Creciente = (a: number, r: number, g: number) => growingPerpetuityPV(a, p(r), p(g));
export const s5Diferida = (a: number, r: number, g: number, k: number) =>
  growingPerpetuityPV(a * (1 + p(g)) ** k, p(r), p(g)) / (1 + p(r)) ** k;

// Ej 6: renta mensual + renta anual creciente, tipo efectivo anual
export const s6Mensual = (cuota: number, i: number, anios: number) => annuityPV(cuota, equivalentRate(p(i), 12), 12 * anios);
export const s6Creciente = (a: number, i: number, g: number, anios: number) => growingAnnuityPV(a, p(i), p(g), anios);
export const s6Total = (cuota: number, a: number, i: number, g: number, anios: number) => s6Mensual(cuota, i, anios) + s6Creciente(a, i, g, anios);
export const s6Prepagable = (cuota: number, i: number, anios: number) => annuityDuePV(cuota, equivalentRate(p(i), 12), 12 * anios);

// Ej 7 y 8: proyecto de 4 años
export const s7Van = (i0: number, c1: number, c2: number, c3: number, c4: number, r: number) => npv(p(r), [-i0, c1, c2, c3, c4]);
export const s8Payback = (i0: number, c1: number, c2: number, c3: number, c4: number) => payback([-i0, c1, c2, c3, c4]) ?? NaN;
export const s8PaybackDescontado = (i0: number, c1: number, c2: number, c3: number, c4: number, r: number) =>
  discountedPayback(p(r), [-i0, c1, c2, c3, c4]) ?? NaN;

// Ej 9: proyecto de dos años (TIR por la fórmula cuadrática)
export const s9Tir = (c0: number, c: number) => irr([-c0, c, c]).roots[0] * 100;
export const s9Van = (c0: number, c: number, r: number) => npv(p(r), [-c0, c, c]);

// Ej 10: A = (-a0, a1), B = (-a0, b1, b2)
export const s10VanA = (a0: number, a1: number, r: number) => npv(p(r), [-a0, a1]);
export const s10VanB = (a0: number, b1: number, b2: number, r: number) => npv(p(r), [-a0, b1, b2]);
export const s10Diferencia = (a0: number, a1: number, b1: number, b2: number, r: number) => s10VanB(a0, b1, b2, r) - s10VanA(a0, a1, r);
export const s10PaybackB = (a0: number, b1: number, b2: number) => payback([-a0, b1, b2]) ?? NaN;
export const s10PaybackDescontadoB = (a0: number, b1: number, b2: number, r: number) => discountedPayback(p(r), [-a0, b1, b2]) ?? NaN;
export const s10TirA = (a0: number, a1: number) => irr([-a0, a1]).roots[0] * 100;
export const s10TirB = (a0: number, b1: number, b2: number) => irr([-a0, b1, b2]).roots[0] * 100;
