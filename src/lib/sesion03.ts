/** PS3 inputs/outputs use percent for returns, volatility and weights.
 * Variances/covariances use decimal-return squared; beta/Sharpe are unitless.
 */
import { minimumVarianceWeight, twoAssetReturn, twoAssetVariance, covarianceFromCorrelations, portfolioReturn, portfolioVariance } from './finance/portfolio';
import { beta, securityMarketLine, portfolioBeta, sharpeRatio, riskFreeMix, separationAllocation, alpha } from './finance/capm';
const p = (n: number) => n / 100;
export const retorno = (w: number, a: number, b: number) => 100 * twoAssetReturn(p(w), p(a), p(b));
export const riesgo = (w: number, a: number, b: number, rho: number) => 100 * Math.sqrt(twoAssetVariance(p(w), p(a), p(b), rho));
export const pesoMinimo = (a: number, b: number, rho: number, sinCortos: number) => 100 * minimumVarianceWeight(p(a), p(b), rho, Boolean(sinCortos));
export const retornoMinimo = (a: number, b: number, sa: number, sb: number, rho: number, sinCortos: number) => retorno(pesoMinimo(sa, sb, rho, sinCortos), a, b);
export const riesgoMinimo = (sa: number, sb: number, rho: number, sinCortos: number) => riesgo(pesoMinimo(sa, sb, rho, sinCortos), sa, sb, rho);
export const covarianza = (sa: number, sb: number, rho: number) => covarianceFromCorrelations([p(sa), p(sb)], [[1, rho], [rho, 1]])[0][1];
// Exercise 3 keeps source weights and the PSD correlation matrix fixed in every variant.
export const retornoTres = (a: number, b: number, c: number) => 100 * portfolioReturn([0.4, 0.35, 0.25], [p(a), p(b), p(c)]);
export const varianzaTres = (a: number, b: number, c: number) => portfolioVariance([0.4, 0.35, 0.25], covarianceFromCorrelations([p(a), p(b), p(c)], [[1, .45, .3], [.45, 1, .55], [.3, .55, 1]]));
export const riesgoTres = (a: number, b: number, c: number) => 100 * Math.sqrt(varianzaTres(a, b, c));
export const retornoMixto = (rf: number, r: number, s: number, w: number) => 100 * riskFreeMix(p(rf), p(r), p(s), p(w)).expectedReturn;
export const riesgoMixto = (rf: number, r: number, s: number, w: number) => 100 * riskFreeMix(p(rf), p(r), p(s), p(w)).sigma;
export const sharpe = (rf: number, r: number, s: number) => sharpeRatio(p(r), p(rf), p(s));
export const asignacion = (rf: number, r: number, s: number, objetivo: number) => 100 * separationAllocation(p(rf), p(r), p(s), { sigma: p(objetivo) }).riskyWeight;
export const betaActivo = beta;
export const requerido = (rf: number, rm: number, b: number) => 100 * securityMarketLine(p(rf), p(rm), b);
export const requeridoCov = (rf: number, rm: number, cov: number, vm: number) => requerido(rf, rm, beta(cov, vm));
export const brechaCov = (observado: number, rf: number, rm: number, cov: number, vm: number) => 100 * alpha(p(observado), p(rf), p(rm), beta(cov, vm));
export const betaCartera = (a: number, b: number, c: number, d: number, nueva: number) => portfolioBeta(nueva ? [.3, .25, .25, .2] : [.25, .3, .2, .25], [a, b, c, d]);
export const requeridoCartera = (rf: number, rm: number, a: number, b: number, c: number, d: number, nueva: number) => requerido(rf, rm, betaCartera(a, b, c, d, nueva));
export const sharpeMinimo = (rf: number, a: number, b: number, sa: number, sb: number, rho: number, corto: number) => sharpe(rf, retornoMinimo(a, b, sa, sb, rho, corto), riesgoMinimo(sa, sb, rho, corto));
export const asignacionMinima = (rf: number, a: number, b: number, sa: number, sb: number, rho: number, corto: number, objetivo: number) => asignacion(rf, retornoMinimo(a, b, sa, sb, rho, corto), riesgoMinimo(sa, sb, rho, corto), objetivo);
export const efectivoMinimo = (rf: number, a: number, b: number, sa: number, sb: number, rho: number, corto: number, objetivo: number) => 100 - asignacionMinima(rf, a, b, sa, sb, rho, corto, objetivo);
