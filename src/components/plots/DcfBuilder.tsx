import { useState } from 'react';
import { Polygon } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { useTweened } from './animation';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { discountedCashFlow, enterpriseToEquity, pricePerShare, terminalValue, wacc } from '../../lib/finance/valuation';

const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;

/** FCFF and terminal bars share today's units; bridge debt is independent of target WACC weights. */
export default function DcfBuilder() {
  const [flows, setFlows] = useState([80, 90, 100]);
  const [ke, setKe] = useState(0.12);
  const [g, setG] = useState(0.02);
  const [debt, setDebt] = useState(300);
  const [cash, setCash] = useState(50);
  const r = wacc(60, 40, ke, 0.06, 0.25);
  const valid = r > g;
  const terminal = valid ? terminalValue(flows[2], r, g) : null;
  const bars = flows.map((_, i) => discountedCashFlow(flows.map((v, j) => i === j ? v : 0), r));
  const terminalPV = terminal === null ? null : discountedCashFlow([0, 0, 0], r, terminal);
  const enterprise = terminal === null ? null : discountedCashFlow(flows, r, terminal);
  const equity = enterprise === null ? null : enterpriseToEquity(enterprise, debt, cash);
  const yMax = useTweened(Math.max(100, ...bars, terminalPV ?? 0) * 1.15);
  const plotted = [...bars, terminalPV ?? 0];

  return <WidgetFrame
    title="Constructor DCF: del negocio a la acción"
    ariaLabel="Barras en euros de hoy: FCFF de cada año en azul y valor terminal descontado en amarillo. Debajo, puente del negocio al capital propio."
    plotHeight={280}
    plot={<PlotFrame x={[0.5, 4.5]} y={[0, yMax]} height={280} xTicks={[1, 2, 3, 4]} yTicks={[0, yMax / 2, yMax]} formatX={(v) => v === 4 ? 'VT' : `Año ${v}`} formatY={(v) => String(Math.round(v))} yLabel="€ de hoy" marginLeft={55}>
      {plotted.map((value, i) => <Polygon key={i} points={[[i + 0.75, 0], [i + 1.25, 0], [i + 1.25, value], [i + 0.75, value]]} color={i === 3 ? 'var(--c-fv)' : 'var(--c-pv)'} fillOpacity={0.65} />)}
    </PlotFrame>}
    controls={<>
      {flows.map((value, i) => <Slider key={i} label={`FCFF año ${i + 1} (€)`} value={value} min={20} max={200} step={10} format={euro} onChange={(next) => setFlows(flows.map((v, j) => i === j ? next : v))} />)}
      <Slider label="Coste propio $\ke$" value={ke} min={0.06} max={0.2} step={0.005} format={pct} onChange={setKe} color="var(--c-rate)" />
      <Slider label="Crecimiento terminal $g$" value={g} min={0} max={0.06} step={0.005} format={pct} onChange={setG} color="var(--c-return)" />
      <Slider label="Deuda actual (€)" value={debt} min={0} max={2000} step={50} format={euro} onChange={setDebt} color="var(--c-risk)" />
      <Slider label="Caja excedente (€)" value={cash} min={0} max={200} step={10} format={euro} onChange={setCash} />
    </>}
    readout={<>
      <dl className="readout-grid">
        <dt>WACC</dt><dd data-testid="wacc">{pct(r)}</dd>
        {bars.map((value, i) => <div key={i} style={{ display: 'contents' }}><dt>VA año {i + 1}</dt><dd data-testid={`pv${i + 1}`}>{euro(value)}</dd></div>)}
        <dt>VT al final</dt><dd data-testid="terminal">{terminal === null ? 'No converge' : euro(terminal)}</dd>
        <dt>VA del VT</dt><dd data-testid="terminal-pv">{terminalPV === null ? 'No converge' : euro(terminalPV)}</dd>
        <dt>Negocio</dt><dd data-testid="enterprise">{enterprise === null ? 'No converge' : euro(enterprise)}</dd>
        <dt>+ Caja</dt><dd data-testid="cash">{euro(cash)}</dd>
        <dt>− Deuda</dt><dd data-testid="debt">{euro(debt)}</dd>
        <dt>Capital propio</dt><dd data-testid="equity">{equity === null ? 'No converge' : euro(equity)}</dd>
        <dt>Por acción</dt><dd data-testid="price">{equity === null ? 'No converge' : euro(pricePerShare(equity, 100))}</dd>
      </dl>
      {!valid && <p role="status">Necesitas WACC mayor que g. La perpetuidad no converge; la barra terminal se oculta.</p>}
      {equity !== null && equity < 0 && <p role="status">El puente da un residual negativo. No es un precio negociable: este modelo omite la responsabilidad limitada.</p>}
    </>}
    caption="Azul: FCFF descontados. Amarillo: continuidad desde el cuarto año. Pesos objetivo: 60 % propio y 40 % deuda; coste de deuda 6 %, impuesto 25 % y 100 acciones. La deuda del puente no recalcula esos pesos."
  />;
}
