import { useState } from 'react';
import { Line, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Slider } from '../ui/controls';
import { chapter14IPO as example } from '../../data/ipo';
import { bookBuildingPrice, ipoDemandAtPrice, ipoProceeds, underpricing } from '../../lib/finance/markets';

const number = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euro = (v: number) => `${number(v)} €`;
const prices = [12, 14, 16, 18, 20];

export default function BookBuilding() {
  const [price, setPrice] = useState(example.offerPrice);
  const [close, setClose] = useState(example.firstClose);
  const demand = ipoDemandAtPrice(example.demand, price);
  const covered = demand >= example.shares;
  const proceeds = ipoProceeds(covered ? example.shares : 0, price, example.feeRate);
  const initial = underpricing(example.shares, price, close);
  const ceiling = bookBuildingPrice(example.demand, example.shares);

  return <WidgetFrame title="Elige el precio de Brisa Sensores"
    ariaLabel="Demanda acumulada por precio y oferta fija de mil acciones. La demanda baja en escalones al subir el precio."
    plotHeight={290}
    plot={<PlotFrame x={[11, 21]} y={[0, 3400]} height={290}
      xTicks={prices} yTicks={[0, 1000, 2000, 3000]} xLabel="Precio (€)" yLabel="Acciones">
      {prices.slice(0, -1).map((p, i) => {
        const next = prices[i + 1];
        const here = ipoDemandAtPrice(example.demand, p);
        const after = ipoDemandAtPrice(example.demand, next);
        return <g key={p}>
          <Line.Segment point1={[p, here]} point2={[p, after]} color="var(--c-pv)" />
          <Line.Segment point1={[p, after]} point2={[next, after]} color="var(--c-pv)" />
        </g>;
      })}
      <Line.Segment point1={[11, example.shares]} point2={[21, example.shares]} color="var(--c-fv)" style="dashed" />
      <Point x={price} y={demand} color="var(--c-pv)" />
    </PlotFrame>}
    controls={<div style={{ display: 'grid', gap: '0.8rem', width: '100%' }}>
      <Slider label="Precio de oferta" value={price} min={12} max={20} step={1} onChange={setPrice} format={euro} />
      <Slider label="Cierre hipotético del primer día" value={close} min={12} max={24} step={1} onChange={setClose} format={euro} color="var(--c-return)" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      <Button onClick={() => { if (ceiling !== null) setPrice(ceiling); }}>Precio que cubre la oferta</Button>
      <Button onClick={() => { setPrice(example.offerPrice); setClose(example.firstClose); }}>Restablecer</Button>
      </div>
    </div>}
    readout={<dl className="readout-grid">
      <dt>Demanda (acciones)</dt><dd data-testid="demand">{demand}</dd>
      <dt>Oferta (acciones)</dt><dd data-testid="supply">{example.shares}</dd>
      <dt>Estado</dt><dd data-testid="covered">{covered ? 'Cubierta' : 'No cubierta: sin venta'}</dd>
      <dt>Precio máximo que cubre</dt><dd data-testid="ceiling">{ceiling === null ? 'Ninguno' : euro(ceiling)}</dd>
      <dt>Ingreso bruto</dt><dd data-testid="gross">{euro(proceeds.gross)}</dd>
      <dt>Comisión de colocación</dt><dd data-testid="fees">{euro(proceeds.fees)}</dd>
      <dt>Ingreso neto</dt><dd data-testid="net">{euro(proceeds.net)}</dd>
      <dt>Rentabilidad inicial</dt><dd data-testid="initial-return">{covered ? `${number(initial.initialReturn * 100)} %` : 'No procede'}</dd>
      <dt>Dinero sobre la mesa</dt><dd data-testid="money-left">{covered ? euro(initial.moneyLeft) : 'No procede'}</dd>
    </dl>}
    caption="Azul: demanda acumulada; amarillo discontinuo: oferta. Comisión fija del 4 %. Sin impuestos, otros costes ni acciones adicionales. Una oferta no cubierta se retira. El cierre es un supuesto independiente del precio elegido." />;
}
