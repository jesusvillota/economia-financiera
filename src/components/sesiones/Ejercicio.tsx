import { useEffect, useState } from 'react';
import { Button } from '../ui/controls';
import { RichText } from '../ui/Tex';
import { fmt, interpolate, parseNumber, variant, withinTolerance, type Param, type Tolerance } from '../../lib/problems/variant';
import { markSolved } from './progress';

const libs = import.meta.glob('../../lib/**/*.ts', { eager: true }) as Record<string, Record<string, (...a: number[]) => number>>;

interface AnswerSpec {
  id: string; label: string; unit?: string; value: number; tolerance: Tolerance;
  lib: { module: string; fn: string; args: string[] };
}
export interface ExerciseSpec {
  difficulty?: 1 | 2 | 3;
  id: string; statement: string; parameters: (Param & { label: string; unit?: string })[]; seed: number;
  hints: string[]; steps: { title: string; body: string }[]; answers: AnswerSpec[];
}

/** Expected value of an answer for the current parameter values: always computed by src/lib. */
const expected = (a: AnswerSpec, values: Record<string, number>) =>
  libs[`../../lib/${a.lib.module}.ts`][a.lib.fn](...a.lib.args.map((id) => values[id]));

/** Solution steps may use `{{answer_id}}`: the answer rounded for display (2 decimals for €, 4 otherwise). */
const withAnswers = (answers: AnswerSpec[], values: Record<string, number>) => ({
  ...values,
  ...Object.fromEntries(answers.map((a) => [a.id, Number(expected(a, values).toFixed(a.unit === '€' ? 2 : 4))])),
});

/** Hint ladder: one button reveals the next hint, in order. */
export function Pista({ hints, values }: { hints: string[]; values: Record<string, number> }) {
  const [shown, setShown] = useState(0);
  if (!hints.length) return null;
  return (
    <div className="ses-block">
      <ol className="ses-hints" aria-label="Pistas">
        {hints.slice(0, shown).map((h, i) => <li key={i} className="ses-reveal"><RichText>{interpolate(h, values)}</RichText></li>)}
      </ol>
      {shown < hints.length && <Button onClick={() => setShown(shown + 1)}>{`Pista ${shown + 1} de ${hints.length}`}</Button>}
    </div>
  );
}

/** Stepwise solution reveal. */
export function Solucion({ steps, values }: { steps: ExerciseSpec['steps']; values: Record<string, number> }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="ses-block">
      <ol className="ses-steps" aria-label="Solución">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="ses-reveal">
            <strong>{s.title}.</strong> <RichText>{interpolate(s.body, values)}</RichText>
          </li>
        ))}
      </ol>
      {shown < steps.length && <Button onClick={() => setShown(shown + 1)}>{shown ? 'Siguiente paso' : 'Ver la solución paso a paso'}</Button>}
    </div>
  );
}

/** Numeric input with tolerance and immediate feedback on submit. */
export function Respuesta({ label, unit, target, tolerance, onResult }: {
  label: string; unit?: string; target: number; tolerance: Tolerance; onResult: (ok: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [ok, setOk] = useState<boolean | null>(null);
  return (
    <form className="ses-answer" onSubmit={(e) => {
      e.preventDefault();
      const good = withinTolerance(parseNumber(value), target, tolerance);
      setOk(good);
      onResult(good);
    }}>
      <label>
        <span className="ctl-label">{label}{unit ? ` (${unit})` : ''}</span>
        <input inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setOk(null); }} />
      </label>
      <button type="submit" className="ctl-button">Comprobar</button>
      {ok !== null && (
        <div className={`quiz-feedback ${ok ? 'right' : 'wrong'}`} role="status" data-testid="feedback">
          <strong>{ok ? 'Correcto.' : 'No es correcto.'}</strong> {ok ? '' : 'Revisa el planteamiento o usa una pista.'}
        </div>
      )}
    </form>
  );
}

export default function Ejercicio({ slug, index, exercise }: { slug: string; index: number; exercise: ExerciseSpec }) {
  const [n, setN] = useState(0); // 0 = canonical numbers of the source set
  const values = n === 0
    ? Object.fromEntries(exercise.parameters.map((p) => [p.id, p.default]))
    : variant(exercise.parameters, exercise.seed + n);
  const [solved, setSolved] = useState<Record<string, boolean>>({});
  useEffect(() => { setSolved({}); }, [n]);
  const canVary = exercise.parameters.some((p) => p.min !== undefined && p.max !== undefined);
  return (
    <section className="widget ses-exercise" aria-labelledby={`${slug}-${exercise.id}`}>
      <h2 className="widget-title" id={`${slug}-${exercise.id}`}>Ejercicio {index + 1}</h2>
      {exercise.difficulty && <p className="ses-level">Dificultad {exercise.difficulty}: {['introductorio', 'intermedio', 'avanzado'][exercise.difficulty - 1]}</p>}
      <p className="ses-statement"><RichText>{interpolate(exercise.statement, values)}</RichText></p>
      {exercise.parameters.length > 0 && (
        <dl className="readout-grid ses-params" aria-label="Datos">
          {exercise.parameters.map((p) => (
            <div key={p.id} style={{ display: 'contents' }}>
              <dt>{p.label}</dt><dd data-testid={`param-${p.id}`}>{fmt(values[p.id])}{p.unit ? ` ${p.unit}` : ''}</dd>
            </div>
          ))}
        </dl>
      )}
      {canVary && <Button onClick={() => setN(n + 1)}>Nueva variante</Button>}
      <Pista key={`h${n}`} hints={exercise.hints} values={values} />
      {exercise.answers.map((a) => (
        <Respuesta
          key={`${a.id}${n}`}
          label={a.label}
          unit={a.unit}
          target={expected(a, values)}
          tolerance={a.tolerance}
          onResult={(ok) => {
            setSolved((s) => ({ ...s, [a.id]: ok }));
            if (ok && exercise.answers.every((x) => x.id === a.id || solved[x.id])) markSolved(slug, exercise.id);
          }}
        />
      ))}
      <Solucion key={`s${n}`} steps={exercise.steps} values={withAnswers(exercise.answers, values)} />
    </section>
  );
}
