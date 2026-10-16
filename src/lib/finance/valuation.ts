/** Valoración. Tasas en tanto por uno; flujos al final de cada periodo. */
import { pv } from './timeValue.ts';

export class ValuationError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'ValuationError';
  }
}

const finite = (...values: number[]): void => {
  if (values.some((x) => !Number.isFinite(x))) throw new ValuationError('Se requieren valores finitos');
};
const rate = (r: number): void => {
  finite(r);
  if (r <= -1) throw new ValuationError('La tasa debe ser mayor que -1');
};
const tax = (t: number): void => {
  finite(t);
  if (t < 0 || t > 1) throw new ValuationError('El impuesto debe estar entre 0 y 1');
};

/** Gordon: D1/(r-g). D1 es el próximo dividendo, no el dividendo actual. */
export const gordonPrice = (nextDividend: number, r: number, g: number): number => {
  finite(nextDividend, g);
  rate(r);
  if (nextDividend < 0 || g < -1 || r <= g) throw new ValuationError('Gordon requiere D1 >= 0, g >= -1 y r > g');
  return nextDividend / (r - g);
};

/** g = r-D1/P0; requiere un dividendo positivo para identificar g < r. */
export const impliedGrowth = (price: number, nextDividend: number, r: number): number => {
  finite(price, nextDividend);
  rate(r);
  if (price <= 0 || nextDividend <= 0) throw new ValuationError('P0 y D1 deben ser positivos');
  const g = r - nextDividend / price;
  gordonPrice(nextDividend, r, g);
  return g;
};

/** r = D1/P0+g. */
export const requiredReturn = (price: number, nextDividend: number, g: number): number => {
  finite(price, nextDividend, g);
  if (price <= 0 || nextDividend <= 0) throw new ValuationError('P0 y D1 deben ser positivos');
  const r = nextDividend / price + g;
  gordonPrice(nextDividend, r, g);
  return r;
};

/** DDM finito: dividendos en t=1..n y precio de venta justo después de Dn. Lista vacía: t=0. */
export const dividendPrice = (dividends: readonly number[], r: number, terminalPrice = 0): number => {
  rate(r);
  finite(terminalPrice);
  for (const d of dividends) {
    finite(d);
    if (d < 0) throw new ValuationError('Los dividendos no pueden ser negativos');
  }
  if (terminalPrice < 0) throw new ValuationError('El precio terminal no puede ser negativo');
  return discountedCashFlow(dividends, r, terminalPrice);
};

export interface DividendStage {
  growth: number;
  periods: number;
}

/** Etapas consecutivas desde D0; cada etapa crece antes de pagar su primer dividendo. */
export const dividendSchedule = (currentDividend: number, stages: readonly DividendStage[]): number[] => {
  finite(currentDividend);
  if (currentDividend < 0) throw new ValuationError('D0 no puede ser negativo');
  const dividends: number[] = [];
  let d = currentDividend;
  for (const { growth, periods } of stages) {
    finite(growth, periods);
    if (growth < -1 || !Number.isSafeInteger(periods) || periods < 1) {
      throw new ValuationError('Cada etapa requiere g >= -1 y un número entero positivo de periodos');
    }
    for (let t = 0; t < periods; t++) {
      d *= 1 + growth;
      finite(d);
      dividends.push(d);
    }
  }
  return dividends;
};

/** DDM de varias etapas explícitas y crecimiento perpetuo desde n+1; sin etapas equivale a Gordon. */
export const multiStageDDM = (
  currentDividend: number, stages: readonly DividendStage[], r: number, terminalGrowth: number,
): number => {
  const dividends = dividendSchedule(currentDividend, stages);
  const last = dividends.at(-1) ?? currentDividend;
  return dividendPrice(dividends, r, gordonPrice(last * (1 + terminalGrowth), r, terminalGrowth));
};

/** FCFF = EBIT(1-T) + amortización - capex - incremento del capital circulante. */
export const fcff = (ebit: number, taxRate: number, depreciation: number, capex: number, workingCapitalChange: number): number => {
  finite(ebit, depreciation, capex, workingCapitalChange);
  tax(taxRate);
  return ebit * (1 - taxRate) + depreciation - capex - workingCapitalChange;
};

/** FCFE = beneficio neto + amortización - capex - incremento del circulante + deuda neta emitida. */
export const fcfe = (netIncome: number, depreciation: number, capex: number, workingCapitalChange: number, netBorrowing: number): number => {
  finite(netIncome, depreciation, capex, workingCapitalChange, netBorrowing);
  return netIncome + depreciation - capex - workingCapitalChange + netBorrowing;
};

/** Conciliación: FCFE = FCFF - intereses(1-T) + deuda neta emitida. */
export const fcfeFromFcff = (firmCashFlow: number, interest: number, taxRate: number, netBorrowing: number): number => {
  finite(firmCashFlow, interest, netBorrowing);
  tax(taxRate);
  return firmCashFlow - interest * (1 - taxRate) + netBorrowing;
};

/** Pesos de mercado, no valores contables. Se permiten empresas sin deuda o sin equity. */
export const capitalWeights = (equity: number, debt: number): { equity: number; debt: number } => {
  finite(equity, debt, equity + debt);
  if (equity < 0 || debt < 0 || equity + debt <= 0) throw new ValuationError('E y D deben ser no negativos y E+D positivo');
  return { equity: equity / (equity + debt), debt: debt / (equity + debt) };
};

/** WACC = wE ke + wD kd(1-T); el escudo fiscal solo reduce el coste de la deuda. */
export const wacc = (equity: number, debt: number, equityCost: number, debtCost: number, taxRate: number): number => {
  rate(equityCost);
  rate(debtCost);
  tax(taxRate);
  const weights = capitalWeights(equity, debt);
  return weights.equity * equityCost + weights.debt * debtCost * (1 - taxRate);
};

/** Valor terminal en t=n: Cn(1+g)/(r-g), con flujos de caja que pueden ser negativos. */
export const terminalValue = (lastCashFlow: number, r: number, g: number): number => {
  finite(lastCashFlow, g);
  rate(r);
  if (g < -1 || r <= g) throw new ValuationError('El valor terminal requiere g >= -1 y r > g');
  return lastCashFlow * (1 + g) / (r - g);
};

/** VA de C1..Cn más un valor terminal en t=n. Sin desembolso inicial; admite flujos negativos. */
export const discountedCashFlow = (cashFlows: readonly number[], r: number, terminal = 0): number => {
  rate(r);
  finite(terminal);
  let value = pv(terminal, r, cashFlows.length);
  for (const [i, flow] of cashFlows.entries()) {
    finite(flow);
    value += pv(flow, r, i + 1);
  }
  return value;
};

/** Equity = valor de operaciones + caja excedente - deuda (sin restar dos veces la caja). */
export const enterpriseToEquity = (enterpriseValue: number, debt: number, excessCash = 0): number => {
  finite(enterpriseValue, debt, excessCash);
  if (debt < 0 || excessCash < 0) throw new ValuationError('Deuda y caja deben ser no negativas');
  return enterpriseValue + excessCash - debt;
};

export const pricePerShare = (equityValue: number, shares: number): number => {
  finite(equityValue, shares);
  if (shares <= 0) throw new ValuationError('El número de acciones debe ser positivo');
  return equityValue / shares;
};
