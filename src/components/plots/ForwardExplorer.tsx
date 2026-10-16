import { useState } from 'react';
import { Line, Plot, Point } from 'mafs';
import { discountFactor, forwardPrice, forwardValue, forwardPayoff, type Position } from '../../lib/finance/derivatives';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Segmented, Button } from '../ui/controls';

const num = (x: number) => x.toFixed(2).replace('.', ',');

export default function ForwardExplorer() {
  const [spot, setSpot] = useState(50);
  const [delivery, setDelivery] = useState(48);
  const [rate, setRate] = useState(4);
  const [remaining, setRemaining] = useState(1.5);
  const [position, setPosition] = useState<Position>('long');
  const value = (s: number) => forwardValue(s, delivery, rate / 100, remaining, position);
  const reset = () => { setSpot(50); setDelivery(48); setRate(4); setRemaining(1.5); setPosition('long'); };
  return <WidgetFrame title="Precio nuevo y valor del contrato firmado" ariaLabel="Valor del forward frente al contado actual. La recta azul es el valor actual; la amarilla es el pago si vence hoy."
    plotHeight={300}
    plot={<PlotFrame x={[20, 80]} y={[-65, 65]} height={300} xTicks={[20, 40, 60, 80]} yTicks={[-60, -30, 0, 30, 60]} xLabel="contado Sₜ (€/unidad)" yLabel="valor (€/unidad)" baseline={0}>
      <Plot.OfX y={value} color="var(--c-pv)" />
      <Plot.OfX y={(s) => forwardPayoff(s, delivery, position)} color="var(--c-fv)" />
      <Line.Segment point1={[spot, 0]} point2={[spot, value(spot)]} color="var(--c-time)" />
      <Point x={spot} y={value(spot)} color="var(--c-pv)" />
    </PlotFrame>}
    controls={<>
      <Slider label="Contado actual Sₜ (€/unidad)" min={20} max={80} value={spot} onChange={setSpot} format={num} />
      <Slider label="Entrega pactada K (€/unidad)" min={20} max={80} value={delivery} onChange={setDelivery} format={num} />
      <Slider label="Tipo efectivo anual (%)" min={0} max={10} step={0.5} value={rate} onChange={setRate} format={num} />
      <Slider label="Plazo restante (años)" min={0} max={2} step={0.25} value={remaining} onChange={setRemaining} format={num} />
      <Segmented label="Posición del forward" value={position} onChange={setPosition} options={[{ value: 'long', label: 'Larga: comprar' }, { value: 'short', label: 'Corta: vender' }]} />
      <Button onClick={reset}>Restablecer forward</Button>
    </>}
    readout={<dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
      <dt>Precio forward nuevo Fₜ,T</dt><dd data-testid="forward-price">{num(forwardPrice(spot, rate / 100, remaining))} €</dd>
      <dt>Descuento de K</dt><dd data-testid="forward-discount">{num(delivery * discountFactor(rate / 100, remaining))} €</dd>
      <dt>Valor actual (azul)</dt><dd data-testid="forward-value">{num(value(spot))} €</dd>
      <dt>Pago si vence hoy (amarillo)</dt><dd data-testid="forward-payoff">{num(forwardPayoff(spot, delivery, position))} €</dd>
    </dl>}
    caption="Importes por unidad. K permanece fijo al cambiar el contado. Sin dividendos, costes, riesgo de impago ni garantías. El contado futuro todavía es desconocido." />;
}
