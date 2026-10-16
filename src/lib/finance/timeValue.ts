/** Valor del dinero en el tiempo. Tasas en tanto por uno; t en años (o periodos). */

/** Capitalización simple: VF = VA (1 + r t). */
export const simpleFV = (va: number, r: number, t: number): number => va * (1 + r * t);

/** Capitalización compuesta: VF = VA (1 + r)^t. */
export const fv = (va: number, r: number, t: number): number => va * (1 + r) ** t;

/** Valor actual: VA = VF / (1 + r)^t. */
export const pv = (vf: number, r: number, t: number): number => vf / (1 + r) ** t;

/** Tasa efectiva anual a partir de una nominal j con k capitalizaciones al año. */
export const effectiveFromNominal = (j: number, k: number): number => (1 + j / k) ** k - 1;

/** TAE: alias de la tasa efectiva anual. */
export const tae = effectiveFromNominal;

/** Nominal anual j (con k capitalizaciones) equivalente a una efectiva anual i. */
export const nominalFromEffective = (i: number, k: number): number => k * ((1 + i) ** (1 / k) - 1);

/** Tasa equivalente por periodo 1/k de año (compuesta): (1 + i)^(1/k) - 1. */
export const equivalentRate = (i: number, k: number): number => (1 + i) ** (1 / k) - 1;

/** Tasa proporcional (simple) por periodo 1/k de año: j / k. */
export const proportionalRate = (j: number, k: number): number => j / k;

/** VA de una renta constante pospagable de n pagos a (r = 0 cae al límite n a). */
export const annuityPV = (a: number, r: number, n: number): number =>
  r === 0 ? a * n : (a * (1 - (1 + r) ** -n)) / r;

/** VF (en n) de una renta constante pospagable. */
export const annuityFV = (a: number, r: number, n: number): number =>
  r === 0 ? a * n : (a * ((1 + r) ** n - 1)) / r;

/** VA de una renta prepagable (pagos al inicio de cada periodo). */
export const annuityDuePV = (a: number, r: number, n: number): number => annuityPV(a, r, n) * (1 + r);

/** VF de una renta prepagable. */
export const annuityDueFV = (a: number, r: number, n: number): number => annuityFV(a, r, n) * (1 + r);

/** VA de una renta pospagable cuyo primer pago a crece a tasa g (r = g cae al límite n a / (1 + r)). */
export const growingAnnuityPV = (a: number, r: number, g: number, n: number): number =>
  r === g ? (a * n) / (1 + r) : (a * (1 - ((1 + g) / (1 + r)) ** n)) / (r - g);

/** VA de una perpetuidad pospagable: A / r (requiere r > 0). */
export const perpetuityPV = (a: number, r: number): number => {
  if (r <= 0) throw new RangeError('perpetuityPV requiere r > 0');
  return a / r;
};

/** VA de una perpetuidad creciente cuyo primer pago es a: A / (r - g) (requiere r > g). */
export const growingPerpetuityPV = (a: number, r: number, g: number): number => {
  if (r <= g) throw new RangeError('growingPerpetuityPV requiere r > g');
  return a / (r - g);
};
