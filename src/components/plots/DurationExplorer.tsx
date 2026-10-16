import { useState } from 'react';
import { Plot, Point } from 'mafs';
import { bondPrice, bondCashFlows, cashFlowRisk, durationPriceChange } from '../../lib/finance/bonds';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Slider } from '../ui/controls';

const num = (x: number, digits = 2) => x.toFixed(digits).replace('.', ',');
const signed = (x: number) => `${x < 0 ? '−' : '+'}${num(Math.abs(x))} €`;

export default function DurationExplorer() {
  const [maturity, setMaturity] = useState(5);
  const [coupon, setCoupon] = useState(4);
  const [yieldPercent, setYieldPercent] = useState(4);
  const [shock, setShock] = useState(1);
  const bond = { face: 1000, couponRate: coupon / 100, maturity };
  const y = yieldPercent / 100;
  const risk = cashFlowRisk(bondCashFlows(bond), y);
  const actual = (pp: number) => bondPrice(bond, y + pp / 100) - risk.price;
  const linear = (pp: number) => durationPriceChange(bond, y, pp / 100);
  const quadratic = (pp: number) => durationPriceChange(bond, y, pp / 100, true);
  const bound = Math.max(...[-2, 2].flatMap((s) => [actual(s), linear(s), quadratic(s)]).map(Math.abs));
  const limit = Math.ceil(bound / 10) * 10;

  return <WidgetFrame title="Duración: una recta frente a una curva" ariaLabel="Cambio de precio en euros frente al cambio de TIR en puntos porcentuales. Precio exacto azul continuo, duración naranja discontinua y duración con convexidad verde de puntos."
    plotHeight={300}
    plot={<PlotFrame x={[-2, 2]} y={[-limit, limit]} height={300} xTicks={[-2, -1, 0, 1, 2]} yTicks={[-limit, 0, limit]}
      xLabel="ΔTIR (p. p.)" yLabel="Δprecio (€)" baseline={0} marginLeft={52}>
      <Plot.OfX y={actual} domain={[-2, 2]} color="var(--c-pv)" />
      <Plot.OfX y={linear} domain={[-2, 2]} color="var(--c-rate)" style="dashed" />
      <Plot.OfX y={quadratic} domain={[-2, 2]} color="var(--c-return)" svgPathProps={{ style: { strokeDasharray: '2 5' } }} />
      <Point x={shock} y={actual(shock)} color="var(--c-pv)" />
      <Point x={shock} y={linear(shock)} color="var(--c-rate)" />
      <Point x={shock} y={quadratic(shock)} color="var(--c-return)" />
    </PlotFrame>}
    controls={<>
      <Slider label="Vencimiento (años)" value={maturity} min={1} max={15} onChange={setMaturity} color="var(--c-time)" />
      <Slider label="Cupón anual" value={coupon} min={0} max={10} step={0.5} onChange={setCoupon} format={(x) => `${num(x)} %`} />
      <Slider label="TIR inicial" value={yieldPercent} min={2} max={10} step={0.5} onChange={setYieldPercent} format={(x) => `${num(x)} %`} color="var(--c-rate)" />
      <Slider label="Cambio de TIR (p. p.)" value={shock} min={-2} max={2} step={0.1} onChange={setShock} format={(x) => num(x, 1)} color="var(--c-rate)" />
      <Button onClick={() => { setMaturity(5); setCoupon(4); setYieldPercent(4); setShock(1); }}>Restablecer ejemplo</Button>
    </>}
    readout={<dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
      <dt>Precio inicial</dt><dd data-testid="initial">{num(risk.price)} €</dd>
      <dt>Macaulay</dt><dd data-testid="macaulay">{num(risk.macaulay, 3)} años</dd>
      <dt>Modificada</dt><dd data-testid="modified">{num(risk.modified, 3)} años</dd>
      <dt>Convexidad</dt><dd data-testid="convexity">{num(risk.convexity, 3)} años²</dd>
      <dt>Precio tras cambio</dt><dd data-testid="price">{num(bondPrice(bond, y + shock / 100))} €</dd>
      <dt>Δ exacto · azul</dt><dd data-testid="actual">{signed(actual(shock))}</dd>
      <dt>Δ duración · rayas</dt><dd data-testid="linear">{signed(linear(shock))}</dd>
      <dt>Δ con convexidad · puntos</dt><dd data-testid="quadratic">{signed(quadratic(shock))}</dd>
      <dt>Error absoluto: duración</dt><dd data-testid="linear-error">{num(Math.abs(linear(shock) - actual(shock)))} €</dd>
      <dt>Error absoluto: con convexidad</dt><dd data-testid="quadratic-error">{num(Math.abs(quadratic(shock) - actual(shock)))} €</dd>
    </dl>}
    caption="Nominal fijo: 1000 €. Cupones y capitalización anuales. Valoración al inicio del periodo, sin impago ni amortización anticipada. Las aproximaciones usan la duración y convexidad iniciales; la escala vertical se adapta al bono." />;
}
