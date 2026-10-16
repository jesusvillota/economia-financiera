import { useState } from 'react';
import { Line, Point } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider } from '../ui/controls';
import {
  covarianceFromCorrelations, twoAssetReturn, twoAssetVariance, weightSweep,
} from '../../lib/finance/portfolio';

const num = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');
const pct = (value: number) => `${num(value * 100)} %`;

/** The same original example as chapter 7; all financial calculations use portfolio.ts. */
export default function TwoAssetWorked() {
  const [weight, setWeight] = useState(0.5);
  const [rho, setRho] = useState(0.25);
  const points = weightSweep([0.06, 0.12], [0.1, 0.2], rho);
  const selected = weightSweep([0.06, 0.12], [0.1, 0.2], rho, weight, weight, 1)[0];
  const covariance = covarianceFromCorrelations([0.1, 0.2], [[1, rho], [rho, 1]])[0][1];
  return (
    <WidgetFrame title="Cálculo paso a paso: el peso y la correlación"
      ariaLabel="Volatilidad de una cartera de A y B según el peso de A; punto naranja para tu elección"
      plotHeight={250}
      plot={<PlotFrame x={[0, 100]} y={[0, 22]} height={250}
        xTicks={[0, 25, 50, 75, 100]} yTicks={[0, 5, 10, 15, 20]}
        xLabel="peso A (%)" yLabel="riesgo σ (%)">
        {points.slice(1).map((point, i) => <Line.Segment key={i}
          point1={[points[i].weights[0] * 100, points[i].sigma * 100]}
          point2={[point.weights[0] * 100, point.sigma * 100]} color="var(--c-risk)" />)}
        <Point x={weight * 100} y={selected.sigma * 100} color="var(--c-rate)" />
      </PlotFrame>}
      controls={<>
        <Slider label="Peso de A" value={weight} min={0} max={1} step={0.01}
          onChange={setWeight} format={pct} />
        <Slider label="Correlación ρ" value={rho} min={-1} max={1} step={0.05}
          onChange={setRho} format={value => num(value)} color="var(--c-time)" />
      </>}
      readout={<dl className="readout-grid">
        <dt>Peso B</dt><dd data-testid="worked-weight-b">{pct(selected.weights[1])}</dd>
        <dt>Rentabilidad</dt><dd data-testid="worked-return">{pct(twoAssetReturn(weight, 0.06, 0.12))}</dd>
        <dt>Covarianza</dt><dd data-testid="worked-covariance">{num(covariance, 6)}</dd>
        <dt>Varianza</dt><dd data-testid="worked-variance">{num(twoAssetVariance(weight, 0.1, 0.2, rho), 6)}</dd>
        <dt>Riesgo σ</dt><dd data-testid="worked-sigma">{pct(selected.sigma)}</dd>
      </dl>}
      caption="Prueba esto: mantén el peso y cambia la correlación. Después mantén la correlación y cambia el peso. A: retorno 6 %, riesgo 10 %. B: retorno 12 %, riesgo 20 %."
    />
  );
}
