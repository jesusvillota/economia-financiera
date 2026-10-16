import { useState } from 'react';
import { Line, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { gordonPrice } from '../../lib/finance/valuation';

const euro = (v: number) => `${v.toFixed(2).replace('.', ',')} €`;
const pct = (v: number) => `${(v * 100).toFixed(1).replace('.', ',')} %`;

/** Paired slices of the Gordon price; invalid parameters never reach the library. */
export default function DividendDiscount() {
  const [dividend, setDividend] = useState(3);
  const [r, setR] = useState(0.1);
  const [g, setG] = useState(0.04);
  const valid = r > g;
  const price = valid ? gordonPrice(dividend, r, g) : null;
  const ceiling = Math.max(100, (price ?? 0) * 1.25);
  const curve = (axis: 'g' | 'r') => {
    const min = axis === 'g' ? -0.02 : 0.02;
    const max = axis === 'g' ? 0.12 : 0.16;
    const points = Array.from({ length: 281 }, (_, i) => {
      const x = min + (max - min) * i / 280;
      const rate = axis === 'r' ? x : r;
      const growth = axis === 'g' ? x : g;
      const y = rate > growth ? gordonPrice(dividend, rate, growth) : null;
      return y !== null && y <= ceiling ? [x * 100, y] as [number, number] : null;
    });
    return (
      <PlotFrame x={[min * 100, max * 100]} y={[0, ceiling]} height={225}
        xTicks={axis === 'g' ? [-2, 0, 4, 8, 12] : [2, 6, 10, 14]}
        yTicks={[0, ceiling / 2, ceiling]} formatY={(v) => v.toFixed(0)}
        xLabel={axis === 'g' ? 'g (%)' : 'r (%)'} yLabel="P₀ (€)" marginLeft={56}>
        {points.slice(1).map((point, i) => point && points[i] && (
          <Line.Segment key={i} point1={points[i]!} point2={point} color={axis === 'g' ? 'var(--c-return)' : 'var(--c-rate)'} weight={2.5} />
        ))}
        {price !== null && <Point x={(axis === 'g' ? g : r) * 100} y={price} color="var(--c-pv)" />}
      </PlotFrame>
    );
  };
  return (
    <div data-testid="dividend-widget">
      <WidgetFrame title="El precio, el crecimiento y la rentabilidad exigida"
        ariaLabel="Arriba: precio frente al crecimiento, con r fijo. Abajo: precio frente a r, con g fijo. Los puntos azules marcan tu elección."
        plotHeight={450}
        plot={<>{curve('g')}{curve('r')}</>}
        controls={<>
          <Slider label="Próximo dividendo $D_1$ (€)" value={dividend} min={1} max={6} step={0.5} onChange={setDividend} format={euro} />
          <Slider label="Rentabilidad exigida $\Rate{r}$" value={r} min={0.02} max={0.16} step={0.005} onChange={setR} format={pct} color="var(--c-rate)" />
          <Slider label="Crecimiento $g$" value={g} min={-0.02} max={0.12} step={0.005} onChange={setG} format={pct} color="var(--c-return)" />
        </>}
        readout={<>
          <dl className="readout-grid">
            <dt>Precio P₀</dt><dd data-testid="price">{price === null ? 'No converge' : euro(price)}</dd>
            <dt>Sin crecimiento</dt><dd data-testid="zero-growth">{euro(gordonPrice(dividend, r, 0))}</dd>
          </dl>
          {!valid && <p role="status" data-testid="warning">Gordon requiere r &gt; g. Con dividendos positivos, la suma no converge si r ≤ g.</p>}
        </>}
        caption="Arriba varía g; abajo varía r. Cada curva mantiene fijo el otro parámetro. Solo dibujamos precios finitos dentro de la escala; cerca de r = g la curva sale del gráfico."
      />
    </div>
  );
}
