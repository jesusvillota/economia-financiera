import { Fragment, useState } from 'react';
import { Line, Plot, Point } from 'mafs';
import { Label, PlotFrame } from '../plots/PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { betaActivo, requerido, riesgo } from '../../lib/sesion03';

const fmt = (n: number) => n.toFixed(2).replace('.', ',');
const assets = [
  { name: 'X', beta: betaActivo(.0028, .0016), observed: 14 },
  { name: 'Y', beta: betaActivo(.0012, .0016), observed: 6 },
  { name: 'Z', beta: betaActivo(.0036, .0016), observed: 15 },
];

/** Source-data guides for PS3 1b and 5d. Variant exercises explicitly ask for a fresh drawing. */
export default function GraficosPS3() {
  const [rho, setRho] = useState(.3);
  return <>
    <WidgetFrame title="Fuente 1b · Correlación y riesgo" ariaLabel="Riesgo equiponderado creciente con la correlación" plotHeight={280}
      plot={<PlotFrame x={[-1, 1]} y={[0, 18]} height={280} xTicks={[-1, -.5, 0, .5, 1]} yTicks={[0, 5, 10, 15]} xLabel="Correlación" yLabel="Riesgo (%)" formatX={n => String(n).replace('.', ',')}>
        <Plot.OfX y={x => riesgo(50, 18, 15, Math.max(-1, Math.min(1, x)))} domain={[-1, 1]} color="var(--c-risk)" />
        <Point x={rho} y={riesgo(50, 18, 15, rho)} color="var(--c-pv)" />
      </PlotFrame>}
      controls={<Slider label="Correlación" min={-1} max={1} step={.05} value={rho} onChange={setRho} format={fmt} />}
      readout={<p data-testid="ps3-risk">Riesgo: {fmt(riesgo(50, 18, 15, rho))} %. Media: 10 %.</p>}
      caption="Datos originales: 50 % en cada activo, volatilidades 18 % y 15 %. Menor correlación reduce el riesgo." />
    <WidgetFrame title="Fuente 5d · Recta del mercado de valores (SML)" ariaLabel="SML con rentabilidades requeridas y observadas para X, Y y Z" plotHeight={300}
      plot={<PlotFrame x={[0, 2.6]} y={[0, 25]} height={300} xTicks={[0, .5, 1, 1.5, 2, 2.5]} yTicks={[0, 5, 10, 15, 20, 25]} xLabel="Beta" yLabel="Rentabilidad (%)" formatX={n => String(n).replace('.', ',')}>
        <Line.Segment point1={[0, requerido(3.5, 11, 0)]} point2={[2.6, requerido(3.5, 11, 2.6)]} color="var(--c-return)" />
        {assets.map(a => <Fragment key={a.name}>
          <Line.Segment point1={[a.beta, a.observed]} point2={[a.beta, requerido(3.5, 11, a.beta)]} color="var(--text-muted)" style="dashed" />
          <Point x={a.beta} y={requerido(3.5, 11, a.beta)} color="var(--c-return)" />
          <Point x={a.beta} y={a.observed} color="var(--c-risk)" />
          <Label x={a.beta} y={a.observed} attach="s" attachDistance={8} size={12}>{a.name}</Label>
        </Fragment>)}
      </PlotFrame>}
      readout={<p>Verde: requerida por CAPM. Rojo y letra: observada. Los tres puntos observados quedan debajo de la recta.</p>}
      caption="Datos originales y un mismo periodo mensual. Debajo de la SML, CAPM sugiere sobrevaloración." />
  </>;
}
