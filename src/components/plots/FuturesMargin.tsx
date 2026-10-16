import { useState } from 'react';
import { Line, Point } from 'mafs';
import { futuresMarginAccount, seededFuturesPrices, type Position } from '../../lib/finance/derivatives';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Segmented, Button } from '../ui/controls';

const num = (x: number) => x.toFixed(2).replace('.', ',');
const DEFAULT_SEED = 2710;

export default function FuturesMargin() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [position, setPosition] = useState<Position>('short');
  const [contracts, setContracts] = useState(2);
  const [maintenance, setMaintenance] = useState(120);
  const [day, setDay] = useState(2);
  const prices = seededFuturesPrices(seed);
  const account = futuresMarginAccount({ prices, position, contracts, multiplier: 10, initialMargin: 200, maintenanceMargin: maintenance });
  const row = account.days[day - 1];
  const low = Math.min(0, ...account.days.map((d) => d.balanceBeforeCall)) - 40;
  const high = Math.max(240, ...account.days.map((d) => d.balance)) + 40;
  const balances = [200, ...account.days.map((d) => d.balance)];
  return <>
    <WidgetFrame title="Futuros: el efectivo llega cada día" ariaLabel="Saldo de garantías después de reponer, con puntos rojos antes de cada reposición y línea de mantenimiento. La tabla detalla todos los días."
      plotHeight={300}
      plot={<PlotFrame x={[0, 4]} y={[low, high]} height={300} xTicks={[0, 1, 2, 3, 4]} yTicks={[0, 120, 200, high]} xLabel="día" yLabel="saldo total (€)" baseline={0}>
        <Line.Segment point1={[0, maintenance]} point2={[4, maintenance]} color="var(--c-risk)" style="dashed" />
        {account.days.map((d) => <Line.Segment key={d.day} point1={[d.day - 1, balances[d.day - 1]]} point2={[d.day, d.balance]} color="var(--c-pv)" />)}
        {account.days.map((d) => <Point key={d.day} x={d.day} y={d.balanceBeforeCall} color={d.marginCall ? 'var(--c-risk)' : 'var(--c-pv)'} />)}
        <Point x={day} y={row.balance} color="var(--c-fv)" />
      </PlotFrame>}
      controls={<>
        <Segmented label="Posición del futuro" value={position} onChange={setPosition} options={[{ value: 'long', label: 'Larga' }, { value: 'short', label: 'Corta' }]} />
        <Slider label="Contratos" min={1} max={4} value={contracts} onChange={setContracts} />
        <Slider label="Mantenimiento total (€)" min={0} max={200} step={20} value={maintenance} onChange={setMaintenance} />
        <Slider label="Día seleccionado" min={1} max={4} value={day} onChange={setDay} />
        <Button onClick={() => { setSeed((s) => s + 1); }}>Otra trayectoria</Button>
        <Button onClick={() => { setSeed(DEFAULT_SEED); setPosition('short'); setContracts(2); setMaintenance(120); setDay(2); }}>Restablecer futuros</Button>
      </>}
      readout={<dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
        <dt>Semilla reproducible</dt><dd data-testid="futures-seed">{seed}</dd>
        <dt>Liquidación (€/unidad)</dt><dd data-testid="futures-price">{num(row.price)} €</dd>
        <dt>Variación del día</dt><dd data-testid="futures-variation">{num(row.variationMargin)} €</dd>
        <dt>Antes de reponer</dt><dd data-testid="futures-before">{num(row.balanceBeforeCall)} €</dd>
        <dt>Reposición del día</dt><dd data-testid="futures-call">{num(row.marginCall)} €</dd>
        <dt>Saldo (punto amarillo)</dt><dd data-testid="futures-balance">{num(row.balance)} €</dd>
        <dt>Ganancia total de la trayectoria</dt><dd data-testid="futures-gain">{num(account.totalGain)} €</dd>
      </dl>}
      caption="Margen inicial total: 200 €. Multiplicador: 10 unidades por contrato. Mantenimiento total fijo al variar contratos: experimento, no regla de un mercado. Sin retiradas, intereses ni comisiones. Línea roja: llamada solo por debajo." />
    <div style={{ overflowX: 'auto', maxWidth: '100%' }} tabIndex={0} role="region" aria-label="Detalle diario de garantías">
      <table data-testid="futures-table">
        <caption>Trayectoria completa; apertura: {num(prices[0])} €/unidad</caption>
        <thead><tr><th>Día</th><th>Precio (€/unidad)</th><th>Variación (€)</th><th>Antes (€)</th><th>Reposición (€)</th><th>Saldo (€)</th></tr></thead>
        <tbody>{account.days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{num(d.price)}</td><td>{num(d.variationMargin)}</td><td>{num(d.balanceBeforeCall)}</td><td>{num(d.marginCall)}</td><td>{num(d.balance)}</td></tr>)}</tbody>
      </table>
    </div>
  </>;
}
