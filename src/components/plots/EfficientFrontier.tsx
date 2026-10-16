import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Line, MovablePoint, Point } from 'mafs';
import { Label, PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import {
  covarianceFromCorrelations, frontier, frontierPoint, globalMinimumVariance,
  type PortfolioPoint,
} from '../../lib/finance/portfolio';

export interface FrontierAsset {
  name: string;
  expectedReturn: number;
  sigma: number;
}

export interface FrontierOverlayContext {
  assets: readonly FrontierAsset[];
  covariance: number[][];
  minimum: PortfolioPoint;
  selected: PortfolioPoint;
  rho: number;
  longOnly: boolean;
  /** Plot coordinates use percentage points: 0.12 is drawn at 12 on both axes. */
  x: [number, number];
  y: [number, number];
}

interface EfficientFrontierProps {
  assets?: readonly [FrontierAsset, FrontierAsset] | readonly [FrontierAsset, FrontierAsset, FrontierAsset];
  initialRho?: number;
  initialShortSales?: boolean;
  initialTarget?: number;
  title?: string;
  /** Mafs elements in percentage-point coordinates; use a React wrapper for a dynamic CAL/SML overlay. */
  overlay?: ReactNode | ((context: FrontierOverlayContext) => ReactNode);
}

const DEFAULT_ASSETS: readonly [FrontierAsset, FrontierAsset] = [
  { name: 'A', expectedReturn: 0.08, sigma: 0.2 },
  { name: 'B', expectedReturn: 0.16, sigma: 0.1 },
];
const COLORS = ['var(--c-pv)', 'var(--c-fv)', 'var(--c-time)'];
const num = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = (value: number) => `${num(value * 100)} %`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Only the first pair's correlation changes; the optional third asset is uncorrelated with both. */
export default function EfficientFrontier({
  assets = DEFAULT_ASSETS, initialRho = 0.2, initialShortSales = false,
  initialTarget = 0.12, title = 'Frontera eficiente: dos activos', overlay,
}: EfficientFrontierProps) {
  const [rho, setRho] = useState(initialRho);
  const [shortSales, setShortSales] = useState(initialShortSales);
  const [target, setTarget] = useState(initialTarget);
  const longOnly = !shortSales;
  const model = useMemo(() => {
    const returns = assets.map(asset => asset.expectedReturn);
    const covariance = covarianceFromCorrelations(assets.map(asset => asset.sigma),
      assets.map((_, i) => assets.map((_, j) => i === j ? 1 : i < 2 && j < 2 ? rho : 0)));
    const minimum = globalMinimumVariance(returns, covariance, longOnly);
    const low = Math.min(...returns), high = Math.max(...returns);
    const span = high - low || 0.04;
    const minTarget = longOnly ? low : Math.min(low - span / 2, minimum.expectedReturn);
    const maxTarget = longOnly ? high : Math.max(high + span / 2, minimum.expectedReturn);
    const targets = Array.from({ length: 101 }, (_, i) => minTarget + (maxTarget - minTarget) * i / 100);
    // Include the turning point exactly so neither branch skips the minimum.
    targets.push(minimum.expectedReturn);
    targets.sort((a, b) => a - b);
    const points = frontier(returns, covariance, targets, longOnly);
    const xMax = Math.max(...assets.map(asset => asset.sigma), ...points.map(point => point.sigma), 0.01) * 110;
    const y: [number, number] = [(minTarget - span * 0.15) * 100, (maxTarget + span * 0.15) * 100];
    return { returns, covariance, minimum, minTarget, maxTarget, points, xMax, y };
  }, [assets, rho, longOnly]);
  const { returns, covariance, minimum, minTarget, maxTarget, points, xMax, y } = model;
  const selectedTarget = clamp(target, minTarget, maxTarget);
  const selected = frontierPoint(returns, covariance, selectedTarget, longOnly);
  const x: [number, number] = [0, xMax];
  const project = ([, vertical]: [number, number]): [number, number] => {
    const point = frontierPoint(returns, covariance, clamp(vertical / 100, minTarget, maxTarget), longOnly);
    return [point.sigma * 100, point.expectedReturn * 100];
  };

  return (
    <WidgetFrame
      title={title}
      ariaLabel="Riesgo y rentabilidad de las carteras: activos individuales, mínimo de varianza y cartera seleccionada arrastrable"
      plotHeight={300}
      plot={
        <PlotFrame x={x} y={y} height={300}
          xTicks={[0, xMax / 3, xMax * 2 / 3, xMax]}
          yTicks={[minTarget * 100, (minTarget + maxTarget) * 50, maxTarget * 100]}
          formatX={value => num(value, 1)} formatY={value => num(value, 1)}
          xLabel="riesgo σ (%)" yLabel="E[rₚ] (%)">
          {points.slice(1).map((point, i) => (
            <Line.Segment key={i} point1={[points[i].sigma * 100, points[i].expectedReturn * 100]}
              point2={[point.sigma * 100, point.expectedReturn * 100]}
              color={point.branch === 'efficient' ? 'var(--c-return)' : 'var(--text-muted)'}
              style={point.branch === 'efficient' ? 'solid' : 'dashed'} weight={2.5} />
          ))}
          {typeof overlay === 'function' ? overlay({ assets, covariance, minimum, selected, rho, longOnly, x, y }) : overlay}
          {assets.map((asset, i) => (
            <Fragment key={i}>
              <Point x={asset.sigma * 100} y={asset.expectedReturn * 100} color={COLORS[i]} />
              <Label x={asset.sigma * 100} y={asset.expectedReturn * 100} attach="ne" attachDistance={9} color={COLORS[i]}>{asset.name}</Label>
            </Fragment>
          ))}
          <Point x={minimum.sigma * 100} y={minimum.expectedReturn * 100} color="var(--c-risk)" />
          <Label x={minimum.sigma * 100} y={minimum.expectedReturn * 100} attach="s" attachDistance={12} color="var(--c-risk)">Mín.</Label>
          <g data-testid="frontier-portfolio" aria-label="Cartera seleccionada; arrastra verticalmente">
            <MovablePoint point={[selected.sigma * 100, selected.expectedReturn * 100]} constrain={project}
              onMove={point => setTarget(point[1] / 100)} color="var(--c-rate)" />
          </g>
        </PlotFrame>
      }
      controls={<>
        <Slider label={`Correlación ρ (${assets[0].name}, ${assets[1].name})`} value={rho}
          min={-1} max={1} step={0.05} onChange={setRho} format={value => num(value)} color="var(--c-time)" />
        <Slider label="Rentabilidad de la cartera" value={selectedTarget} min={minTarget} max={maxTarget}
          step={0.001} onChange={setTarget} format={pct} color="var(--c-rate)" />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: 44 }}>
          <input type="checkbox" checked={shortSales} onChange={event => {
            setTarget(selectedTarget);
            setShortSales(event.target.checked);
          }} />
          Permitir ventas en corto
        </label>
      </>}
      readout={<>
        <dl className="readout-grid">
          <dt>Rentabilidad</dt><dd data-testid="frontier-return">{pct(selected.expectedReturn)}</dd>
          <dt>Riesgo σ</dt><dd data-testid="frontier-sigma">{pct(selected.sigma)}</dd>
          <dt>Varianza</dt><dd data-testid="frontier-variance">{num(selected.variance, 6)}</dd>
          {assets.map((asset, i) => <Fragment key={i}>
            <dt>Peso {asset.name}</dt><dd data-testid={`frontier-weight-${i}`}>{pct(selected.weights[i])}</dd>
          </Fragment>)}
          <dt>Mín.: retorno</dt><dd data-testid="frontier-min-return">{pct(minimum.expectedReturn)}</dd>
          <dt>Mín.: riesgo</dt><dd data-testid="frontier-min-sigma">{pct(minimum.sigma)}</dd>
          {assets.map((asset, i) => <Fragment key={i}>
            <dt>Mín.: peso {asset.name}</dt><dd data-testid={`frontier-min-weight-${i}`}>{pct(minimum.weights[i])}</dd>
          </Fragment>)}
        </dl>
        <p className="muted">Verde continuo: eficiente. Gris discontinuo: ineficiente. Naranja: tu cartera. Rojo: mínimo.</p>
        <p className="muted">{assets.map(asset => `${asset.name}: retorno ${pct(asset.expectedReturn)}, riesgo ${pct(asset.sigma)}`).join(' · ')}</p>
        {assets.length === 3 && <p className="muted">El tercer activo tiene correlación cero con los otros dos.</p>}
      </>}
      caption="Prueba esto: cambia la correlación y permite ventas en corto. Un peso negativo representa una venta en corto. Arrastra el punto naranja hacia arriba o abajo, o usa el control de rentabilidad. La curva muestra la cartera de menor riesgo para cada rentabilidad."
    />
  );
}
