/** Mercados: compra al margen, venta en corto, costes, libro de órdenes, subasta y OPI. Importes en €. */

const check = (...xs: number[]) => {
  if (xs.some((x) => !Number.isFinite(x) || x < 0)) throw new RangeError('Precios, cantidades y tipos deben ser finitos y no negativos');
};

/** El margen está por debajo del mantenimiento: hay llamada de margen (igual no lo es). */
export const isMarginCall = (marginPct: number, maintenance: number): boolean => marginPct < maintenance;

/**
 * Compra al margen: n acciones a p0, préstamo `loan` al tipo `rate` durante el periodo; precio final p1.
 * Rentabilidad del capital = rentabilidad del precio × apalancamiento − rate × loan / capital inicial.
 */
export const marginPurchase = (n: number, p0: number, loan: number, p1 = p0, rate = 0) => {
  check(n, p0, loan, p1, rate);
  const cost = n * p0;
  if (loan >= cost) throw new RangeError('El préstamo debe ser menor que el coste de la compra');
  const initialEquity = cost - loan;
  const debt = loan * (1 + rate);
  const value = n * p1;
  const equity = value - debt;
  return {
    cost,
    initialEquity,
    initialMarginPct: initialEquity / cost,
    leverage: cost / initialEquity,
    debt,
    value,
    equity,
    marginPct: equity / value,
    priceReturn: p1 / p0 - 1,
    returnOnEquity: (equity - initialEquity) / initialEquity,
  };
};

/** Precio por debajo del cual salta la llamada de margen en una compra: (nP − deuda)/(nP) = m. */
export const marginCallPriceLong = (n: number, debt: number, maintenance: number): number => {
  check(n, debt, maintenance);
  if (n === 0 || maintenance >= 1) throw new RangeError('Se requiere n > 0 y mantenimiento < 1');
  return debt / (n * (1 - maintenance));
};

/**
 * Venta en corto de n acciones a p0 con margen inicial `initialRate` (fracción de lo vendido);
 * precio final p1 y dividendo por acción pagado al prestamista. La cuenta de margen no paga intereses.
 */
export const shortSale = (n: number, p0: number, initialRate: number, p1 = p0, dividend = 0) => {
  check(n, p0, initialRate, p1, dividend);
  const proceeds = n * p0;
  const initialMargin = initialRate * proceeds;
  const liability = n * p1;
  const dividends = n * dividend;
  const equity = initialMargin + proceeds - liability - dividends;
  return {
    proceeds,
    initialMargin,
    liability,
    dividends,
    equity,
    marginPct: equity / liability,
    priceReturn: p1 / p0 - 1,
    returnOnMargin: (equity - initialMargin) / initialMargin,
  };
};

/** Precio por encima del cual salta la llamada de margen en un corto: (activos − nP)/(nP) = m. */
export const marginCallPriceShort = (n: number, assets: number, maintenance: number): number => {
  check(n, assets, maintenance);
  if (n === 0) throw new RangeError('Se requiere n > 0');
  return assets / (n * (1 + maintenance));
};

/** Comisión: un porcentaje del efectivo con un mínimo fijo. */
export const commission = (value: number, rate: number, minimum = 0): number => {
  check(value, rate, minimum);
  return Math.max(minimum, rate * value);
};

/** Coste de ida y vuelta por el spread: comprar n al ask y vender n al bid. */
export const spreadCost = (bid: number, ask: number, n: number): number => {
  check(bid, ask, n);
  return n * (ask - bid);
};

/** Coste implícito de una orden frente a un precio de referencia, en € y en % del nocional n × ref. */
export const implicitCost = (side: Side, n: number, avgPrice: number, ref: number) => {
  check(n, avgPrice, ref);
  const euros = (side === 'buy' ? 1 : -1) * n * (avgPrice - ref);
  return { euros, pct: euros / (n * ref) };
};

export type Side = 'buy' | 'sell';
export type Level = { price: number; size: number };
export type Book = { bids: Level[]; asks: Level[] };

const sorted = (levels: Level[], desc: boolean): Level[] => {
  levels.forEach((l) => check(l.price, l.size));
  return [...levels].sort((a, b) => (desc ? b.price - a.price : a.price - b.price));
};

/** Mejor bid (precio más alto de compra) y mejor ask (más bajo de venta); null si el lado está vacío. */
export const bestBid = (book: Book): Level | null => sorted(book.bids, true)[0] ?? null;
export const bestAsk = (book: Book): Level | null => sorted(book.asks, false)[0] ?? null;

export const quote = (book: Book) => {
  const bid = bestBid(book);
  const ask = bestAsk(book);
  if (!bid || !ask) throw new RangeError('El libro necesita órdenes a ambos lados');
  return { bid: bid.price, ask: ask.price, spread: ask.price - bid.price, mid: (bid.price + ask.price) / 2 };
};

/**
 * Orden a mercado de `size` acciones: consume niveles del lado contrario del mejor al peor.
 * Si no hay profundidad suficiente se ejecuta en parte (`unfilled` > 0). `book` es el libro que queda.
 */
export const marketOrder = (book: Book, side: Side, size: number) => {
  check(size);
  const levels = side === 'buy' ? sorted(book.asks, false) : sorted(book.bids, true);
  const fills: Level[] = [];
  const left: Level[] = [];
  let remaining = size;
  for (const l of levels) {
    const take = Math.min(remaining, l.size);
    if (take > 0) fills.push({ price: l.price, size: take });
    if (l.size > take) left.push({ price: l.price, size: l.size - take });
    remaining -= take;
  }
  const filled = size - remaining;
  const total = fills.reduce((s, f) => s + f.price * f.size, 0);
  return {
    fills,
    filled,
    unfilled: remaining,
    total,
    avgPrice: filled > 0 ? total / filled : NaN,
    book: side === 'buy' ? { bids: book.bids, asks: left } : { bids: left, asks: book.asks },
  };
};

const depth = (buys: Level[], sells: Level[], p: number) => {
  [...buys, ...sells].forEach((l) => check(l.price, l.size));
  const demand = buys.reduce((s, l) => s + (l.price >= p ? l.size : 0), 0);
  const supply = sells.reduce((s, l) => s + (l.price <= p ? l.size : 0), 0);
  return { demand, supply };
};

/** Volumen que se cruza a precio p: min(compras con límite ≥ p, ventas con límite ≤ p). */
export const auctionVolume = (buys: Level[], sells: Level[], p: number): number => {
  const { demand, supply } = depth(buys, sells, p);
  return Math.min(demand, supply);
};

/**
 * Subasta (mercado call): precio que maximiza el volumen ejecutado. El volumen solo cambia en los
 * precios límite, así que basta probar esos. Empates: menor desequilibrio |demanda − oferta|, luego el precio más bajo.
 * ponytail: sin precio de referencia para el último desempate (la regla de BME lo usa).
 */
export const callAuction = (buys: Level[], sells: Level[]) => {
  const prices = [...new Set([...buys, ...sells].map((l) => l.price))].sort((a, b) => a - b);
  let best = { price: NaN, volume: 0, imbalance: Infinity };
  for (const p of prices) {
    const { demand, supply } = depth(buys, sells, p);
    const volume = Math.min(demand, supply);
    const imbalance = Math.abs(demand - supply);
    if (volume > best.volume || (volume === best.volume && volume > 0 && imbalance < best.imbalance)) {
      best = { price: p, volume, imbalance };
    }
  }
  return best;
};

/** OPI: efectivo bruto, comisión de colocación y neto. `greenShoe` = fracción extra vendida (p. ej. 0,15). */
export const ipoProceeds = (shares: number, offerPrice: number, feeRate: number, greenShoe = 0) => {
  check(shares, offerPrice, feeRate, greenShoe);
  const sold = shares * (1 + greenShoe);
  const gross = sold * offerPrice;
  const fees = feeRate * gross;
  return { shares: sold, gross, fees, net: gross - fees };
};

/** Rentabilidad inicial (infravaloración) y dinero dejado sobre la mesa. */
export const underpricing = (shares: number, offerPrice: number, firstClose: number) => {
  check(shares, offerPrice, firstClose);
  return { initialReturn: firstClose / offerPrice - 1, moneyLeft: shares * (firstClose - offerPrice) };
};

/** Book-building: el precio más alto al que la demanda acumulada (límite ≥ p) cubre la emisión; null si no se cubre. */
export const bookBuildingPrice = (demand: Level[], shares: number): number | null => {
  check(shares);
  let cum = 0;
  for (const l of sorted(demand, true)) {
    cum += l.size;
    if (cum >= shares) return l.price;
  }
  return null;
};

/**
 * Precio fijo: ratio de sobresuscripción y reparto a prorrata (cada uno recibe peticion × oferta / demanda total).
 * ponytail: sin redondeo a acciones enteras ni tramos mínimos.
 */
export const proRata = (requests: number[], shares: number) => {
  check(shares, ...requests);
  const demanded = requests.reduce((s, x) => s + x, 0);
  const k = demanded > shares ? shares / demanded : 1;
  return { oversubscription: demanded / shares, allocations: requests.map((x) => x * k) };
};

/** Book-building demand at a proposed offer price (limit bids at or above that price). */
export const ipoDemandAtPrice = (demand: Level[], offerPrice: number): number => {
  check(offerPrice);
  return depth(demand, [], offerPrice).demand;
};
