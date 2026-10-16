import { useState } from 'react';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Segmented, Slider } from '../ui/controls';
import { commission, implicitCost, limitOrder, marketOrder, quote, type Side } from '../../lib/finance/markets';
import { tradingBook, tradingFees } from '../../data/trading';
import './trading.css';

const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;

export default function OrderBook() {
  const [side, setSide] = useState<Side>('buy');
  const [kind, setKind] = useState<'market' | 'limit'>('market');
  const [size, setSize] = useState(150);
  const [limit, setLimit] = useState(40);
  const [result, setResult] = useState<ReturnType<typeof marketOrder> | null>(null);
  const q = quote(tradingBook);
  const submit = () => setResult(kind === 'market' ? marketOrder(tradingBook, side, size) : limitOrder(tradingBook, side, size, limit));
  const change = (fn: () => void) => { fn(); setResult(null); };
  const fees = result?.filled ? commission(result.total, tradingFees.rate, tradingFees.minimum) : 0;
  const cost = result?.filled ? implicitCost(side, result.filled, result.avgPrice, q.mid).euros : 0;
  const book = result?.book ?? tradingBook;
  return <WidgetFrame title="Libro de órdenes: envía tu orden" ariaLabel="Precios y cantidades disponibles de compra y venta" plotHeight={220}
    plot={<div style={{ padding: '0.8rem', touchAction: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {([['Compra (bid)', book.bids], ['Venta (ask)', book.asks]] as const).map(([label, levels]) =>
          <div key={label}><strong>{label}</strong><ul style={{ listStyle: 'none', margin: '0.5rem 0', padding: 0 }}>
            {levels.map((l, i) => <li key={i} style={{ borderLeft: '3px solid var(--c-pv)', paddingLeft: '0.4rem', marginBottom: '0.4rem' }}>{euros(l.price)} · {l.size} acc.</li>)}
            {!levels.length && <li>Sin órdenes</li>}
          </ul></div>)}
      </div><p style={{ margin: 0 }}>Libro {result ? 'tras la orden' : 'inicial'}. Referencia fija: {euros(q.mid)}.</p>
    </div>}
    controls={<div className="trading-controls">
      <Segmented label="Sentido" value={side} options={[{ value: 'buy', label: 'Comprar' }, { value: 'sell', label: 'Vender' }]} onChange={v => change(() => setSide(v))} />
      <Segmented label="Tipo de orden" value={kind} options={[{ value: 'market', label: 'A mercado' }, { value: 'limit', label: 'Limitada' }]} onChange={v => change(() => setKind(v))} />
      <Slider label="Cantidad de acciones" value={size} min={50} max={500} step={50} onChange={v => change(() => setSize(v))} />
      {kind === 'limit' && <Slider label="Precio límite (€)" value={limit} min={36} max={43} step={0.5} format={euros} onChange={v => change(() => setLimit(v))} />}
      <Button onClick={submit}>Enviar orden</Button>
      <Button onClick={() => { setSide('buy'); setKind('market'); setSize(150); setLimit(40); setResult(null); }}>Restablecer</Button>
    </div>}
    readout={result ? <dl className="readout-grid">
      <dt>Ejecutadas</dt><dd data-testid="filled">{result.filled}</dd>
      <dt>Sin ejecutar</dt><dd data-testid="unfilled">{result.unfilled}</dd>
      <dt>Precio medio</dt><dd data-testid="average">{result.filled ? euros(result.avgPrice) : '—'}</dd>
      <dt>Efectivo negociado</dt><dd data-testid="total">{euros(result.total)}</dd>
      <dt>Comisión</dt><dd data-testid="fee">{euros(fees)}</dd>
      <dt>Coste implícito</dt><dd data-testid="implicit">{euros(cost)}</dd>
    </dl> : <p>Elige las condiciones y pulsa Enviar orden.</p>}
    caption="Cada envío parte del libro inicial. El resto limitado queda visible, pero no simulamos llegadas posteriores. Comisión solo sobre lo ejecutado; sin ejecución, no cobramos." />;
}
