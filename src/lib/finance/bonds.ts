/**
 * Renta fija. Importes en euros, tiempos en años y tasas en tanto por uno.
 * Cupón y YTM: nominales anuales, con `frequency` capitalizaciones por año (1 por defecto).
 * Spots y forwards: efectivos anuales. No se modelan impago ni amortización anticipada.
 */
import type { Flow } from './curves';

export interface Bond {
  face: number;
  couponRate: number;
  maturity: number;
  frequency?: number;
}

/** Nodo spot efectivo anual; la curva debe incluir cada fecha de pago, sin interpolación implícita. */
export interface SpotRate {
  t: number;
  rate: number;
}

export interface QuotedBond extends Bond {
  /** Precio sucio en la fecha inicial de un periodo de cupón. */
  price: number;
}

const positive = (x: number) => {
  if (!Number.isFinite(x) || x <= 0) throw new RangeError('Se requiere un valor finito positivo');
};
const nonnegative = (x: number) => {
  if (!Number.isFinite(x) || x < 0) throw new RangeError('Se requiere un valor finito no negativo');
};
const validRate = (rate: number) => {
  if (!Number.isFinite(rate) || rate <= -1) throw new RangeError('La tasa debe ser finita y mayor que −100 %');
};
const validFrequency = (frequency: number) => {
  if (!Number.isSafeInteger(frequency) || frequency < 1) throw new RangeError('Frecuencia entera positiva requerida');
};
const validFlows = (flows: readonly Flow[]) => {
  if (!flows.length) throw new RangeError('Se requiere al menos un flujo');
  flows.forEach(({ t, amount }) => { positive(t); nonnegative(amount); });
  if (!flows.some(({ amount }) => amount > 0)) throw new RangeError('Se requiere un cobro positivo');
};
const sameTime = (a: number, b: number) => Math.abs(a - b) <= 1e-10;

/** Pagos regulares desde un inicio de periodo; maturity × frequency debe ser entero. */
export const bondCashFlows = ({ face, couponRate, maturity, frequency = 1 }: Bond): Flow[] => {
  positive(face);
  positive(maturity);
  nonnegative(couponRate);
  validFrequency(frequency);
  const n = Math.round(maturity * frequency);
  if (n < 1 || !Number.isSafeInteger(n) || !sameTime(n, maturity * frequency)) {
    throw new RangeError('El vencimiento debe contener un número entero de periodos');
  }
  return Array.from({ length: n }, (_, i) => ({
    t: (i + 1) / frequency,
    amount: face * couponRate / frequency + (i === n - 1 ? face : 0),
  }));
};

const discounted = (flow: Flow, yieldRate: number, frequency: number) =>
  flow.amount === 0 ? 0 : flow.amount * Math.exp(-frequency * flow.t * Math.log1p(yieldRate / frequency));

/** Precio sucio Σ C_t (1 + y/m)^(−mt); admite fechas irregulares explícitas. */
export const priceFromCashFlows = (flows: readonly Flow[], yieldRate: number, frequency = 1): number => {
  validFlows(flows);
  validRate(yieldRate);
  validFrequency(frequency);
  return flows.reduce((sum, flow) => sum + discounted(flow, yieldRate, frequency), 0);
};

/** Precio de un bono regular a partir de su YTM nominal anual. */
export const bondPrice = (bond: Bond, yieldRate: number): number =>
  priceFromCashFlows(bondCashFlows(bond), yieldRate, bond.frequency);

/**
 * YTM de cobros no negativos: raíz única por bisección con cota superior expansible.
 * Precio sucio positivo; fechas irregulares permitidas. Dominio y > −1 para toda frecuencia.
 * Lanza si la raíz queda fuera de ese dominio o de la precisión numérica disponible.
 */
export const yieldFromCashFlows = (flows: readonly Flow[], price: number, frequency = 1): number => {
  validFlows(flows);
  positive(price);
  validFrequency(frequency);
  const value = (y: number) => flows.reduce((sum, flow) => sum + discounted(flow, y, frequency), 0);
  let lo = -1 + Number.EPSILON / 2; // Menor número representable mayor que −1.
  let hi = 1;
  const lowerValue = value(lo);
  if (Math.abs(lowerValue / price - 1) <= 1e-12) return lo;
  if (lowerValue < price) throw new RangeError('La YTM queda fuera del dominio y > −1');
  while (value(hi) > price) {
    hi *= 2;
    if (!Number.isFinite(hi)) throw new RangeError('No se puede acotar la YTM');
  }
  for (let i = 0; i < 250; i++) {
    const mid = lo + (hi - lo) / 2;
    if (mid === lo || mid === hi) break;
    if (value(mid) > price) lo = mid;
    else hi = mid;
  }
  const root = lo + (hi - lo) / 2;
  if (Math.abs(value(root) / price - 1) > 1e-9) throw new RangeError('YTM sin precisión suficiente');
  return root;
};

export const yieldToMaturity = (bond: Bond, price: number): number =>
  yieldFromCashFlows(bondCashFlows(bond), price, bond.frequency);

/**
 * Cupón corrido Actual/Actual (periodo de cupón): cupón × días reales transcurridos / días reales del periodo.
 * Usa fechas civiles UTC e ignora la hora (sin cambios por horario de verano). En el inicio vale cero;
 * el extremo final da el cupón completo antes del pago. Tras el pago se inicia el periodo siguiente.
 */
export const accruedCoupon = (
  coupon: number, previousCoupon: Date, settlement: Date, nextCoupon: Date,
): number => {
  nonnegative(coupon);
  const day = (date: Date) => {
    if (!Number.isFinite(date.getTime())) throw new RangeError('Fecha no válida');
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };
  const previous = day(previousCoupon), current = day(settlement), next = day(nextCoupon);
  if (next <= previous || current < previous || current > next) throw new RangeError('Liquidación fuera del periodo');
  return coupon * (current - previous) / (next - previous);
};

/** Precios en euros, sin redondeo intermedio. */
export const dirtyPrice = (clean: number, accrued: number): number => {
  nonnegative(clean); nonnegative(accrued);
  return clean + accrued;
};

/**
 * Liquida dentro del primer periodo de un calendario regular, sin cupón ex-dividendo.
 * maturity se mide desde previousCoupon. Fracción Actual/Actual del periodo;
 * las fechas posteriores conservan intervalos de 1/frequency años.
 */
export const bondAtSettlement = (
  bond: Bond, previousCoupon: Date, settlement: Date, nextCoupon: Date,
) => {
  const scheduled = bondCashFlows(bond);
  const fraction = accruedCoupon(1, previousCoupon, settlement, nextCoupon);
  if (fraction === 1) throw new RangeError('Tras el pago, inicia el siguiente periodo');
  const frequency = bond.frequency ?? 1;
  const coupon = bond.face * bond.couponRate / frequency;
  return {
    coupon,
    accrued: accruedCoupon(coupon, previousCoupon, settlement, nextCoupon),
    flows: scheduled.map(({ t, amount }) => ({ t: t - fraction / frequency, amount })),
  };
};
export const cleanPrice = (dirty: number, accrued: number): number => {
  nonnegative(dirty); nonnegative(accrued);
  if (accrued > dirty) throw new RangeError('El cupón corrido supera el precio sucio');
  return dirty - accrued;
};

/** Spot efectivo anual de un bono cupón cero: (nominal / precio)^(1/t) − 1. */
export const spotFromZeroPrice = (face: number, price: number, maturity: number): number => {
  positive(face); positive(price); positive(maturity);
  return Math.expm1((Math.log(face) - Math.log(price)) / maturity);
};

const validateCurve = (curve: readonly SpotRate[]) => {
  curve.forEach(({ t, rate }, i) => {
    positive(t); validRate(rate);
    if (curve.slice(0, i).some((node) => sameTime(node.t, t))) throw new RangeError('Fecha spot duplicada');
  });
};
const spotAt = (curve: readonly SpotRate[], t: number): number => {
  const node = curve.find((node) => sameTime(node.t, t));
  if (!node) throw new RangeError(`Falta el spot para t = ${t}`);
  return node.rate;
};

/** Descuenta cada cobro con el spot efectivo anual de su propia fecha. */
export const priceFromSpotCurve = (flows: readonly Flow[], curve: readonly SpotRate[]): number => {
  validFlows(flows); validateCurve(curve);
  return flows.reduce((sum, { t, amount }) => amount === 0 ? sum :
    sum + amount * Math.exp(-t * Math.log1p(spotAt(curve, t))), 0);
};
export const bondPriceFromSpots = (bond: Bond, curve: readonly SpotRate[]): number =>
  priceFromSpotCurve(bondCashFlows(bond), curve);

/**
 * Bootstrap por vencimientos ascendentes, sin mutar la entrada ni interpolar.
 * Cada cupón anterior al vencimiento necesita un spot ya conocido; no admite sistemas indeterminados.
 * Un cupón cero sólo necesita el spot final, no los nodos intermedios de su calendario nominal.
 */
export const bootstrapSpotCurve = (bonds: readonly QuotedBond[]): SpotRate[] => {
  if (!bonds.length) throw new RangeError('Se requiere al menos un bono');
  const curve: SpotRate[] = [];
  for (const bond of [...bonds].sort((a, b) => a.maturity - b.maturity)) {
    positive(bond.price);
    const flows = bondCashFlows(bond).filter(({ amount }) => amount > 0);
    const last = flows[flows.length - 1];
    if (curve.some(({ t }) => sameTime(t, last.t))) throw new RangeError('Vencimiento duplicado');
    const priorPV = flows.slice(0, -1).reduce((sum, { t, amount }) =>
      sum + amount * Math.exp(-t * Math.log1p(spotAt(curve, t))), 0);
    const residual = bond.price - priorPV;
    positive(residual);
    const rate = spotFromZeroPrice(last.amount, residual, last.t);
    validRate(rate);
    curve.push({ t: last.t, rate });
  }
  return curve;
};

/** f_{s,k}: tasa efectiva anual entre s y s+k; s ≥ 0 y k > 0, sin interpolación. */
export const forwardRate = (curve: readonly SpotRate[], start: number, length: number): number => {
  nonnegative(start); positive(length); validateCurve(curve);
  const end = start + length;
  const logEnd = end * Math.log1p(spotAt(curve, end));
  const logStart = start === 0 ? 0 : start * Math.log1p(spotAt(curve, start));
  return Math.expm1((logEnd - logStart) / length);
};

/** Duración de Macaulay (años), duración modificada (años) y convexidad (años²) respecto a YTM nominal. */
export const cashFlowRisk = (flows: readonly Flow[], yieldRate: number, frequency = 1) => {
  const price = priceFromCashFlows(flows, yieldRate, frequency);
  if (!Number.isFinite(price) || price <= 0) throw new RangeError('Precio fuera de la precisión numérica');
  const base = 1 + yieldRate / frequency;
  const macaulay = flows.reduce((sum, flow) => sum + flow.t * discounted(flow, yieldRate, frequency) / price, 0);
  const convexity = flows.reduce((sum, flow) =>
    sum + flow.t * (flow.t + 1 / frequency) * discounted(flow, yieldRate, frequency) / price / base ** 2, 0);
  return { price, macaulay, modified: macaulay / base, convexity };
};

export const macaulayDuration = (bond: Bond, yieldRate: number): number =>
  cashFlowRisk(bondCashFlows(bond), yieldRate, bond.frequency).macaulay;
export const modifiedDuration = (bond: Bond, yieldRate: number): number =>
  cashFlowRisk(bondCashFlows(bond), yieldRate, bond.frequency).modified;
export const bondConvexity = (bond: Bond, yieldRate: number): number =>
  cashFlowRisk(bondCashFlows(bond), yieldRate, bond.frequency).convexity;

/** ΔP en euros: −P D_mod Δy, añadiendo ½ P convexidad (Δy)² si se solicita. Δy en tanto por uno. */
export const durationPriceChange = (bond: Bond, yieldRate: number, deltaYield: number, withConvexity = false): number => {
  if (!Number.isFinite(deltaYield)) throw new RangeError('El cambio de tasa debe ser finito');
  validRate(yieldRate + deltaYield);
  const risk = cashFlowRisk(bondCashFlows(bond), yieldRate, bond.frequency);
  return risk.price * (-risk.modified * deltaYield + (withConvexity ? 0.5 * risk.convexity * deltaYield ** 2 : 0));
};
