import { useState } from 'react';
import { Plot, Point } from 'mafs';
import { breakevens, strategyCost, strategyPayoff, strategyProfit } from '../../lib/finance/derivatives';
import { optionDefaults, optionStrategies, optionStrategyLegs, type OptionStrategy } from '../../data/optionStrategies';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Select, Slider } from '../ui/controls';

const num = (x: number) => (Object.is(x, -0) ? 0 : x).toFixed(2).replace('.', ',');
export default function OptionPayoffs() {
  const [strategy, setStrategy] = useState<OptionStrategy>('call');
  const [p, setInputs] = useState({ ...optionDefaults });
  const legs = optionStrategyLegs(strategy, p);
  const zeros = breakevens(legs);
  const payoff = strategyPayoff(legs, p.spot);
  const profit = strategyProfit(legs, p.spot);
  const range = [0, 200, ...legs.flatMap(l => l.type === 'stock' ? [] : [l.strike])];
  const values = range.flatMap(s => [strategyPayoff(legs, s), strategyProfit(legs, s)]);
  const yMin = Math.min(-20, ...values) - 10;
  const yMax = Math.max(20, ...values) + 10;
  const update = (key: keyof typeof p) => (value: number) => setInputs(previous => ({ ...previous, [key]: value }));

  return <WidgetFrame title="Construye el pago y resta el coste" ariaLabel="Pago bruto en azul y beneficio en verde frente al precio final. El punto marca el beneficio del escenario elegido."
    plotHeight={320}
    plot={<PlotFrame x={[0, 200]} y={[yMin, yMax]} height={320} xTicks={[0, 50, 100, 150, 200]}
      yTicks={[yMin + 10, 0, yMax - 10]} formatY={v => num(v)} baseline={0} marginLeft={62}
      xLabel="precio final S_T (€)" yLabel="importe (€)">
      <Plot.OfX y={s => strategyPayoff(legs, s)} domain={[0, 200]} color="var(--c-pv)" style="dashed" />
      <Plot.OfX y={s => strategyProfit(legs, s)} domain={[0, 200]} color="var(--c-return)" />
      <Point x={p.spot} y={profit} color={profit < 0 ? 'var(--c-risk)' : 'var(--c-return)'} />
    </PlotFrame>}
    controls={<div style={{ width: '100%', minWidth: 0 }}>
      <Select label="Estrategia" value={strategy} onChange={setStrategy} options={[...optionStrategies]} />
      <Slider label="Ejercicio central K (€)" min={80} max={120} value={p.strike} onChange={update('strike')} />
      <Slider label="Distancia entre ejercicios (€)" min={10} max={40} value={p.width} onChange={update('width')} />
      <Slider label="Prima call central (€)" min={0} max={12} step={0.5} value={p.call} onChange={update('call')} format={num} />
      <Slider label="Prima put central (€)" min={0} max={12} step={0.5} value={p.put} onChange={update('put')} format={num} />
      <Slider label="Prima de cada opción exterior (€)" min={0} max={6} step={0.5} value={p.outer} onChange={update('outer')} format={num} />
      <Slider label="Precio al vencimiento S_T (€)" min={0} max={200} value={p.spot} onChange={update('spot')} />
      <Button onClick={() => { setInputs({ ...optionDefaults }); setStrategy('call'); }}>Restablecer ejemplo</Button>
      <p>La acción se compra a 100 €. Cada prima es una entrada independiente. Solo se usan las primas de las patas mostradas.</p>
    </div>}
    readout={<div style={{ overflowWrap: 'anywhere' }}>
      <p>Trazo azul discontinuo: pago. Trazo verde continuo: beneficio.</p>
      <dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        <dt>Coste inicial firmado</dt><dd data-testid="option-cost">{num(strategyCost(legs))} €</dd>
        <dt>Pago bruto</dt><dd data-testid="option-payoff">{num(payoff)} €</dd>
        <dt>Beneficio</dt><dd data-testid="option-profit">{num(profit)} €</dd>
        <dt>Equilibrio: puntos</dt><dd data-testid="option-zeros">{zeros.points.length ? zeros.points.map(num).join('; ') + ' €' : 'Ninguno'}</dd>
        <dt>Equilibrio: tramos</dt><dd data-testid="option-intervals">{zeros.intervals.length ? zeros.intervals.map(i => `[${num(i.from)}; ${i.to === null ? '∞' : num(i.to)}] €`).join('; ') : 'Ninguno'}</dd>
      </dl>
      <p>Patas: cantidad positiva = compra; negativa = venta.</p>
      <ul data-testid="option-legs" style={{ paddingLeft: '1.2rem' }}>{legs.map((leg, index) => <li key={index}>
        {leg.type === 'stock' ? `${leg.quantity} acción · compra ${num(leg.entryPrice)} €`
          : `${leg.quantity} ${leg.type} · K ${num(leg.strike)} € · prima ${num(leg.premium)} €`}
      </li>)}</ul>
    </div>}
    caption="Opciones europeas con igual vencimiento, por unidad del activo. Sin capitalizar primas, dividendos, comisiones ni impuestos. Las primas elegidas no son precios estimados ni garantizan ausencia de arbitraje. La gráfica termina en el precio mostrado; el riesgo puede continuar fuera de ella." />;
}
