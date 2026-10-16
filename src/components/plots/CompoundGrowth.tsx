import { useState } from 'react';
import { Line, Plot } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { Tex } from '../ui/Tex';
import { compound } from '../../lib/compound';

/** Placeholder widget: VF = VA (1+r)^t. Proves the slider -> plot -> readout pipeline. */
export default function CompoundGrowth() {
  const [r, setR] = useState(0.05);
  const vf = compound(100, r, 10);
  return (
    <WidgetFrame
      title="Interés compuesto"
      ariaLabel="Gráfico del valor futuro de 100 euros a lo largo de 10 años según la tasa de interés"
      plotHeight={260}
      plot={
        <PlotFrame x={[0, 10]} y={[0, 300]} height={260} xTicks={[0, 2, 4, 6, 8, 10]} yTicks={[0, 100, 200, 300]} xLabel="años">
          <Line.Segment point1={[0, 100]} point2={[10, 100]} color="var(--c-pv)" weight={1.5} style="dashed" />
          <Plot.OfX y={(t) => compound(100, r, t)} color="var(--c-fv)" weight={3} />
        </PlotFrame>
      }
      controls={<Slider label="Tasa $\Rate{r}$" value={r} min={0} max={0.2} step={0.005} onChange={setR} format={(v) => `${(v * 100).toFixed(1)} %`} color="var(--c-rate)" />}
      readout={<p>Con 100 € hoy, <Tex>{'\\VF = \\VA(1+r)^{10}'}</Tex> = <strong data-testid="vf">{vf.toFixed(2)} €</strong></p>}
    />
  );
}
