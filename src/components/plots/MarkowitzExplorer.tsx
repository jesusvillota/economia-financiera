import { Fragment, useMemo, useState } from 'react';
import { Point } from 'mafs';
import EfficientFrontier, { type FrontierAsset } from './EfficientFrontier';
import { Label, PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import { covarianceFromCorrelations, portfolioReturn, portfolioVariance } from '../../lib/finance/portfolio';

const ASSETS: readonly [FrontierAsset, FrontierAsset, FrontierAsset] = [
  { name: 'A', expectedReturn: 0.06, sigma: 0.12 },
  { name: 'B', expectedReturn: 0.10, sigma: 0.20 },
  { name: 'C', expectedReturn: 0.14, sigma: 0.28 },
];
const RETURNS = ASSETS.map(asset => asset.expectedReturn);
const COVARIANCE = covarianceFromCorrelations(ASSETS.map(asset => asset.sigma), [[1, 0.2, 0], [0.2, 1, 0], [0, 0, 1]]);
const num = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = (value: number) => `${num(value * 100)} %`;

/** Weight controls preserve the budget; all return and risk calculations use portfolio.ts. */
export default function MarkowitzExplorer() {
  const [weightA, setWeightA] = useState(0.5);
  const [shareB, setShareB] = useState(0.5);
  const weights = [weightA, (1 - weightA) * shareB, (1 - weightA) * (1 - shareB)];
  const mean = portfolioReturn(weights, RETURNS);
  const variance = portfolioVariance(weights, COVARIANCE);
  const sigma = Math.sqrt(variance);
  const cloud = useMemo(() => {
    const points = [];
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= 20 - a; b++) {
        const w = [a / 20, b / 20, (20 - a - b) / 20];
        points.push([Math.sqrt(portfolioVariance(w, COVARIANCE)) * 100, portfolioReturn(w, RETURNS) * 100]);
      }
    }
    return points;
  }, []);

  return <>
    <WidgetFrame title="Tu mezcla de tres activos" ariaLabel="Carteras sin ventas en corto: nube de mezclas y tu cartera naranja"
      plotHeight={300}
      plot={<PlotFrame x={[0, 32]} y={[4, 16]} height={300} xTicks={[0, 10, 20, 30]} yTicks={[6, 10, 14]}
        xLabel="riesgo σ (%)" yLabel="E[rₚ] (%)">
        {cloud.map(([x, y], i) => <Point key={i} x={x} y={y} color="var(--text-muted)" opacity={0.25} />)}
        {ASSETS.map(asset => <Fragment key={asset.name}>
          <Point x={asset.sigma * 100} y={asset.expectedReturn * 100} color="var(--c-pv)" />
          <Label x={asset.sigma * 100} y={asset.expectedReturn * 100} attach="ne" attachDistance={8}>{asset.name}</Label>
        </Fragment>)}
        <Point x={sigma * 100} y={mean * 100} color="var(--c-rate)" />
        <Label x={sigma * 100} y={mean * 100} attach="s" attachDistance={10}>Tu mezcla</Label>
      </PlotFrame>}
      controls={<>
        <Slider label="Peso de A" value={weightA} min={0} max={1} step={0.01} onChange={setWeightA} format={pct} />
        <Slider label="Parte del resto para B" value={shareB} min={0} max={1} step={0.01} onChange={setShareB} format={pct} />
      </>}
      readout={<>
        <dl className="readout-grid">
          {ASSETS.map((asset, i) => <Fragment key={asset.name}>
            <dt>Peso {asset.name}</dt><dd data-testid={`mix-weight-${i}`}>{pct(weights[i])}</dd>
          </Fragment>)}
          <dt>Rentabilidad</dt><dd data-testid="mix-return">{pct(mean)}</dd>
          <dt>Riesgo σ</dt><dd data-testid="mix-sigma">{pct(sigma)}</dd>
          <dt>Varianza</dt><dd data-testid="mix-variance">{num(variance, 6)}</dd>
        </dl>
        <p className="muted">Correlaciones fijas: A–B = 0,20; A–C = B–C = 0. La nube es una muestra del conjunto factible.</p>
      </>}
      caption="Prueba esto: reserva la mitad para A y divide el resto entre B y C. Después cambia el reparto. El segundo control distribuye solo el capital que queda tras comprar A." />
    <EfficientFrontier assets={ASSETS} initialRho={0.2} initialTarget={0.09}
      title="La frontera de tres activos"
      overlay={<>
        <Point x={sigma * 100} y={mean * 100} color="var(--c-pv)" />
        <Label x={sigma * 100} y={mean * 100} attach="ne" attachDistance={10} color="var(--c-pv)">Tu mezcla</Label>
      </>} />
    <p className="muted">La marca azul conserva la mezcla de arriba y sus correlaciones fijas. Para compararla con la curva, deja ρ en 0,20 y desactiva las ventas en corto.</p>
  </>;
}
