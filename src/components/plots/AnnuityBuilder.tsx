import { useState } from 'react';
import { Vector } from 'mafs';
import { PlotFrame, Label } from './PlotFrame';
import { useTweened } from './animation';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Segmented } from '../ui/controls';
import { Tex } from '../ui/Tex';
import { annuityClosedPV, annuityFlows, annuitySumPV, perpetuityClosedPV } from '../../lib/finance/annuities';
import { pv } from '../../lib/finance/timeValue';

const N_MAX = 20;
const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;
const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const nice = (v: number) => { const m = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / m) * m; };

type Timing = 'pos' | 'pre';

/** Annuity builder: each payment (yellow-green arrow) next to its present value (blue); the blue heights add up to VA. */
export default function AnnuityBuilder() {
  const [a, setA] = useState(100);
  const [r, setR] = useState(0.05);
  const [n, setN] = useState(10);
  const [g, setG] = useState(0);
  const [timing, setTiming] = useState<Timing>('pos');
  const due = timing === 'pre';
  const flows = annuityFlows(a, g, n, due);
  const yMax = useTweened(nice(Math.max(...flows.map((f) => f.amount))));
  const va = annuityClosedPV(a, r, g, n, due);
  const sum = annuitySumPV(a, r, g, n, due);
  const perp = perpetuityClosedPV(a, r, g, due);
  const step = n <= 10 ? 1 : n <= 15 ? 2 : 5;
  const xTicks = Array.from({ length: Math.floor(N_MAX / step) + 1 }, (_, i) => i * step);
  const dx = 0.17;

  return (
    <WidgetFrame
      title="Constructor de rentas"
      ariaLabel="Pagos de una renta como flechas verdes sobre una línea temporal y, junto a cada una, su valor actual como flecha azul más corta; la suma de las azules es el valor actual de la renta"
      plotHeight={260}
      plot={
        <PlotFrame x={[0, N_MAX]} y={[0, yMax]} height={260} xTicks={xTicks} yTicks={[0, yMax / 2, yMax]} formatY={(v) => String(Math.round(v))} xLabel="años" marginLeft={44} baseline={0}>
          {flows.map((f) => (
            <g key={f.t}>
              <Vector tail={[f.t - dx, 0]} tip={[f.t - dx, f.amount]} color="var(--c-return)" weight={3} />
              <Vector tail={[f.t + dx, 0]} tip={[f.t + dx, pv(f.amount, r, f.t)]} color="var(--c-pv)" weight={3} />
            </g>
          ))}
          <Label x={N_MAX} y={yMax} attach="sw" attachDistance={6} size={12} color="var(--text-muted)">verde: pago · azul: su valor actual</Label>
        </PlotFrame>
      }
      controls={
        <>
          <Slider label="Pago $A$ (€)" value={a} min={50} max={500} step={50} onChange={setA} format={(v) => `${v} €`} color="var(--c-fv)" />
          <Slider label="Tasa $\Rate{r}$" value={r} min={0.01} max={0.2} step={0.005} onChange={setR} format={pct} color="var(--c-rate)" />
          <Slider label="Pagos $n$" value={n} min={1} max={N_MAX} step={1} onChange={setN} color="var(--c-time)" />
          <Slider label="Crecimiento $g$" value={g} min={0} max={0.1} step={0.005} onChange={setG} format={pct} color="var(--c-return)" />
          <Segmented label="Cuándo se paga" value={timing} options={[{ value: 'pos', label: 'Final de año' }, { value: 'pre', label: 'Inicio de año' }]} onChange={setTiming} />
        </>
      }
      readout={
        <dl className="readout-grid">
          <dt>Fórmula</dt><dd data-testid="va">{euro(va)}</dd>
          <dt>Suma de azules</dt><dd data-testid="suma">{euro(sum)}</dd>
          <dt>Perpetuidad</dt><dd data-testid="perp">{perp === null ? <Tex>{'r \\le g'}</Tex> : euro(perp)}</dd>
        </dl>
      }
    />
  );
}
