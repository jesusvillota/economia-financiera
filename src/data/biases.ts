export const biases = [
  { id: 'confianza', label: 'Exceso de confianza' },
  { id: 'rebano', label: 'Efecto rebaño' },
  { id: 'perdidas', label: 'Aversión a las pérdidas' },
  { id: 'anclaje', label: 'Anclaje' },
  { id: 'cuentas', label: 'Contabilidad mental' },
] as const;
export type BiasId = typeof biases[number]['id'];

export const biasExamples: { id: string; text: string; answer: BiasId; why: string }[] = [
  { id: 'pronostico', text: 'Lucía descarta cualquier error en su previsión porque cree que su análisis nunca falla.', answer: 'confianza', why: 'Confunde su confianza con la precisión real de su información.' },
  { id: 'grupo', text: 'Pablo abandona su propio análisis y compra solo porque todo su grupo está comprando.', answer: 'rebano', why: 'Sustituye su información por la conducta del grupo.' },
  { id: 'simetria', text: 'Inés siente más malestar por una pérdida que satisfacción por una ganancia del mismo importe.', answer: 'perdidas', why: 'Compara cambios iguales desde el mismo punto de referencia y los valora de forma asimétrica.' },
  { id: 'precio', text: 'Hugo mantiene su valoración inicial pese a noticias que reducen los pagos esperados de la empresa.', answer: 'anclaje', why: 'Da demasiado peso a la cifra inicial y ajusta poco ante la información nueva.' },
  { id: 'etiqueta', text: 'Sara acepta con dinero de un premio una apuesta que rechaza con su salario, sin cambiar su riqueza ni sus objetivos.', answer: 'cuentas', why: 'La etiqueta del dinero cambia la decisión, aunque la situación económica sea la misma.' },
];

export function biasScore(answers: Partial<Record<string, BiasId>>): number {
  return biasExamples.filter((example) => answers[example.id] === example.answer).length;
}
