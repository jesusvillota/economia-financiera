import { useState } from 'react';
import { Line, Plot, Point } from 'mafs';
import { PlotFrame, Label } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Segmented } from '../ui/controls';
import { Tex } from '../ui/Tex';
import { crossoverRate, irr, npv, payback } from '../../lib/finance/appraisal';
import { convencional, dosTir, lento, rapido } from '../../lib/finance/examples';

const R_MAX = 0.4;

interface Series { name: string; flows: number[]; color: string }
const PRESETS = {
  conv: { label: 'Convencional', series: [{ name: '', flows: convencional, color: 'var(--c-pv)' }] },
  ab: { label: 'Rápido y lento', series: [{ name: 'A (rápido)', flows: rapido, color: 'var(--c-pv)' }, { name: 'B (lento)', flows: lento, color: 'var(--c-fv)' }] },
  dos: { label: 'Dos TIR', series: [{ name: '', flows: dosTir, color: 'var(--c-pv)' }] },
} satisfies Record<string, { label: string; series: Series[] }>;
type PresetKey = keyof typeof PRESETS;

const num = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
const pct = (v: number) => `${num(v * 100, 2)} %`;
const nice = (v: number) => (Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v));

/** Perfil de VAN: la curva VAN(r) de uno o dos proyectos, con las TIR marcadas y la tasa arrastrable. */
export default function NpvProfile() {
  const [key, setKey] = useState<PresetKey>('conv');
  const [r, setR] = useState(0.1);
  const { series } = PRESETS[key];
  const samples = series.flatMap((s) => Array.from({ length: 41 }, (_, i) => npv((i * R_MAX) / 40, s.flows)));
  const span = Math.max(...samples) - Math.min(...samples);
  const m = 10 ** Math.floor(Math.log10(span));
  const yMax = Math.ceil(Math.max(...samples, 0) / m) * m;
  const yMin = Math.floor(Math.min(...samples, 0) / m) * m;
  const cruce = series.length === 2 ? crossoverRate(series[0].flows, series[1].flows) : null;

  return (
    <WidgetFrame
      title="Perfil del VAN"
      ariaLabel="Curva del valor actual neto en función de la tasa de descuento, con la TIR marcada donde la curva corta el eje horizontal y un punto que sigue la tasa elegida"
      plotHeight={260}
      plot={
        <PlotFrame x={[0, R_MAX]} y={[yMin, yMax]} height={260} xTicks={[0, 0.1, 0.2, 0.3, 0.4]} yTicks={[...new Set([yMin, 0, yMax])]} formatX={(v) => `${Math.round(v * 100)} %`} formatY={(v) => String(nice(v)).replace('.', ',')} xLabel="tasa r" yLabel="VAN (€)" baseline={0} marginLeft={52}>
          {series.map((s, i) => (
            <g key={i}>
              <Plot.OfX domain={[0, R_MAX]} y={(x) => npv(x, s.flows)} color={s.color} weight={3} />
              {irr(s.flows).roots.filter((x) => x >= 0 && x <= R_MAX).map((x) => (
                <g key={x}>
                  <Point x={x} y={0} color="var(--c-rate)" />
                  <Label x={x} y={0} attach="n" attachDistance={10} size={12} color="var(--c-rate)">{`TIR ${pct(x)}`}</Label>
                </g>
              ))}
              <Point x={r} y={npv(r, s.flows)} color={s.color} />
            </g>
          ))}
          <Line.Segment point1={[r, yMin]} point2={[r, yMax]} color="var(--c-rate)" weight={1.5} style="dashed" />
          {cruce !== null && cruce <= R_MAX && <Line.Segment point1={[cruce, yMin]} point2={[cruce, yMax]} color="var(--c-time)" weight={1.5} style="dashed" />}
        </PlotFrame>
      }
      controls={
        <>
          <Segmented label="Proyecto" value={key} onChange={setKey} options={(Object.keys(PRESETS) as PresetKey[]).map((k) => ({ value: k, label: PRESETS[k].label }))} />
          <Slider label="Tasa de descuento $\Rate{r}$" value={r} min={0} max={R_MAX} step={0.005} onChange={setR} format={pct} color="var(--c-rate)" />
        </>
      }
      readout={
        <dl className="readout-grid">
          {series.map((s, i) => {
            const van = npv(r, s.flows);
            const { roots } = irr(s.flows);
            const pb = payback(s.flows);
            return [
              <dt key={`a${i}`}><Tex>{'\\VAN'}</Tex> {s.name}</dt>,
              <dd key={`b${i}`} data-testid={`van-${i}`}>{num(van)} € ({van > 0 ? 'acepta' : van < 0 ? 'rechaza' : 'indiferente'})</dd>,
              <dt key={`c${i}`}><Tex>{'\\TIR'}</Tex> {s.name}</dt>,
              <dd key={`d${i}`} data-testid={`tir-${i}`}>{roots.length ? roots.map(pct).join(' y ') : '—'}</dd>,
              <dt key={`e${i}`}>Payback {s.name}</dt>,
              <dd key={`f${i}`} data-testid={`payback-${i}`}>{pb === null ? 'no se recupera' : `${num(pb)} años`}</dd>,
            ];
          })}
          {cruce !== null && (<><dt>Cruce</dt><dd data-testid="cruce">{pct(cruce)}</dd></>)}
        </dl>
      }
    />
  );
}
