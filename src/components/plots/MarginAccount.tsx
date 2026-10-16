import { useState } from 'react';
import { Line, Plot, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Segmented, Slider } from '../ui/controls';
import { isMarginCall, marginCallPriceLong, marginCallPriceShort, marginPurchase, shortSale } from '../../lib/finance/markets';
import { tradingAccount as a } from '../../data/trading';
import './trading.css';

const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
const pct = (n: number) => `${(100 * n).toFixed(2).replace('.', ',')} %`;

export default function MarginAccount() {
  const [mode, setMode] = useState<'long' | 'short'>('long');
  const [price, setPrice] = useState(a.initialPrice);
  const long = marginPurchase(a.shares, a.initialPrice, a.loan, price, a.loanRate);
  const short = shortSale(a.shares, a.initialPrice, a.initialShortMargin, price, a.dividend);
  const current = mode === 'long' ? long : short;
  const threshold = mode === 'long' ? marginCallPriceLong(a.shares, long.debt, a.maintenance) : marginCallPriceShort(a.shares, short.assets, a.maintenance);
  const curve = (p: number) => mode === 'long'
    ? marginPurchase(a.shares, a.initialPrice, a.loan, p, a.loanRate).marginPct
    : shortSale(a.shares, a.initialPrice, a.initialShortMargin, p, a.dividend).marginPct;
  const call = isMarginCall(current.marginPct, a.maintenance);
  return <WidgetFrame title="Cuenta de margen: compra o venta en corto" ariaLabel="Porcentaje de margen frente al precio, con línea de mantenimiento y precio umbral" plotHeight={280}
    plot={<PlotFrame x={[10, 100]} y={[-1.2, 1.5]} height={280} xTicks={[10, 30, 50, 70, 90]} yTicks={[-1, 0, 0.3, 1]}
      xLabel="Precio (€)" yLabel="Margen (%)" formatY={v => `${Math.round(100 * v)}`}>
      <Plot.OfX y={curve} domain={[10, 100]} color="var(--c-pv)" />
      <Line.Segment point1={[10, a.maintenance]} point2={[100, a.maintenance]} color="var(--c-risk)" style="dashed" />
      <Line.Segment point1={[threshold, -1.2]} point2={[threshold, 1.5]} color="var(--c-time)" style="dashed" />
      <Point x={price} y={current.marginPct} color={call ? 'var(--c-risk)' : 'var(--c-pv)'} />
    </PlotFrame>}
    controls={<div className="trading-controls">
      <Segmented label="Posición" value={mode} options={[{ value: 'long', label: 'Compra al margen' }, { value: 'short', label: 'Venta en corto' }]} onChange={setMode} />
      <Slider label="Precio actual (€)" value={price} min={10} max={100} step={0.1} format={euros} onChange={setPrice} />
      <Button onClick={() => { setMode('long'); setPrice(a.initialPrice); }}>Restablecer cuenta</Button>
    </div>}
    readout={<dl className="readout-grid">
      <dt>Capital inicial</dt><dd data-testid="initial">{euros(mode === 'long' ? long.initialEquity : short.initialMargin)}</dd>
      <dt>{mode === 'long' ? 'Deuda final' : 'Activos tras dividendo'}</dt><dd data-testid="debt-assets">{euros(mode === 'long' ? long.debt : short.assets)}</dd>
      <dt>Capital restante</dt><dd data-testid="equity">{euros(current.equity)}</dd>
      <dt>Margen actual</dt><dd data-testid="margin">{pct(current.marginPct)}</dd>
      <dt>Rentabilidad propia</dt><dd data-testid="return">{pct(mode === 'long' ? long.returnOnEquity : short.returnOnMargin)}</dd>
      <dt>Precio umbral</dt><dd data-testid="threshold">{euros(threshold)}</dd>
      <dt>Estado</dt><dd data-testid="call" className={call ? 'bad' : 'good'}>{call ? 'Llamada de margen' : 'Sin llamada'}</dd>
    </dl>}
    caption="Línea horizontal: mantenimiento del 30 %. Línea vertical: precio umbral. Foto al cierre del periodo: interés del 5 % en la compra; dividendo de 1 € en el corto. Sin comisiones, impuestos ni coste de préstamo de acciones. No simulamos liquidaciones previas." />;
}
