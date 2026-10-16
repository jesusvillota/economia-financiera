import { useState } from 'react';
import { Plot, Point, Line } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Slider } from '../ui/controls';
import { bondAtSettlement, cleanPrice, priceFromCashFlows, yieldFromCashFlows } from '../../lib/finance/bonds';
import { chapter17Bond, chapter17Yield, previousCoupon17, nextCoupon17, settlementDate17 } from '../../data/bond17';

const number = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euro = (v: number) => `${number(v)} €`;

export default function BondExplorer() {
  const [coupon, setCoupon] = useState(chapter17Bond.couponRate * 100);
  const [maturity, setMaturity] = useState(chapter17Bond.maturity);
  const [yieldPct, setYield] = useState(chapter17Yield * 100);
  const [day, setDay] = useState(0);
  const bond = { ...chapter17Bond, couponRate: coupon / 100, maturity };
  const s = bondAtSettlement(bond, previousCoupon17, settlementDate17(day), nextCoupon17);
  const priceAt = (y: number) => priceFromCashFlows(s.flows, y / 100);
  const dirty = priceAt(yieldPct);
  const clean = cleanPrice(dirty, s.accrued);
  const recovered = yieldFromCashFlows(s.flows, dirty);
  const top = Math.ceil(priceAt(0) / 100) * 100 + 100;
  const bottom = Math.max(0, Math.floor(priceAt(12) / 100) * 100 - 100);
  const ticks = Array.from({ length: 4 }, (_, i) => bottom + (top - bottom) * i / 3);
  const date = settlementDate17(day).toLocaleDateString('es-ES', { timeZone: 'UTC' });

  return <WidgetFrame title="El precio de los cobros pendientes"
    ariaLabel="Curva decreciente del precio sucio en euros frente a la TIR anual. Un punto marca tu elección."
    plotHeight={300}
    plot={<PlotFrame x={[0, 12]} y={[bottom, top]} height={300} xTicks={[0, 3, 6, 9, 12]}
      yTicks={ticks} formatY={(v) => String(Math.round(v))} xLabel="TIR anual (%)" yLabel="Precio (€)" marginLeft={54}>
      <Line.Segment point1={[0, chapter17Bond.face]} point2={[12, chapter17Bond.face]} color="var(--c-fv)" style="dashed" />
      <Plot.OfX y={priceAt} domain={[0, 12]} color="var(--c-pv)" />
      <Point x={yieldPct} y={dirty} color="var(--c-rate)" />
    </PlotFrame>}
    controls={<div style={{ display: 'grid', gap: '0.8rem', width: '100%' }}>
      <Slider label="Cupón anual" value={coupon} min={0} max={10} step={1} onChange={setCoupon} format={(v) => `${v} %`} />
      <Slider label="Vencimiento desde el último cupón" value={maturity} min={1} max={20} onChange={setMaturity} format={(v) => `${v} años`} color="var(--c-time)" />
      <Slider label="TIR anual" value={yieldPct} min={0} max={12} step={0.5} onChange={setYield} format={(v) => `${number(v)} %`} color="var(--c-rate)" />
      <Slider label="Días desde el último cupón" value={day} min={0} max={364} onChange={setDay} color="var(--c-time)" />
      <Button onClick={() => { setCoupon(chapter17Bond.couponRate * 100); setMaturity(chapter17Bond.maturity); setYield(chapter17Yield * 100); setDay(0); }}>Restablecer</Button>
    </div>}
    readout={<dl className="readout-grid">
      <dt>Nominal</dt><dd data-testid="face">{euro(bond.face)}</dd>
      <dt>Cupón por pago</dt><dd data-testid="coupon">{euro(s.coupon)}</dd>
      <dt>Liquidación</dt><dd data-testid="settlement">{date}</dd>
      <dt>Precio sucio (pagas)</dt><dd data-testid="dirty">{euro(dirty)}</dd>
      <dt>Cupón corrido</dt><dd data-testid="accrued">{euro(s.accrued)}</dd>
      <dt>Precio limpio (cotización)</dt><dd data-testid="clean">{euro(clean)}</dd>
      <dt>TIR recuperada del precio</dt><dd data-testid="ytm">{number(recovered * 100)} %</dd>
    </dl>}
    caption="Azul: precio sucio; naranja: elección; amarillo discontinuo: nominal. Pagos anuales. Liquidación dentro del periodo del 1/1/2026 al 1/1/2027 (365 días), Actual/Actual. Vencimiento medido desde el último cupón. Sin impago, rescate anticipado, impuestos ni costes. Al mover la fecha se acortan los plazos de todos los cobros." />;
}
