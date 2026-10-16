import { useState } from 'react';
import { Line, MovablePoint, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Select, Slider } from '../ui/controls';
import { bondPriceFromSpots, forwardRate } from '../../lib/finance/bonds';

const INITIAL = [0.02, 0.03, 0.04, 0.045, 0.05];
const num = (v: number) => v.toFixed(2).replace('.', ',');
const pct = (v: number) => `${num(v * 100)} %`;
const euros = (v: number) => `${num(v)} €`;
// Only interaction constraints and display units live here; finance comes from bonds.ts.
const clampSpot = (v: number) => Math.round(Math.max(-0.02, Math.min(0.08, v)) * 1000) / 1000;

export default function SpotForwardBuilder() {
  const [rates, setRates] = useState(INITIAL);
  const [coupon, setCoupon] = useState(0.05);
  const [maturity, setMaturity] = useState('3');
  const [start, setStart] = useState('1');
  const [length, setLength] = useState('2');
  const curve = rates.map((rate, i) => ({ t: i + 1, rate }));
  const forwards = rates.map((_, i) => forwardRate(curve, i, 1));
  const bond = { face: 1000, couponRate: coupon, maturity: Number(maturity) };
  const min = Math.floor(Math.min(0, ...rates, ...forwards) * 100) - 2;
  const max = Math.ceil(Math.max(...rates, ...forwards) * 100) + 2;
  const update = (index: number, value: number) => setRates(old => old.map((v, i) => i === index ? clampSpot(value) : v));
  const options = (n: number, first = 1) => Array.from({ length: n }, (_, i) => ({ value: String(i + first), label: `${i + first}` }));

  return <WidgetFrame title="Del spot al forward y al precio" ariaLabel="Tipos spot arrastrables en azul y forwards anuales en naranja; tiempo en años y tasas en porcentaje"
    plotHeight={300}
    plot={<PlotFrame x={[0.5, 5.5]} y={[min, max]} height={300} xTicks={[1, 2, 3, 4, 5]}
      yTicks={[min, 0, max]} formatY={v => `${num(v)} %`} xLabel="año final" yLabel="tasa anual" marginLeft={65} baseline={0}>
      {curve.slice(1).map((node, i) => <Line.Segment key={`spot-line-${i}`} point1={[i + 1, rates[i] * 100]}
        point2={[node.t, node.rate * 100]} color="var(--c-pv)" />)}
      {forwards.slice(1).map((f, i) => <Line.Segment key={`forward-line-${i}`} point1={[i + 1, forwards[i] * 100]}
        point2={[i + 2, f * 100]} color="var(--c-rate)" style="dashed" />)}
      {forwards.map((f, i) => <Point key={`forward-${i}`} x={i + 1} y={f * 100} color="var(--c-rate)" />)}
      {curve.map((node, i) => <g key={node.t} data-testid={`spot-point-${i}`} data-rate={node.rate}
        aria-label={`Spot a ${node.t} años; también disponible en el deslizador`}>
        <MovablePoint point={[node.t, node.rate * 100]} color="var(--c-pv)"
          constrain={p => [node.t, clampSpot(p[1] / 100) * 100]} onMove={p => update(i, p[1] / 100)} />
      </g>)}
    </PlotFrame>}
    controls={<>
      {curve.map((node, i) => <Slider key={node.t} label={`Spot a ${node.t} ${node.t === 1 ? 'año' : 'años'}`} value={node.rate}
        min={-0.02} max={0.08} step={0.001} onChange={v => update(i, v)} format={pct} />)}
      <Slider label="Cupón anual / nominal" value={coupon} min={0} max={0.1} step={0.005} onChange={setCoupon} format={pct} color="var(--c-return)" />
      <Select label="Vencimiento del bono (años)" value={maturity} options={options(5)} onChange={setMaturity} />
      <Select label="Inicio del forward (años)" value={start} options={options(5, 0)} onChange={v => {
        setStart(v); setLength(old => String(Math.min(Number(old), 5 - Number(v))));
      }} />
      <Select label="Duración del forward (años)" value={length} options={options(5 - Number(start))} onChange={setLength} />
      <Button onClick={() => { setRates(INITIAL); setCoupon(0.05); setMaturity('3'); setStart('1'); setLength('2'); }}>Restablecer ejemplo</Button>
    </>}
    readout={<>
      <p>Azul: spots. Naranja discontinuo: forward de cada año, situado en su fecha final. Las líneas solo unen nodos.</p>
      <dl className="readout-grid">
        {forwards.map((f, i) => <div key={i} style={{ display: 'contents' }}>
          <dt>Forward {i} → {i + 1}</dt><dd data-testid={`forward-${i}`}>{pct(f)}</dd>
        </div>)}
        <dt>Forward elegido {start} → {Number(start) + Number(length)}</dt><dd data-testid="selected-forward">{pct(forwardRate(curve, Number(start), Number(length)))}</dd>
        <dt>Cupón cero · {maturity} años</dt><dd data-testid="zero-price">{euros(bondPriceFromSpots({ ...bond, couponRate: 0 }, curve))}</dd>
        <dt>Bono con cupón · {maturity} años</dt><dd data-testid="bond-price">{euros(bondPriceFromSpots(bond, curve))}</dd>
      </dl>
      <p className="muted">Nominal: 1000 €. Cupones anuales. Los forwards son efectivos anuales, incluso si abarcan varios años.</p>
    </>}
    caption="Arrastra cada punto azul verticalmente o usa su deslizador con el teclado. Sin impago, impuestos ni costes. No extrapolamos ni interpolamos tipos." />;
}
