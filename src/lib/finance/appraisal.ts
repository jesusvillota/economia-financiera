/** Valoración de inversiones. flows[t] es el flujo en t = 0, 1, 2, ... */

/** VAN a la tasa r; el flujo en t = 0 no se descuenta. */
export const npv = (r: number, flows: number[]): number =>
  flows.reduce((s, c, t) => s + c / (1 + r) ** t, 0);

const LO = -0.99;
const HI = 10;
const STEP = 0.001;

/**
 * TIR: todas las raíces de VAN(r) = 0 en [-0.99, 10], de menor a mayor.
 * Se barre una rejilla buscando cambios de signo y se bisecta cada tramo.
 * `multiple` avisa de más de una raíz (la TIR ya no es única).
 * ponytail: una raíz doble (VAN toca 0 sin cruzar) o fuera del rango no se detecta.
 */
export const irr = (flows: number[]): { roots: number[]; multiple: boolean } => {
  const roots: number[] = [];
  let a = LO;
  let fa = npv(a, flows);
  for (let i = 1; a < HI; i++) {
    const b = Math.min(LO + i * STEP, HI);
    const fb = npv(b, flows);
    if (fa === 0) roots.push(a);
    else if (fa * fb < 0) {
      let lo = a;
      let hi = b;
      for (let k = 0; k < 100; k++) {
        const mid = (lo + hi) / 2;
        if (npv(mid, flows) * fa > 0) lo = mid;
        else hi = mid;
      }
      roots.push((lo + hi) / 2);
    }
    a = b;
    fa = fb;
  }
  if (fa === 0) roots.push(a);
  return { roots, multiple: roots.length > 1 };
};

/** Payback con interpolación lineal dentro del año; null si nunca se recupera. */
export const payback = (flows: number[]): number | null => {
  let cum = flows[0];
  if (cum >= 0) return 0;
  for (let t = 1; t < flows.length; t++) {
    if (cum + flows[t] >= 0) return t - 1 + -cum / flows[t];
    cum += flows[t];
  }
  return null;
};

/** Payback descontado a la tasa r. */
export const discountedPayback = (r: number, flows: number[]): number | null =>
  payback(flows.map((c, t) => c / (1 + r) ** t));

/** Índice de rentabilidad: VA de los flujos futuros / desembolso inicial (flows[0] < 0). */
export const profitabilityIndex = (r: number, flows: number[]): number =>
  (npv(r, flows) - flows[0]) / -flows[0];
