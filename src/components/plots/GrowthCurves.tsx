import { useState } from 'react';
import { Line, Plot, Point, Polygon } from 'mafs';
import { PlotFrame, Label } from './PlotFrame';
import { useTweened } from './animation';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { Tex } from '../ui/Tex';
import { compoundGrowth, doublingTime, rule72, simpleGrowth } from '../../lib/finance/curves';

const VA = 100;
const SAMPLES = 40;
const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;
const nice = (v: number) => { const m = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / m / 2) * 2 * m; };

/** Simple vs compound growth with the gap shaded and the doubling time marked. */
export default function GrowthCurves() {
  const [r, setR] = useState(0.08);
  const [n, setN] = useState(20);
  const [k, setK] = useState(1);
  const compoundEnd = compoundGrowth(VA, r, k, n);
  const yMax = useTweened(nice(Math.max(compoundEnd, simpleGrowth(VA, r, n), 2 * VA)));
  const tDouble = doublingTime(r, k);
  const t72 = rule72(r);
  const ts = Array.from({ length: SAMPLES + 1 }, (_, i) => (i * n) / SAMPLES);
  const gap = [...ts.map((t) => [t, compoundGrowth(VA, r, k, t)] as [number, number]), ...[...ts].reverse().map((t) => [t, simpleGrowth(VA, r, t)] as [number, number])];
  const step = n <= 10 ? 2 : n <= 20 ? 5 : 10;
  const xTicks = Array.from({ length: Math.floor(n / step) + 1 }, (_, i) => i * step);

  return (
    <WidgetFrame
      title="Interés simple frente a compuesto"
      ariaLabel="Curvas del capital de 100 euros con interés simple y compuesto, con la diferencia sombreada y el punto en que el capital se duplica"
      plotHeight={260}
      plot={
        <PlotFrame x={[0, n]} y={[0, yMax]} height={260} xTicks={xTicks} yTicks={[0, yMax / 2, yMax]} formatY={(v) => String(Math.round(v))} xLabel="años" marginLeft={44}>
          <Polygon points={gap} color="var(--c-fv)" weight={0} fillOpacity={0.18} strokeStyle="solid" />
          <Plot.OfX domain={[0, n]} y={(t) => simpleGrowth(VA, r, t)} color="var(--c-pv)" weight={3} />
          <Plot.OfX domain={[0, n]} y={(t) => compoundGrowth(VA, r, k, t)} color="var(--c-fv)" weight={3} />
          {tDouble !== null && tDouble <= n && (
            <>
              <Line.Segment point1={[tDouble, 0]} point2={[tDouble, 2 * VA]} color="var(--c-time)" weight={1.5} style="dashed" />
              <Point x={tDouble} y={2 * VA} color="var(--c-time)" />
              <Label x={tDouble} y={2 * VA} attach="nw" attachDistance={8} size={12} color="var(--c-time)">2×</Label>
            </>
          )}
        </PlotFrame>
      }
      controls={
        <>
          <Slider label="Tasa $\Rate{r}$" value={r} min={0.005} max={0.2} step={0.005} onChange={setR} format={pct} color="var(--c-rate)" />
          <Slider label="Años $n$" value={n} min={5} max={40} step={5} onChange={setN} color="var(--c-time)" />
          <Slider label="Capitalizaciones al año $k$" value={k} min={1} max={12} step={1} onChange={setK} color="var(--c-fv)" />
        </>
      }
      readout={
        <dl className="readout-grid">
          <dt>Simple</dt><dd data-testid="simple">{simpleGrowth(VA, r, n).toFixed(2).replace('.', ',')} €</dd>
          <dt>Compuesto</dt><dd data-testid="compound">{compoundEnd.toFixed(2).replace('.', ',')} €</dd>
          <dt>Duplicar</dt><dd data-testid="doubling">{tDouble === null ? '—' : `${tDouble.toFixed(1).replace('.', ',')} años`} <Tex>{`(72/\\Rate{r\\%} \\approx ${t72 === null ? '—' : t72.toFixed(1).replace('.', '{,}')})`}</Tex></dd>
        </dl>
      }
    />
  );
}
