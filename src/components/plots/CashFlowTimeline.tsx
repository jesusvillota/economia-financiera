import { useEffect, useState } from 'react';
import { Line, Point, Vector, useMovablePoint } from 'mafs';
import { PlotFrame, Label } from './PlotFrame';
import { useTweened } from './animation';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Button } from '../ui/controls';
import { Tex } from '../ui/Tex';
import { flowsFV, flowsPV, type Flow } from '../../lib/finance/curves';
import { pv } from '../../lib/finance/timeValue';

const HORIZON = 5;
const AMOUNT_MAX = 150;
const AMOUNT_STEP = 10;
const DEFAULT_FLOWS: Flow[] = [{ t: 0, amount: -100 }, { t: 2, amount: 40 }, { t: 3, amount: 40 }, { t: 5, amount: 60 }];

const colorOf = (amount: number) => (amount >= 0 ? 'var(--c-return)' : 'var(--c-risk)');
const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;

/** Draggable arrow tip: x snaps to whole years, y to steps of 10 €. */
function FlowHandle({ flow, onChange }: { flow: Flow; onChange: (f: Flow) => void }) {
  const p = useMovablePoint([flow.t, flow.amount], {
    constrain: ([x, y]) => [
      Math.min(Math.max(Math.round(x), 0), HORIZON),
      Math.min(Math.max(Math.round(y / AMOUNT_STEP) * AMOUNT_STEP, -AMOUNT_MAX), AMOUNT_MAX),
    ],
    color: colorOf(flow.amount),
  });
  useEffect(() => {
    if (p.x !== flow.t || p.y !== flow.amount) onChange({ t: p.x, amount: p.y });
  }, [p.x, p.y]);
  return <g role="group" aria-label={`Flujo en el año ${flow.t}: ${euro(flow.amount)}. Usa las flechas para cambiar la fecha y el importe.`}>{p.element}</g>;
}

/** Cash-flow timeline: drag arrows, change the rate, slide every flow to t = 0. */
export default function CashFlowTimeline() {
  const [flows, setFlows] = useState<Flow[]>(DEFAULT_FLOWS);
  const [r, setR] = useState(0.08);
  const [discounted, setDiscounted] = useState(false);
  const d = useTweened(discounted ? 1 : 0);
  const va = flowsPV(r, flows);
  const vf = flowsFV(r, flows, HORIZON);
  const moving = d > 0.001;

  return (
    <WidgetFrame
      title="Línea temporal de flujos"
      ariaLabel="Línea temporal con flechas hacia arriba para los cobros y hacia abajo para los pagos; un botón los descuenta a t = 0"
      plotHeight={260}
      plot={
        <PlotFrame x={[0, HORIZON]} y={[-AMOUNT_MAX, AMOUNT_MAX]} height={260} xTicks={[0, 1, 2, 3, 4, 5]} yTicks={[-100, 0, 100]} xLabel="años" baseline={0}>
          {flows.map((f, i) => {
            const now = pv(f.amount, r, f.t);
            const x = f.t * (1 - d);
            const y = f.amount + (now - f.amount) * d;
            return (
              <g key={i}>
                {moving && <Line.Segment point1={[f.t, 0]} point2={[f.t, f.amount]} color={colorOf(f.amount)} weight={1} opacity={0.25} style="dashed" />}
                <Vector tail={[x, 0]} tip={[x, y]} color={moving ? 'var(--c-pv)' : colorOf(f.amount)} weight={3} />
                {!moving && !discounted && <FlowHandle flow={f} onChange={(nf) => setFlows((fs) => fs.map((g, j) => (j === i ? nf : g)))} />}
              </g>
            );
          })}
          {discounted && !moving && <Point x={0} y={0} color="var(--c-pv)" />}
          <Label x={0} y={AMOUNT_MAX} attach="e" attachDistance={6} size={12} color="var(--text-muted)">{discounted ? 'valores en t = 0' : 'arrastra las puntas'}</Label>
        </PlotFrame>
      }
      controls={
        <>
          <Slider label="Tasa $\Rate{r}$" value={r} min={0} max={0.2} step={0.005} onChange={setR} format={(v) => `${(v * 100).toFixed(1).replace('.', ',')} %`} color="var(--c-rate)" />
          <Button onClick={() => setDiscounted((v) => !v)}>{discounted ? 'Volver a las fechas' : 'Descontar a t = 0'}</Button>
        </>
      }
      readout={
        <dl className="readout-grid">
          <dt><Tex>{'\\VA'}</Tex></dt><dd data-testid="va">{euro(va)}</dd>
          <dt><Tex>{`\\VF\\ (t=${HORIZON})`}</Tex></dt><dd data-testid="vf">{euro(vf)}</dd>
        </dl>
      }
    />
  );
}
