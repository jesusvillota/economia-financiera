/** Riesgo de un activo. Rentabilidades en tanto por uno; escenarios alineados por índice. */
export class RiskError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = 'RiskError';
  }
}

const finite = (...values: number[]): void => {
  if (values.some((x) => !Number.isFinite(x))) throw new RiskError('Se requieren valores finitos');
};
const series = (values: readonly number[], minimum = 1): void => {
  if (values.length < minimum) throw new RiskError(`Se requieren al menos ${minimum} observaciones`);
  for (const x of values) finite(x);
};
const scenarios = (returns: readonly number[], probabilities: readonly number[]): void => {
  series(returns);
  series(probabilities);
  if (returns.length !== probabilities.length || probabilities.some((p) => p < 0 || p > 1) ||
      Math.abs(probabilities.reduce((sum, p) => sum + p, 0) - 1) > 1e-12) {
    throw new RiskError('Las probabilidades deben estar alineadas, ser no negativas y sumar 1 (tolerancia 1e-12)');
  }
};

/** E[r] = suma p_s r_s. Centrado para conservar exactamente una serie constante.
 * Solo se normaliza el redondeo admitido (1e-12); las probabilidades inválidas lanzan RiskError.
 */
export const expectedReturn = (returns: readonly number[], probabilities: readonly number[]): number => {
  scenarios(returns, probabilities);
  const anchor = returns[probabilities.findIndex((p) => p > 0)];
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  return anchor + returns.reduce((sum, x, i) => sum + probabilities[i] * (x - anchor), 0) / total;
};

/** Varianza poblacional por escenarios: suma p_s (r_s-E[r])². */
export const scenarioVariance = (returns: readonly number[], probabilities: readonly number[]): number => {
  const mean = expectedReturn(returns, probabilities);
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  return returns.reduce((sum, x, i) => sum + probabilities[i] * (x - mean) ** 2, 0) / total;
};

export const scenarioStandardDeviation = (returns: readonly number[], probabilities: readonly number[]): number =>
  Math.sqrt(scenarioVariance(returns, probabilities));

/** Cov(X,Y) = suma p_s (X_s-E[X])(Y_s-E[Y]). */
export const covariance = (x: readonly number[], y: readonly number[], probabilities: readonly number[]): number => {
  const meanX = expectedReturn(x, probabilities);
  const meanY = expectedReturn(y, probabilities);
  const total = probabilities.reduce((sum, p) => sum + p, 0);
  return x.reduce((sum, value, i) => sum + probabilities[i] * (value - meanX) * (y[i] - meanY), 0) / total;
};

/** Correlación indefinida si alguna desviación es cero; se acota el error de redondeo. */
export const correlation = (x: readonly number[], y: readonly number[], probabilities: readonly number[]): number => {
  const sx = scenarioStandardDeviation(x, probabilities);
  const sy = scenarioStandardDeviation(y, probabilities);
  if (sx === 0 || sy === 0) throw new RiskError('La correlación requiere varianzas positivas');
  return Math.max(-1, Math.min(1, covariance(x, y, probabilities) / sx / sy));
};

/** Media aritmética de observaciones históricas. */
export const sampleMean = (returns: readonly number[]): number => {
  series(returns);
  return returns.reduce((sum, x) => sum + x, 0) / returns.length;
};

/** Varianza muestral insesgada: divisor n-1, no n. */
export const sampleVariance = (returns: readonly number[]): number => {
  series(returns, 2);
  const mean = sampleMean(returns);
  return returns.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (returns.length - 1);
};

export const sampleStandardDeviation = (returns: readonly number[]): number => Math.sqrt(sampleVariance(returns));

/** Retorno con dividendo cobrado al final: (P1-P0+D)/P0. */
export const holdingPeriodReturn = (initialPrice: number, finalPrice: number, dividend = 0): number => {
  finite(initialPrice, finalPrice, dividend);
  if (initialPrice <= 0 || finalPrice < 0 || dividend < 0) throw new RiskError('P0 debe ser positivo; P1 y D no negativos');
  return (finalPrice - initialPrice + dividend) / initialPrice;
};

/** sigma anual = sigma del periodo * sqrt(periodos/año), suponiendo retornos no correlacionados. */
export const annualizedVolatility = (standardDeviation: number, periodsPerYear: number): number => {
  finite(standardDeviation, periodsPerYear);
  if (standardDeviation < 0 || periodsPerYear <= 0) throw new RiskError('Se requiere sigma >= 0 y periodos/año > 0');
  return standardDeviation * Math.sqrt(periodsPerYear);
};

/** Propiedades: E[aX+b] = a E[X]+b; Var(aX+b) = a² Var(X), sin carteras. */
export const affineMoments = (mean: number, variance: number, scale: number, shift: number): { mean: number; variance: number } => {
  finite(mean, variance, scale, shift);
  if (variance < 0) throw new RiskError('La varianza no puede ser negativa');
  return { mean: scale * mean + shift, variance: scale ** 2 * variance };
};
