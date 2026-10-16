import { useState } from 'react';
import { Line } from 'mafs';
import { PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Slider, Segmented, Button } from '../ui/controls';
import { randomWalkPrices, trendPrices, logReturns, simpleReturns, autocorrelation, varianceRatio, momentumBacktest } from '../../lib/finance/efficiency';

const decimal = (v: number) => v.toFixed(3).replace('.', ',');
const pct = (v: number) => `${(100 * v).toFixed(2).replace('.', ',')} %`;

export default function EfficiencyDemo() {
  const [seed, setSeed] = useState(42);
  const [mode, setMode] = useState<'walk' | 'trend'>('walk');
  const [phi, setPhi] = useState(0.5);
  const [cost, setCost] = useState(0.001);
  const [q, setQ] = useState(5);
  const [lookback, setLookback] = useState(5);
  const options = { p0: 100, drift: 0.0005, sigma: 0.02, steps: 120, seed };
  const walk = randomWalkPrices(options);
  const trend = trendPrices({ ...options, phi });
  const prices = mode === 'walk' ? walk : trend;
  const returns = logReturns(prices);
  const backtest = momentumBacktest(simpleReturns(prices), lookback, cost);
  const low = Math.floor(Math.min(...walk, ...trend) / 10) * 10 - 10;
  const high = Math.ceil(Math.max(...walk, ...trend) / 10) * 10 + 10;
  return <WidgetFrame title="¿Ves una pauta o una coincidencia?"
    ariaLabel="Precio simulado en euros por sesión. Azul: paseo aleatorio. Naranja: persistencia. Ambas curvas usan las mismas sorpresas."
    plotHeight={300}
    plot={<PlotFrame x={[0, 120]} y={[low, high]} height={300} xTicks={[0, 30, 60, 90, 120]}
      yTicks={[low, Math.round((low + high) / 2), high]} xLabel="sesión" yLabel="precio (€)">
      {[walk, trend].map((path, k) => path.slice(1).map((p, t) => <Line.Segment key={`${k}-${t}`}
        point1={[t, path[t]]} point2={[t + 1, p]} color={k === 0 ? 'var(--c-pv)' : 'var(--c-rate)'}
        style={k === 0 ? 'solid' : 'dashed'} weight={2} />))}
    </PlotFrame>}
    controls={<>
      <Segmented label="Serie para las lecturas" value={mode} onChange={setMode}
        options={[{ value: 'walk', label: 'Paseo' }, { value: 'trend', label: 'Persistencia' }]} />
      <Slider label="Persistencia φ" value={phi} min={0} max={0.8} step={0.1} onChange={setPhi} format={decimal} />
      <Slider label="Horizonte q" value={q} min={2} max={10} onChange={setQ} />
      <Slider label="Sesiones previas" value={lookback} min={1} max={20} onChange={setLookback} />
      <Slider label="Coste por cambio" value={cost} min={0} max={0.01} step={0.001} onChange={setCost} format={pct} />
      <Button onClick={() => setSeed(seed + 1)}>Otra trayectoria</Button>
      <Button onClick={() => { setSeed(42); setMode('walk'); setPhi(0.5); setCost(0.001); setQ(5); setLookback(5); }}>Restablecer</Button>
    </>}
    readout={<dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
      <dt>Semilla</dt><dd data-testid="seed">{seed}</dd>
      <dt>Precio final (€)</dt><dd data-testid="price">{prices.at(-1)!.toFixed(2).replace('.', ',')}</dd>
      <dt>Autocorrelación</dt><dd data-testid="acf">{decimal(autocorrelation(returns))}</dd>
      <dt>VR(q)</dt><dd data-testid="vr">{decimal(varianceRatio(returns, q))}</dd>
      <dt>Cambios de posición</dt><dd data-testid="trades">{backtest.trades}</dd>
      <dt>Riqueza momentum</dt><dd data-testid="momentum">{decimal(backtest.strategyWealth)}</dd>
      <dt>Riqueza mantener</dt><dd data-testid="hold">{decimal(backtest.buyAndHoldWealth)}</dd>
    </dl>}
    caption="Simulación, no datos reales. Inicio: 100 €. 120 sesiones; media logarítmica diaria 0,05 %; desviación de la sorpresa 2 %. Riqueza inicial: 1. Efectivo sin interés; sin impuestos, dividendos ni cierre forzado. Azul continuo: paseo; naranja discontinuo: persistencia. Las lecturas usan la serie seleccionada." />;
}
