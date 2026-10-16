import { useState } from 'react';
import { Line, Point } from 'mafs';
import { Label, PlotFrame } from './PlotFrame';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Slider } from '../ui/controls';
import { mispricing, securityMarketLine } from '../../lib/finance/capm';

const pct = (value: number) => `${(value * 100).toFixed(2).replace('.', ',')} %`;
const decimal = (value: number) => value.toFixed(2).replace('.', ',');
const pricingLabel: Record<string, string> = { fair: 'Sobre la SML', underpriced: 'Infravalorado según CAPM', overpriced: 'Sobrevalorado según CAPM' };

/** Expected returns supplied by the reader, not realised historical returns. */
export default function SecurityMarketLine() {
  const [riskFree, setRiskFree] = useState(0.02);
  const [market, setMarket] = useState(0.08);
  const [assetBeta, setAssetBeta] = useState(1.5);
  const [forecast, setForecast] = useState(0.13);
  const assets = [
    { name: 'A', beta: assetBeta, forecast },
    { name: 'B', beta: 0.5, forecast: 0.03 },
  ].map((asset) => ({ ...asset, ...mispricing(asset.forecast, riskFree, market, asset.beta) }));
  const required = (b: number) => securityMarketLine(riskFree, market, b);
  const reset = () => { setRiskFree(0.02); setMarket(0.08); setAssetBeta(1.5); setForecast(0.13); };

  return <WidgetFrame
    title="SML: rentabilidad exigida y alfa"
    ariaLabel="Beta en el eje horizontal y rentabilidad anual en el vertical. La recta SML pasa por el mercado M. Los segmentos verticales miden el alfa de A y B."
    plotHeight={300}
    plot={<PlotFrame x={[-0.5, 2]} y={[-0.1, 0.26]} height={300}
      xTicks={[-0.5, 0, 0.5, 1, 1.5, 2]} yTicks={[-0.1, 0, 0.1, 0.2]}
      formatX={(v) => v.toLocaleString('es-ES')} formatY={(v) => `${Math.round(v * 100)} %`}
      xLabel="beta (sin unidad)" yLabel="rentabilidad anual (%)" baseline={0}>
      <Line.Segment point1={[-0.5, required(-0.5)]} point2={[2, required(2)]} color="var(--c-rate)" weight={2} />
      <Point x={1} y={required(1)} color="var(--c-pv)" />
      <Label x={1} y={required(1)} attach="s" attachDistance={10} color="var(--c-pv)">M</Label>
      {assets.map((asset) => <g key={asset.name}>
        <Line.Segment point1={[asset.beta, asset.requiredReturn]} point2={[asset.beta, asset.forecast]}
          color={asset.alpha < 0 ? 'var(--c-risk)' : 'var(--c-return)'} style="dashed" weight={3} />
        <Point x={asset.beta} y={asset.requiredReturn} color="var(--c-rate)" />
        <Point x={asset.beta} y={asset.forecast} color={asset.alpha < 0 ? 'var(--c-risk)' : 'var(--c-return)'} />
        <Label x={asset.beta} y={asset.forecast} attach={asset.alpha < 0 ? 's' : 'n'} attachDistance={10}>{asset.name}</Label>
      </g>)}
    </PlotFrame>}
    controls={<>
      <Slider label="Tipo libre de riesgo" value={riskFree} min={0} max={0.05} step={0.005} format={pct} onChange={setRiskFree} />
      <Slider label="Rentabilidad esperada del mercado" value={market} min={0.06} max={0.12} step={0.005} format={pct} onChange={setMarket} />
      <Slider label="Beta de A" value={assetBeta} min={-0.5} max={2} step={0.1} format={decimal} onChange={setAssetBeta} />
      <Slider label="Rentabilidad prevista de A" value={forecast} min={-0.02} max={0.2} step={0.005} format={pct} onChange={setForecast} />
      <Button onClick={reset}>Restablecer ejemplo</Button>
    </>}
    readout={<div>
      <p>Mercado M: <strong data-testid="market-required">{pct(required(1))}</strong></p>
      {assets.map((asset) => <div key={asset.name} style={{ marginTop: '0.75rem' }}>
        <strong>Activo {asset.name}</strong>
        <dl className="readout-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) max-content' }}>
          <dt>Beta</dt><dd data-testid={`${asset.name}-beta`}>{decimal(asset.beta)}</dd>
          <dt>Prevista</dt><dd data-testid={`${asset.name}-forecast`}>{pct(asset.forecast)}</dd>
          <dt>Exigida</dt><dd data-testid={`${asset.name}-required`}>{pct(asset.requiredReturn)}</dd>
          <dt>Alfa (puntos porcentuales)</dt><dd data-testid={`${asset.name}-alpha`}>{asset.alpha > 1e-12 ? '+' : ''}{decimal(Math.abs(asset.alpha) < 1e-12 ? 0 : asset.alpha * 100)} pp</dd>
        </dl>
        <p data-testid={`${asset.name}-pricing`}>{pricingLabel[asset.pricing]}</p>
      </div>)}
    </div>}
    caption="Naranja: SML. Puntos A y B: previsiones. Segmentos con signo: alfa. La clasificación depende del modelo y de tus previsiones."
  />;
}
