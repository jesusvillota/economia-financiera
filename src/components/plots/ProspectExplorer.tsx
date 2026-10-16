import { useState } from 'react';
import { Plot } from 'mafs';
import { TK1992, prospectValue, probabilityWeight, gambleExpectedValue, gambleProspectValue } from '../../lib/finance/efficiency';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Select, Slider } from '../ui/controls';

const num = (x: number) => x.toFixed(2).replace('.', ',');

export default function ProspectExplorer() {
  const [lambda, setLambda] = useState(2);
  const [gain, setGain] = useState(150);
  const [loss, setLoss] = useState(100);
  const [probability, setProbability] = useState(0.5);
  const [weighting, setWeighting] = useState<'linear' | 'weighted'>('linear');
  const parameters = { ...TK1992, lambda, gamma: weighting === 'linear' ? 1 : TK1992.gamma };
  const outcomes = [gain, -loss];
  const probabilities = [probability, 1 - probability];
  const value = gambleProspectValue(outcomes, probabilities, parameters);

  return <WidgetFrame title="La misma cantidad, distinto valor" ariaLabel="Función de valor: ganancias en verde, pérdidas en rojo. El origen es el punto de referencia. El evaluador compara apostar con no apostar."
    plotHeight={300}
    plot={<PlotFrame x={[-200, 200]} y={[-400, 120]} height={300} xTicks={[-200, -100, 0, 100, 200]} yTicks={[-400, -200, 0, 100]}
      xLabel="cambio x (€)" yLabel="valor v(x), unidades subjetivas" baseline={0}>
      <Plot.OfX y={(x) => prospectValue(x, parameters)} domain={[-200, 0]} color="var(--c-risk)" />
      <Plot.OfX y={(x) => prospectValue(x, parameters)} domain={[0, 200]} color="var(--c-return)" />
    </PlotFrame>}
    controls={<div style={{ width: '100%', minWidth: 0 }}>
      <Slider label="Aversión a las pérdidas λ" min={1} max={3} step={0.25} value={lambda} onChange={setLambda} format={num} color="var(--c-risk)" />
      <Slider label="Ganancia posible (€)" min={0} max={200} step={10} value={gain} onChange={setGain} />
      <Slider label="Pérdida posible (€)" min={0} max={200} step={10} value={loss} onChange={setLoss} color="var(--c-risk)" />
      <Slider label="Probabilidad de ganar" min={0} max={1} step={0.05} value={probability} onChange={setProbability} format={(x) => `${num(100 * x)} %`} />
      <Select label="Peso de las probabilidades" value={weighting} onChange={setWeighting} options={[{ value: 'linear', label: 'Sin distorsión (γ = 1)' }, { value: 'weighted', label: 'Ponderación ilustrativa (γ = 0,61)' }]} />
      <p>Curvatura fija: α = β = 0,88. No apostar conserva el punto de referencia.</p>
      <Button onClick={() => { setLambda(2); setGain(150); setLoss(100); setProbability(0.5); setWeighting('linear'); }}>Restablecer ejemplo</Button>
    </div>}
    readout={<dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
      <dt>v(+100)</dt><dd data-testid="value-gain">{num(prospectValue(100, parameters))}</dd>
      <dt>v(−100)</dt><dd data-testid="value-loss">{num(prospectValue(-100, parameters))}</dd>
      <dt>Esperanza monetaria</dt><dd data-testid="expected">{num(gambleExpectedValue(outcomes, probabilities))} €</dd>
      <dt>Valor subjetivo V</dt><dd data-testid="prospect">{num(value)}</dd>
      <dt>Peso de ganar w(p)</dt><dd data-testid="weight-gain">{num(probabilityWeight(probability, parameters))}</dd>
      <dt>Peso de perder w(1−p)</dt><dd data-testid="weight-loss">{num(probabilityWeight(1 - probability, parameters))}</dd>
      <dt>Referencia: no apostar</dt><dd data-testid="reference">{num(prospectValue(0, parameters))}</dd>
      <dt>Comparación del modelo</dt><dd data-testid="preference">{value > 0 ? 'Apostar' : value < 0 ? 'No apostar' : 'Indiferente'}</dd>
    </dl>}
    caption="V es una puntuación subjetiva, no euros. Se pondera cada resultado por separado: no es la teoría acumulativa completa. Sin impuestos ni costes." />;
}
