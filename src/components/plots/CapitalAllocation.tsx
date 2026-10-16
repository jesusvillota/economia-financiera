import { useState } from 'react';
import { Line, MovablePoint, Point } from 'mafs';
import EfficientFrontier, { type FrontierAsset, type FrontierOverlayContext } from './EfficientFrontier';
import { Label } from './PlotFrame';
import { Slider } from '../ui/controls';
import { capitalAllocationLine, riskFreeMix, separationAllocation, sharpeRatio, tangentPortfolio } from '../../lib/finance/capm';

const ASSETS: readonly [FrontierAsset, FrontierAsset] = [
  { name: 'A', expectedReturn: 0.08, sigma: 0.1 },
  { name: 'B', expectedReturn: 0.14, sigma: 0.2 },
];
const RF = 0.02;
const num = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = (value: number) => `${num(value * 100)} %`;
const clampWeight = (weight: number) => Math.max(0, Math.min(1.5, weight));

function tangent(context: FrontierOverlayContext) {
  try {
    return tangentPortfolio(context.assets.map(asset => asset.expectedReturn), context.covariance, RF);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    // Singular covariance can admit arbitrage or a nonunique tangent; do not invent a fund.
    return null;
  }
}

/** All financial calculations come from capm.ts and the composed portfolio.ts frontier. */
export default function CapitalAllocation() {
  const [weight, setWeight] = useState(0.5);
  return <EfficientFrontier assets={ASSETS} initialRho={0} initialTarget={0.1} initialShortSales
    title="CAL: elige el fondo y ajusta tu exposición"
    plotBounds={{ x: [0, 55], y: [0, 28] }}
    extraControls={<Slider label="Peso del fondo con riesgo" value={weight} min={0} max={1.5} step={0.01}
      onChange={setWeight} format={pct} color="var(--c-pv)" />}
    overlay={context => {
      const fund = context.selected;
      const mix = riskFreeMix(RF, fund.expectedReturn, fund.sigma, weight);
      const end = riskFreeMix(RF, fund.expectedReturn, fund.sigma, 1.5);
      const t = tangent(context);
      const tangentEndSigma = t ? Math.min(0.25, separationAllocation(RF, t.expectedReturn, t.sigma,
        { expectedReturn: context.y[1] / 100 }).sigma) : 0;
      return <g style={{ pointerEvents: 'none' }}>
        {t && <>
          <Line.Segment point1={[0, RF * 100]} point2={[tangentEndSigma * 100, capitalAllocationLine(RF, t.expectedReturn, t.sigma, tangentEndSigma) * 100]}
            color="var(--c-time)" style="dashed" />
          <Point x={t.sigma * 100} y={t.expectedReturn * 100} color="var(--c-time)" />
          <Label x={t.sigma * 100} y={t.expectedReturn * 100} attach="nw" attachDistance={15} color="var(--c-time)">T</Label>
        </>}
        <Line.Segment point1={[0, RF * 100]} point2={[end.sigma * 100, end.expectedReturn * 100]} color="var(--c-rate)" />
        <Point x={0} y={RF * 100} color="var(--c-rate)" />
        <Label x={0} y={RF * 100} attach="ne" attachDistance={10}>r_f</Label>
        <g role="group" data-testid="cal-portfolio" data-weight={weight} style={{ pointerEvents: 'auto' }} aria-label="Cartera final P; arrastra o usa el control de peso">
          <MovablePoint point={[mix.sigma * 100, mix.expectedReturn * 100]} color="var(--c-pv)"
            constrain={point => {
              const allocation = fund.sigma > 1e-10
                ? separationAllocation(RF, fund.expectedReturn, fund.sigma, { sigma: Math.max(0, point[0] / 100) })
                : null;
              const projected = riskFreeMix(RF, fund.expectedReturn, fund.sigma, clampWeight(allocation?.riskyWeight ?? weight));
              return [projected.sigma * 100, projected.expectedReturn * 100];
            }}
            onMove={point => {
              if (fund.sigma > 1e-10) setWeight(clampWeight(separationAllocation(RF, fund.expectedReturn, fund.sigma,
                { sigma: Math.max(0, point[0] / 100) }).riskyWeight));
            }} />
        </g>
        <Label x={mix.sigma * 100} y={mix.expectedReturn * 100} attach="se" attachDistance={13} color="var(--c-pv)">P</Label>
      </g>;
    }}
    extraReadout={context => {
      const fund = context.selected;
      const mix = riskFreeMix(RF, fund.expectedReturn, fund.sigma, weight);
      const t = tangent(context);
      return <>
        <dl className="readout-grid">
          <dt>Tipo libre de riesgo</dt><dd>{pct(RF)}</dd>
          <dt>Peso del fondo</dt><dd data-testid="cal-weight">{pct(mix.riskyWeight)}</dd>
          <dt>Peso libre de riesgo</dt><dd data-testid="cal-cash">{pct(mix.riskFreeWeight)}</dd>
          <dt>P: retorno</dt><dd data-testid="cal-return">{pct(mix.expectedReturn)}</dd>
          <dt>P: riesgo σ</dt><dd data-testid="cal-sigma">{pct(mix.sigma)}</dd>
          <dt>P: varianza</dt><dd data-testid="cal-variance">{num(mix.variance, 6)}</dd>
          <dt>Sharpe del fondo</dt><dd data-testid="cal-sharpe">{fund.sigma > 1e-10 ? num(sharpeRatio(fund.expectedReturn, RF, fund.sigma), 4) : 'No definido'}</dd>
          <dt>T: retorno</dt><dd data-testid="tangent-return">{t ? pct(t.expectedReturn) : 'No definida'}</dd>
          <dt>T: riesgo σ</dt><dd data-testid="tangent-sigma">{t ? pct(t.sigma) : 'No definida'}</dd>
          <dt>T: Sharpe</dt><dd data-testid="tangent-sharpe">{t ? num(t.sharpe, 4) : 'No definida'}</dd>
          {ASSETS.map((asset, i) => <div key={asset.name} style={{ display: 'contents' }}>
            <dt>T: peso {asset.name}</dt><dd data-testid={`tangent-weight-${i}`}>{t ? pct(t.weights[i]) : 'No definida'}</dd>
          </div>)}
        </dl>
        <p className="muted">Naranja: CAL del fondo seleccionado. Azul: cartera final P. Turquesa discontinua: CAL tangente sin restricciones de cortos.</p>
        <p className="muted">El interruptor de cortos solo limita la frontera y el fondo seleccionado; T sigue siendo una referencia sin restricciones.</p>
        {!t && <p role="status">En esta correlación extrema no calculamos T: la matriz de covarianzas es singular.</p>}
        <p className="muted">Arrastra P horizontalmente o cambia su peso con el teclado. Un peso libre de riesgo negativo representa deuda.</p>
      </>;
    }} />;
}
