/** PS4 scalar adapters. Rates and returns use percent; amounts use euros.
 * Source books and payment calendars stay fixed; variants change stated inputs.
 */
import { marginPurchase, shortSale, marketOrder, quote, implicitCost, isMarginCall } from './finance/markets';
import { marketModelReturn, abnormalReturn, cumulativeAbnormalReturn } from './finance/eventStudy';
import { bondPriceFromSpots, yieldToMaturity, macaulayDuration, priceFromSpotCurve, forwardRate, yieldFromCashFlows, dirtyPrice } from './finance/bonds';
import { forwardPrice, forwardValue, discountFactor, optionProfit, strategyProfit, straddle, futuresMarginAccount } from './finance/derivatives';
const pct = (x: number) => x / 100;
export const compra = (field: number, n: number, p0: number, loan: number, p1: number, rate: number) => {
  const a = marginPurchase(n, p0, loan, p1, pct(rate));
  return [a.initialEquity, 100*a.initialMarginPct, a.equity, 100*a.marginPct, 100*a.returnOnEquity, 100*a.priceReturn][field];
};
export const llamadaCompra = (n: number, p0: number, loan: number, p1: number, rate: number, maintenance: number) => Number(isMarginCall(compra(3,n,p0,loan,p1,rate)/100, pct(maintenance)));
export const corto = (field: number, n: number, p0: number, initial: number, p1: number, dividend: number) => {
  const a = shortSale(n,p0,pct(initial),p1,dividend);
  return [a.proceeds,a.initialMargin,a.equity,100*a.marginPct,100*a.returnOnMargin][field];
};
export const llamadaCorto = (n: number, p0: number, initial: number, p1: number, dividend: number, maintenance: number) => Number(isMarginCall(corto(3,n,p0,initial,p1,dividend)/100,pct(maintenance)));
const stockBook = { bids: [{price:61.8,size:400},{price:61.5,size:600},{price:61.2,size:500},{price:60.8,size:900}], asks: [{price:62.3,size:200},{price:63.1,size:300},{price:64,size:400},{price:65.5,size:600}] };
export const orden = (field: number, n: number, reference: number) => {
  const fill = marketOrder(stockBook,'buy',n);
  const cost = implicitCost('buy',n,fill.avgPrice!,reference);
  return [quote(stockBook).spread!,300,fill.avgPrice!,fill.total,cost.euros,100*cost.pct][field];
};
export const evento = (field: number, beta: number, observed: number, market: number) => {
  const expected = marketModelReturn(pct(market),0,beta);
  return 100*(field === 0 ? expected : abnormalReturn(pct(observed),expected));
};
export const car = (beta: number, a: number, b: number, c: number) => 100*cumulativeAbnormalReturn([evento(1,beta,a,3),evento(1,beta,b,1),evento(1,beta,c,-2)].map(pct));
const bond = (face: number, coupon: number, years: number) => ({face,couponRate:pct(coupon),maturity:years});
// Explicit variant curve: linearly interpolate annual spots between r1 and rT.
const curve = (r1: number, rT: number, years: number) => Array.from({length:years},(_,i)=>({t:i+1,rate:pct(r1+(rT-r1)*i/(years-1))}));
export const precioBono = (face: number, coupon: number, years: number, r1: number, rT: number) => bondPriceFromSpots(bond(face,coupon,years),curve(r1,rT,years));
export const tirBono = (face: number, coupon: number, years: number, price: number) => 100*yieldToMaturity(bond(face,coupon,years),price);
export const duracion = (face: number, coupon: number, years: number, price: number) => macaulayDuration(bond(face,coupon,years),tirBono(face,coupon,years,price)/100);
export const pvFinal = (face: number, coupon: number, years: number, rT: number) => priceFromSpotCurve([{t:years,amount:face*(1+pct(coupon))}],[{t:years,rate:pct(rT)}]);
// New curve: r1 for year one, same annual forward f for each following year.
export const spotNuevo = (r1: number, f: number, years: number) => 100*((1+pct(r1))**(1/years)*(1+pct(f))**((years-1)/years)-1);
export const precioNuevo = (face: number, coupon: number, years: number, r1: number, f: number) => bondPriceFromSpots(bond(face,coupon,years),Array.from({length:years},(_,i)=>({t:i+1,rate:pct(spotNuevo(r1,f,i+1))})));
export const forward = (r1: number, r2: number, r3: number, r4: number, r5: number, start: number, length: number) => 100*forwardRate([r1,r2,r3,r4,r5].map((r,i)=>({t:i+1,rate:pct(r)})),start,length);
const buyBook = {bids:[],asks:[{price:101,size:150000},{price:101.2,size:150000},{price:101.5,size:200000},{price:102,size:100000}]};
const sellBook = {asks:[],bids:[{price:99.2,size:100000},{price:99,size:150000},{price:98.75,size:200000},{price:98.4,size:150000}]};
export const precioLibro = (nominal: number, sell: number) => marketOrder(sell?sellBook:buyBook,sell?'sell':'buy',nominal).avgPrice!;
export const corrido = (face: number, annual: number, fraction: number) => face*pct(annual)/4*fraction;
export const efectivo = (nominal: number, annual: number, sell: number) => dirtyPrice(nominal*precioLibro(nominal,sell)/100,corrido(nominal,annual,sell?2/3:1/3));
export const tirVencimiento = (nominal: number, annual: number) => 100*yieldFromCashFlows(Array.from({length:12},(_,i)=>({t:(2+3*i)/12,amount:nominal*pct(annual)/4+(i===11?nominal:0)})),efectivo(nominal,annual,0));
export const tirVenta = (nominal: number, annual: number) => 100*yieldFromCashFlows([{t:1/6,amount:nominal*pct(annual)/4},{t:1/3,amount:efectivo(nominal,annual,1)}],efectivo(nominal,annual,0));
/** Audit return convention: source purchase cost 1023.68, unrounded corrected sale proceeds. */
export const tirVentaAuditada = () => 100*yieldFromCashFlows([{t:1/6,amount:36.25},{t:1/3,amount:efectivo(350000,14.5,1)/350}],1023.68);
export const cotizacion = (spot: number, rate: number, years: number) => forwardPrice(spot,pct(rate),years);
export const descuento = (rate: number, years: number) => discountFactor(pct(rate),years);
export const valorForward = (spot: number, strike: number, rate: number, years: number) => forwardValue(spot,strike,pct(rate),years);
export const beneficioCall = (spot: number, strike: number, premium: number) => optionProfit('call',spot,strike,premium);
export const beneficioAmbas = (spot: number, strike: number, call: number, put: number) => strategyProfit(straddle(strike,call,put),spot);
export const futuros = (field: number, p0: number, p1: number, p2: number, p3: number, contracts: number, multiplier: number, initial: number, maintenance: number) => {
  const a = futuresMarginAccount({prices:[p0,p1,p2,p3],position:'long',contracts,multiplier,initialMargin:initial,maintenanceMargin:maintenance});
  return [...a.days.flatMap(d=>[d.variationMargin,d.marginCall,d.balance]),a.totalGain][field];
};
export const compra_0 = compra.bind(null, 0);
export const compra_1 = compra.bind(null, 1);
export const compra_2 = compra.bind(null, 2);
export const compra_3 = compra.bind(null, 3);
export const compra_4 = compra.bind(null, 4);
export const compra_5 = compra.bind(null, 5);
export const corto_0 = corto.bind(null, 0);
export const corto_1 = corto.bind(null, 1);
export const corto_2 = corto.bind(null, 2);
export const corto_3 = corto.bind(null, 3);
export const corto_4 = corto.bind(null, 4);
export const orden_0 = orden.bind(null, 0);
export const orden_1 = orden.bind(null, 1);
export const orden_2 = orden.bind(null, 2);
export const orden_3 = orden.bind(null, 3);
export const orden_4 = orden.bind(null, 4);
export const orden_5 = orden.bind(null, 5);
export const evento_0 = evento.bind(null, 0);
export const evento_1 = evento.bind(null, 1);
export const futuros_0 = futuros.bind(null, 0);
export const futuros_1 = futuros.bind(null, 1);
export const futuros_2 = futuros.bind(null, 2);
export const futuros_3 = futuros.bind(null, 3);
export const futuros_4 = futuros.bind(null, 4);
export const futuros_5 = futuros.bind(null, 5);
export const futuros_6 = futuros.bind(null, 6);
export const futuros_7 = futuros.bind(null, 7);
export const futuros_8 = futuros.bind(null, 8);
export const futuros_9 = futuros.bind(null, 9);
