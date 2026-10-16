import { useState } from 'react';
import { Line, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { marketModelReturn, marketModelAbnormalReturns, cumulativeAbnormalReturn } from '../../lib/finance/eventStudy';

// Original teaching example. Returns are daily decimals, not annual rates.
const days = [-2, -1, 0, 1, 2];
const market = [-0.01, 0.005, 0.01, -0.005, 0];
const observed = [-0.013, 0.009, 0.028, -0.007, 0.001];
const pct = (v: number) => `${(v * 100).toFixed(2).replace(/^-0\.00$/, '0.00').replace('.', ',')} %`;

export default function EventWindow() {
  const [beta, setBeta] = useState(1.2);
  const [intercept, setIntercept] = useState(0.001);
  const [start, setStart] = useState(-2);
  const [end, setEnd] = useState(2);
  const ar = marketModelAbnormalReturns(observed, market, intercept, beta);
  const first = days.indexOf(start);
  const last = days.indexOf(end);
  const cumulative = days.map((_, i) => i >= first && i <= last ? cumulativeAbnormalReturn(ar, first, i) : null);
  return (
    <WidgetFrame title="La ventana cambia la pregunta"
      ariaLabel="CAR diario acumulado desde el inicio de la ventana. Línea vertical discontinua: anuncio en el día cero. Datos en la tabla."
      plotHeight={280}
      plot={<PlotFrame x={[-2.4, 2.4]} y={[-0.07, 0.07]} height={280}
        xTicks={days} yTicks={[-0.06, -0.03, 0, 0.03, 0.06]}
        formatY={(v) => `${Math.round(v * 100)} %`} xLabel="día relativo al anuncio" yLabel="CAR (%)" baseline={0}>
        <Line.Segment point1={[0, -0.07]} point2={[0, 0.07]} color="var(--c-time)" style="dashed" />
        {days.map((day, i) => cumulative[i] !== null && (
          <Point key={day} x={day} y={cumulative[i]!} color="var(--c-return)" />
        ))}
        {days.slice(1).map((day, k) => cumulative[k] !== null && cumulative[k + 1] !== null && (
          <Line.Segment key={day} point1={[days[k], cumulative[k]!]} point2={[day, cumulative[k + 1]!]}
            color="var(--c-return)" weight={3} />
        ))}
      </PlotFrame>}
      controls={<>
        <Slider label="Beta estimada" value={beta} min={0} max={2} step={0.1} onChange={setBeta} format={(v) => v.toFixed(1).replace('.', ',')} />
        <Slider label="Intercepto diario" value={intercept} min={-0.002} max={0.004} step={0.001} onChange={setIntercept} format={pct} color="var(--c-rate)" />
        <Slider label="Inicio de ventana" value={start} min={-2} max={2} onChange={(v) => { setStart(v); setEnd(Math.max(v, end)); }} />
        <Slider label="Fin de ventana" value={end} min={-2} max={2} onChange={(v) => { setEnd(v); setStart(Math.min(v, start)); }} />
      </>}
      readout={<>
        <dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
          <dt>Normal, día 0</dt><dd data-testid="normal">{pct(marketModelReturn(market[2], intercept, beta))}</dd>
          <dt>AR, día 0</dt><dd data-testid="ar-zero">{pct(ar[2])}</dd>
          <dt>Ventana inclusiva</dt><dd data-testid="window">[{start}, {end}]</dd>
          <dt>CAR de la ventana</dt><dd data-testid="car">{pct(cumulativeAbnormalReturn(ar, first, last))}</dd>
        </dl>
        <table style={{ width: '100%', tableLayout: 'fixed', fontSize: '0.85rem' }}>
          <caption>Datos diarios (%)</caption>
          <thead><tr><th scope="col">Día</th><th scope="col">Acción</th><th scope="col">AR</th><th scope="col">CAR</th></tr></thead>
          <tbody>{days.map((day, i) => <tr key={day}>
            <th scope="row">{day}</th><td>{pct(observed[i])}</td>
            <td data-testid={`ar-${i}`}>{pct(ar[i])}</td>
            <td data-testid={`cumulative-${i}`}>{cumulative[i] === null ? '—' : pct(cumulative[i]!)}</td>
          </tr>)}</tbody>
        </table>
      </>}
      caption="Datos ficticios fijos. CAR suma los AR; no capitaliza. Fuera de la ventana no se dibujan puntos. Cambiar parámetros muestra sensibilidad, no estima una regresión." />
  );
}
