/**
 * Forwards, futuros y pagos de opciones. Importes por unidad salvo indicación contraria.
 * Tipos efectivos anuales y tiempo en años por defecto; no se redondean resultados.
 * Sin modelos de valoración de opciones: https://jesusvillota.github.io/options-explained/
 */

const finite = (...xs: number[]) => {
  if (xs.some(x => !Number.isFinite(x))) throw new RangeError('Se requieren valores finitos');
};
const nonnegative = (...xs: number[]) => {
  finite(...xs);
  if (xs.some(x => x < 0)) throw new RangeError('Precios, plazos e importes deben ser no negativos');
};

export type Position = 'long' | 'short';
export type Compounding = 'annual' | 'continuous';
const sign = (position: Position) => position === 'long' ? 1 : -1;

/** Factor de descuento: anual efectivo o continuo. Se admiten tipos negativos. */
export function discountFactor(rate: number, maturity: number, compounding: Compounding = 'annual'): number {
  finite(rate);
  nonnegative(maturity);
  if (compounding === 'annual' && rate <= -1) throw new RangeError('El tipo efectivo debe superar −1');
  return compounding === 'annual' ? (1 + rate) ** -maturity : Math.exp(-rate * maturity);
}

export interface CashIncome { amount: number; time: number }
export interface ForwardCarry {
  compounding?: Compounding;
  /** Ingresos conocidos pendientes, con fechas relativas a la valoración actual. */
  income?: readonly CashIncome[];
  /** Rendimiento proporcional: continuo o efectivo anual discreto; no combinar con income. */
  yield?: { rate: number; compounding: Compounding };
  /** Valor actual de los costes monetarios de almacenamiento pendientes. */
  storageCostPV?: number;
}

/** Precio de entrega sin arbitraje, con ingresos conocidos O rendimiento proporcional. */
export function forwardPrice(spot: number, rate: number, maturity: number, carry: ForwardCarry = {}): number {
  nonnegative(spot, maturity, carry.storageCostPV ?? 0);
  const df = discountFactor(rate, maturity, carry.compounding);
  if (carry.yield && carry.income?.length) throw new RangeError('No combinar ingresos conocidos y rendimiento proporcional');
  let prepaid = spot;
  if (carry.yield) prepaid *= discountFactor(carry.yield.rate, maturity, carry.yield.compounding);
  for (const payment of carry.income ?? []) {
    nonnegative(payment.amount, payment.time);
    if (payment.time > maturity) throw new RangeError('El ingreso debe ocurrir antes o al vencimiento');
    prepaid -= payment.amount * discountFactor(rate, payment.time, carry.compounding);
  }
  prepaid += carry.storageCostPV ?? 0;
  if (prepaid < 0) throw new RangeError('El coste neto de la réplica no puede ser negativo');
  return prepaid / df;
}

/** Valor actual de un contrato existente; maturity es el plazo RESTANTE. */
export function forwardValue(spot: number, deliveryPrice: number, rate: number, maturity: number,
  position: Position = 'long', carry: ForwardCarry = {}): number {
  nonnegative(deliveryPrice);
  return sign(position) * (forwardPrice(spot, rate, maturity, carry) - deliveryPrice)
    * discountFactor(rate, maturity, carry.compounding);
}

/** Pago al vencimiento, sin ingresos ni costes de financiación de la posición. */
export function forwardPayoff(spotAtExpiry: number, deliveryPrice: number, position: Position = 'long'): number {
  nonnegative(spotAtExpiry, deliveryPrice);
  return sign(position) * (spotAtExpiry - deliveryPrice);
}

/** FRA: largo paga fijo y recibe variable; tipos simples sobre accrualYears.
 * Liquidación por defecto al INICIO del préstamo; 'end' paga al final sin descuento.
 */
export function fraPayoff(notional: number, fixedRate: number, floatingRate: number, accrualYears: number,
  position: Position = 'long', settlement: 'start' | 'end' = 'start'): number {
  nonnegative(notional, accrualYears);
  finite(fixedRate, floatingRate);
  if (1 + floatingRate * accrualYears <= 0 || 1 + fixedRate * accrualYears <= 0) {
    throw new RangeError('Los factores simples deben ser positivos');
  }
  const amount = sign(position) * notional * (floatingRate - fixedRate) * accrualYears;
  return settlement === 'start' ? amount / (1 + floatingRate * accrualYears) : amount;
}

/** Base = contado − futuro, con el mismo activo y fecha de observación. */
export function basis(spot: number, futuresPrice: number): number {
  nonnegative(spot, futuresPrice);
  return spot - futuresPrice;
}

export interface FuturesMarginInput {
  /** prices[0] es el precio de apertura; el resto son liquidaciones diarias. */
  prices: readonly number[];
  position: Position;
  contracts: number;
  multiplier: number;
  /** Importes totales para toda la posición, no porcentajes ni importes por contrato. */
  initialMargin: number;
  maintenanceMargin: number;
  /** Retiradas opcionales por día, después de reponer el margen; solo del exceso sobre el inicial. */
  withdrawals?: readonly number[];
}

export interface FuturesMarginDay {
  day: number;
  price: number;
  variationMargin: number;
  balanceBeforeCall: number;
  marginCall: number;
  payout: number;
  /** Retirada NETA: payout − marginCall; una reposición es una retirada negativa. */
  withdrawal: number;
  cumulativeVariationMargin: number;
  cumulativeWithdrawals: number;
  balance: number;
}

/**
 * Ajuste diario sin intereses ni comisiones. Una llamada estrictamente bajo mantenimiento
 * repone hasta el margen inicial. La variación es ganancia/pérdida, la reposición no lo es.
 * Identidad por fila: balance = initialMargin + cumulativeVariationMargin − cumulativeWithdrawals.
 * La suma nominal de variaciones coincide con el pago de un forward de igual signo y precio
 * inicial. No incluye intereses de financiación/reinversión, incluso con tipos planos no nulos.
 */
export function futuresMarginAccount(input: FuturesMarginInput) {
  const { prices, position, contracts, multiplier, initialMargin, maintenanceMargin, withdrawals } = input;
  nonnegative(contracts, multiplier, initialMargin, maintenanceMargin, ...prices, ...(withdrawals ?? []));
  if (!prices.length || !Number.isInteger(contracts) || contracts === 0 || multiplier === 0
    || maintenanceMargin > initialMargin || (withdrawals && withdrawals.length !== prices.length - 1)) {
    throw new RangeError('Datos de la cuenta de margen incompatibles');
  }
  let balance = initialMargin;
  let cumulativeVariationMargin = 0;
  let cumulativeWithdrawals = 0;
  const days: FuturesMarginDay[] = [];
  for (let day = 1; day < prices.length; day++) {
    const variationMargin = sign(position) * contracts * multiplier * (prices[day] - prices[day - 1]);
    const balanceBeforeCall = balance + variationMargin;
    const marginCall = balanceBeforeCall < maintenanceMargin ? initialMargin - balanceBeforeCall : 0;
    const payout = withdrawals?.[day - 1] ?? 0;
    if (payout > Math.max(0, balanceBeforeCall + marginCall - initialMargin)) {
      throw new RangeError('Solo puede retirarse el exceso sobre el margen inicial');
    }
    const withdrawal = payout - marginCall;
    balance = balanceBeforeCall - withdrawal;
    cumulativeVariationMargin += variationMargin;
    cumulativeWithdrawals += withdrawal;
    days.push({ day, price: prices[day], variationMargin, balanceBeforeCall, marginCall, payout,
      withdrawal, cumulativeVariationMargin, cumulativeWithdrawals, balance });
  }
  return { days, balance, totalGain: cumulativeVariationMargin, cumulativeWithdrawals };
}

export type OptionType = 'call' | 'put';

/** Pago firmado al vencimiento de una call o put, sin prima. */
export function optionPayoff(type: OptionType, spotAtExpiry: number, strike: number, position: Position = 'long'): number {
  nonnegative(spotAtExpiry, strike);
  const intrinsic = type === 'call' ? spotAtExpiry - strike : strike - spotAtExpiry;
  return sign(position) * Math.max(intrinsic, 0);
}

/** Beneficio = pago − prima para el largo; el corto recibe la prima. Sin capitalizar la prima. */
export function optionProfit(type: OptionType, spotAtExpiry: number, strike: number, premium: number,
  position: Position = 'long'): number {
  nonnegative(premium);
  return optionPayoff(type, spotAtExpiry, strike, position) - sign(position) * premium;
}

export type StrategyLeg =
  | { type: 'stock'; quantity: number; entryPrice: number }
  | { type: OptionType; quantity: number; strike: number; premium: number };

const validateLeg = (leg: StrategyLeg) => {
  finite(leg.quantity);
  if (leg.type === 'stock') nonnegative(leg.entryPrice);
  else nonnegative(leg.strike, leg.premium);
};

/** quantity firmada: positiva para largo y negativa para corto. */
export function legPayoff(leg: StrategyLeg, spotAtExpiry: number): number {
  validateLeg(leg);
  nonnegative(spotAtExpiry);
  return leg.quantity * (leg.type === 'stock' ? spotAtExpiry : optionPayoff(leg.type, spotAtExpiry, leg.strike));
}

/** Pago bruto de la cartera: suma de sus patas, incluida la acción cuando corresponda. */
export function strategyPayoff(legs: readonly StrategyLeg[], spotAtExpiry: number): number {
  nonnegative(spotAtExpiry);
  return legs.reduce((sum, leg) => sum + legPayoff(leg, spotAtExpiry), 0);
}

/** Coste firmado inicial; prima recibida por una pata corta reduce el coste. */
export function strategyCost(legs: readonly StrategyLeg[]): number {
  return legs.reduce((sum, leg) => {
    validateLeg(leg);
    return sum + leg.quantity * (leg.type === 'stock' ? leg.entryPrice : leg.premium);
  }, 0);
}

export const strategyProfit = (legs: readonly StrategyLeg[], spotAtExpiry: number): number =>
  strategyPayoff(legs, spotAtExpiry) - strategyCost(legs);

const optionLeg = (type: OptionType, strike: number, premium: number, quantity = 1): StrategyLeg => {
  const leg = { type, strike, premium, quantity };
  validateLeg(leg);
  return leg;
};
const stockLeg = (entryPrice: number): StrategyLeg => {
  nonnegative(entryPrice);
  return { type: 'stock', quantity: 1, entryPrice };
};
const ordered = (low: number, high: number) => {
  nonnegative(low, high);
  if (low >= high) throw new RangeError('Se requiere un strike inferior al otro');
};

export const coveredCall = (spot: number, strike: number, premium: number): StrategyLeg[] =>
  [stockLeg(spot), optionLeg('call', strike, premium, -1)];
export const protectivePut = (spot: number, strike: number, premium: number): StrategyLeg[] =>
  [stockLeg(spot), optionLeg('put', strike, premium)];

/** Spread alcista de calls: comprar strike bajo, vender strike alto. */
export function bullSpread(lowerStrike: number, upperStrike: number, lowerPremium: number, upperPremium: number): StrategyLeg[] {
  ordered(lowerStrike, upperStrike);
  return [optionLeg('call', lowerStrike, lowerPremium), optionLeg('call', upperStrike, upperPremium, -1)];
}
/** Spread bajista de puts: comprar strike alto, vender strike bajo. */
export function bearSpread(lowerStrike: number, upperStrike: number, lowerPremium: number, upperPremium: number): StrategyLeg[] {
  ordered(lowerStrike, upperStrike);
  return [optionLeg('put', upperStrike, upperPremium), optionLeg('put', lowerStrike, lowerPremium, -1)];
}
export const straddle = (strike: number, callPremium: number, putPremium: number): StrategyLeg[] =>
  [optionLeg('call', strike, callPremium), optionLeg('put', strike, putPremium)];

export function strangle(putStrike: number, callStrike: number, putPremium: number, callPremium: number): StrategyLeg[] {
  ordered(putStrike, callStrike);
  return [optionLeg('put', putStrike, putPremium), optionLeg('call', callStrike, callPremium)];
}
export function collar(spot: number, putStrike: number, callStrike: number, putPremium: number, callPremium: number): StrategyLeg[] {
  ordered(putStrike, callStrike);
  return [stockLeg(spot), optionLeg('put', putStrike, putPremium), optionLeg('call', callStrike, callPremium, -1)];
}

export interface Breakevens {
  /** Ceros aislados del beneficio para precios no negativos. */
  points: number[];
  /** Tramos completos con beneficio cero; to = null significa hasta infinito. */
  intervals: { from: number; to: number | null }[];
}

/** Raíces exactas por tramos lineales; no busca sobre una rejilla ni omite ceros planos. */
export function breakevens(legs: readonly StrategyLeg[]): Breakevens {
  strategyCost(legs); // valida también patas con cantidad cero
  const knots = [...new Set([0, ...legs.flatMap(leg => leg.type === 'stock' ? [] : [leg.strike])])].sort((a, b) => a - b);
  const points = new Set<number>();
  const intervals: Breakevens['intervals'] = [];
  knots.forEach((from, index) => {
    const to = knots[index + 1] ?? null;
    const value = strategyProfit(legs, from);
    const slope = legs.reduce((sum, leg) => sum + leg.quantity * (leg.type === 'stock' ? 1
      : leg.type === 'call' ? (leg.strike <= from ? 1 : 0) : (leg.strike > from ? -1 : 0)), 0);
    if (slope === 0 && value === 0) {
      const previous = intervals[intervals.length - 1];
      if (previous?.to === from) previous.to = to;
      else intervals.push({ from, to });
    } else if (slope !== 0) {
      const root = from - value / slope;
      if (root >= from && (to === null || root <= to)) points.add(root === 0 ? 0 : root);
    }
  });
  return { points: [...points].filter(p => !intervals.some(i => p >= i.from && (i.to === null || p <= i.to))).sort((a, b) => a - b), intervals };
}

/** Comprobación de paridad al vencimiento: call − put − (S_T − K) = 0. No valora opciones. */
export function payoffParityResidual(spotAtExpiry: number, strike: number): number {
  return optionPayoff('call', spotAtExpiry, strike) - optionPayoff('put', spotAtExpiry, strike)
    - forwardPayoff(spotAtExpiry, strike);
}

/** Comprobación de precios OBSERVADOS europeos sin dividendos: c − p = S − K·DF. */
export function putCallParityResidual(call: number, put: number, spot: number, strike: number, df: number): number {
  nonnegative(call, put, spot, strike, df);
  if (df === 0) throw new RangeError('El factor de descuento debe ser positivo');
  return call - put - (spot - strike * df);
}
