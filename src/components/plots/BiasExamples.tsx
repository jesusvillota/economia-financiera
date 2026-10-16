import { useState } from 'react';
import { biases, biasExamples, biasScore, type BiasId } from '../../data/biases';
import { WidgetFrame } from '../ui/WidgetFrame';
import { Button, Select } from '../ui/controls';

export default function BiasExamples() {
  const [answers, setAnswers] = useState<Partial<Record<string, BiasId>>>({});
  return <WidgetFrame title="Pon nombre al sesgo" ariaLabel="Situaciones ficticias para distinguir cinco sesgos. La puntuación cambia al elegir una respuesta."
    plotHeight={100}
    plot={<div style={{ padding: '1rem' }}><p>Busca la razón de la decisión, no solo su resultado.</p>
      <p>Un beneficio puede acompañar a un mal proceso. Una pérdida puede acompañar a una decisión razonable.</p></div>}
    controls={<div style={{ display: 'grid', gap: '1rem', width: '100%', minWidth: 0 }}>
      {biasExamples.map((example) => <div key={example.id} data-testid={`bias-${example.id}`}>
        <p>{example.text}</p>
        <Select<BiasId | ''> label="Sesgo principal" value={answers[example.id] ?? ''}
          options={[{ value: '', label: 'Elige…' }, ...biases.map((bias) => ({ value: bias.id, label: bias.label }))]}
          onChange={(value) => setAnswers((old) => { const next = { ...old }; if (value) next[example.id] = value; else delete next[example.id]; return next; })} />
        {answers[example.id] && <p role="status">{answers[example.id] === example.answer ? `Correcto. ${example.why}` : 'No exactamente. Revisa qué motivo cambia la decisión.'}</p>}
      </div>)}
      <Button onClick={() => setAnswers({})} disabled={Object.keys(answers).length === 0}>Borrar respuestas</Button>
    </div>}
    readout={<dl className="readout-grid"><dt>Aciertos</dt><dd data-testid="bias-score">{biasScore(answers)} de {biasExamples.length}</dd></dl>}
    caption="Cada caso destaca un motivo. En decisiones reales pueden coincidir varios sesgos." />;
}
