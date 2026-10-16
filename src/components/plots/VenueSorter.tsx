import { useState } from 'react';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Select } from '../ui/controls';
import { examples, score, shuffledExamples, venues, type VenueId } from '../../data/venues';

type Pick = VenueId | '';
const options: { value: Pick; label: string }[] = [{ value: '', label: 'Elige…' }, ...venues.map((v) => ({ value: v.id, label: v.label }))];

export default function VenueSorter() {
  const [seed, setSeed] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<string, VenueId>>>({});
  const order = shuffledExamples(seed);
  const answered = Object.keys(answers).length;
  const number = (id: string) => order.findIndex((e) => e.id === id) + 1;

  return (
    <WidgetFrame title="¿Dónde se negocia?"
      ariaLabel="Seis casillas, una por tipo de centro o forma de negociación. Cada situación clasificada aparece como un número dentro de la casilla elegida, marcada como acierto o error."
      plotHeight={220}
      plot={<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(max(9rem, 30%), 1fr))', gap: '0.5rem', padding: '0.6rem' }}>
        {venues.map((v) => (
          <div key={v.id} data-testid={`bucket-${v.id}`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.45rem 0.55rem', minHeight: 92, background: 'var(--bg-raised)' }}>
            <strong style={{ display: 'block', fontSize: '0.85rem' }}>{v.label}</strong>
            <span className="muted" style={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.3 }}>{v.hint}</span>
            <span data-testid={`chips-${v.id}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.3rem' }}>
              {order.filter((e) => answers[e.id] === v.id).map((e) => {
                const ok = e.answer === v.id;
                return <span key={e.id} className={ok ? 'good' : 'bad'} title={ok ? 'acierto' : 'error'}
                  style={{ border: '1px solid currentColor', borderRadius: 999, padding: '0 0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  {number(e.id)}{ok ? ' ✓' : ' ✗'}
                </span>;
              })}
            </span>
          </div>
        ))}
      </div>}
      controls={<div style={{ display: 'grid', gap: '0.8rem', width: '100%' }}>
        <ol style={{ margin: 0, paddingLeft: '1.3rem', display: 'grid', gap: '0.8rem' }}>
          {order.map((e) => {
            const pick = answers[e.id] ?? '';
            return <li key={e.id} data-testid={`item-${e.id}`}>
              <p style={{ margin: '0 0 0.3rem' }}>{e.text}</p>
              <Select<Pick> label="Clasifícala como" value={pick} options={options}
                onChange={(v) => setAnswers((prev) => {
                  const next = { ...prev };
                  if (v) next[e.id] = v; else delete next[e.id];
                  return next;
                })} />
              {pick && <p data-testid={`feedback-${e.id}`} style={{ margin: '0.3rem 0 0' }}>
                <strong className={pick === e.answer ? 'good' : 'bad'}>{pick === e.answer ? 'Correcto.' : 'No exactamente.'}</strong>{' '}
                {pick === e.answer ? e.why : 'Fíjate en cuántas partes intervienen, quién decide la casación y qué se ve antes de operar.'}
              </p>}
            </li>;
          })}
        </ol>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button onClick={() => { setSeed(seed + 1); setAnswers({}); }}>Nuevo orden</Button>
          <Button onClick={() => setAnswers({})} disabled={answered === 0}>Borrar respuestas</Button>
        </div>
      </div>}
      readout={<dl className="readout-grid">
        <dt>Clasificadas</dt><dd data-testid="answered">{answered} de {examples.length}</dd>
        <dt>Aciertos</dt><dd data-testid="correct">{score(answers)} de {examples.length}</dd>
      </dl>}
      caption="Situaciones ficticias. Una misma acción puede negociarse en varios centros; lo que cambia es el mecanismo, no el activo." />
  );
}
