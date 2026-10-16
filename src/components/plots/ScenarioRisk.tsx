import { useState } from 'react';
import { Line } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Select, Slider } from '../ui/controls';
import { expectedReturn, scenarioVariance, scenarioStandardDeviation } from '../../lib/finance/risk';

const names = ['Caída', 'Estable', 'Expansión'];
const distributions = {
  balanced: [0.25, 0.5, 0.25],
  adverse: [0.5, 0.25, 0.25],
  optimistic: [0.25, 0.25, 0.5],
} as const;
type Distribution = keyof typeof distributions;
const pct = (value: number) => `${(value * 100).toFixed(2).replace('.', ',')} %`;

/** Inputs are scenarios, not observations. All financial calculations use risk.ts. */
export default function ScenarioRisk() {
  const [returns, setReturns] = useState([-0.1, 0.06, 0.22]);
  const [distribution, setDistribution] = useState<Distribution>('balanced');
  const probabilities = distributions[distribution];
  const mean = expectedReturn(returns, probabilities);
  const variance = scenarioVariance(returns, probabilities);
  const sigma = scenarioStandardDeviation(returns, probabilities);

  return (
    <WidgetFrame
      title="Un activo, varios futuros"
      ariaLabel="Rentabilidad de cada escenario y línea horizontal de rentabilidad esperada. La tabla muestra sus probabilidades."
      plotHeight={260}
      plot={
        <PlotFrame x={[0.5, 3.5]} y={[-0.3, 0.4]} height={260}
          xTicks={[1, 2, 3]} yTicks={[-0.3, -0.1, 0.1, 0.3]}
          formatX={(v) => names[v - 1]} formatY={(v) => `${Math.round(v * 100)} %`}
          xLabel="escenario" yLabel="rentabilidad (%)" baseline={0}>
          {returns.map((r, i) => (
            <Line.Segment key={i} point1={[i + 1, 0]} point2={[i + 1, r]}
              color={r < 0 ? 'var(--c-risk)' : 'var(--c-return)'} weight={7} />
          ))}
          <Line.Segment point1={[0.5, mean]} point2={[3.5, mean]} color="var(--c-rate)" weight={2} style="dashed" />
        </PlotFrame>
      }
      controls={
        <div style={{ width: '100%', minWidth: 0 }}>
          <Select label="Probabilidades" value={distribution} onChange={setDistribution}
            options={[
              { value: 'balanced', label: 'Central' },
              { value: 'adverse', label: 'Más peso en caída' },
              { value: 'optimistic', label: 'Más peso en expansión' },
            ]} />
          <table style={{ width: '100%', tableLayout: 'fixed', marginTop: '1rem' }}>
            <caption>Escenarios del próximo año</caption>
            <thead><tr><th scope="col" style={{ width: '25%' }}><abbr title="Probabilidad">Prob.</abbr></th><th scope="col">Rentabilidad</th></tr></thead>
            <tbody>
              {names.map((name, i) => (
                <tr key={name}>
                  <td data-testid={`probability-${i}`} style={{ textAlign: 'center' }}>{pct(probabilities[i])}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <Slider label={name} value={returns[i]} min={-0.3} max={0.4} step={0.01}
                      format={pct} color={returns[i] < 0 ? 'var(--c-risk)' : 'var(--c-return)'}
                      onChange={(value) => setReturns((old) => old.map((r, j) => j === i ? value : r))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      readout={
        <dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
          <dt>Esperanza E[rⱼ]</dt><dd data-testid="mean">{pct(mean)}</dd>
          <dt>Volatilidad σⱼ</dt><dd data-testid="sigma">{pct(sigma)}</dd>
          <dt>Varianza (tanto por uno al cuadrado)</dt>
          <dd data-testid="variance">{variance.toFixed(4).replace('.', ',')}</dd>
        </dl>
      }
      caption="Barras: resultados posibles, con signo. Línea discontinua: esperanza. La volatilidad cuenta tanto subidas como caídas."
    />
  );
}
