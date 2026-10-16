import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TK1992, prospectValue, probabilityWeight, gambleExpectedValue, gambleProspectValue } from '../src/lib/finance/efficiency';
import { biases, biasExamples, biasScore } from '../src/data/biases';
import { parts } from '../src/data/curriculum';

const chapter = readFileSync('src/content/chapters/16-conductuales.mdx', 'utf8');
const parameters = { ...TK1992, lambda: 2, gamma: 1 };
const num = (x: number) => x.toFixed(2).replace('.', ',');

describe('capítulo 16: cada número del texto y los ejemplos', () => {
  it('respeta las seis secciones, tres Quiz, widgets y metadatos del currículo', () => {
    expect([...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]))
      .toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    for (const widget of ['ProspectExplorer', 'BiasExamples']) expect(chapter).toContain(`<${widget} client:visible />`);
    const entry = parts.flatMap((part) => part.chapters).find((c) => c.number === 16)!;
    expect(entry).toMatchObject({ slug: '16-conductuales', difficulty: 1, prerequisites: [15] });
    for (const line of ['part: 4', 'chapter: 16', 'difficulty: 1', 'prerequisites: [15]', 'sessions: []']) expect(chapter).toContain(line);
  });

  it('moneda: +150, −100, probabilidades 0,5 y esperanza 25; 50 es un distractor', () => {
    expect(gambleExpectedValue([150, -100], [0.5, 0.5])).toBe(25);
    expect(chapter).toContain('ganas 150 €');
    expect(chapter).toContain('pierdes 100 €');
    expect(chapter).toContain('25 € por apuesta');
    expect(gambleExpectedValue([150, -100], [0.5, 0.5])).not.toBe(50);
    expect(chapter).toContain("options={['50 €', '25 €', 'Siempre pierdes dinero']}");
  });

  it('curvaturas 0,88, λ=2, valores ±100, razón 2 y origen 0', () => {
    expect(TK1992.alpha).toBe(0.88);
    expect(TK1992.beta).toBe(0.88);
    expect(prospectValue(100, parameters)).toBeCloseTo(57.54, 2);
    expect(prospectValue(-100, parameters)).toBeCloseTo(-115.09, 2);
    expect(chapter).toContain('\\approx' + num(prospectValue(100, parameters)).replace(',', '{,}'));
    expect(chapter).toContain(num(prospectValue(-100, parameters)).replace(',', '{,}'));
    expect(prospectValue(-100, parameters) / prospectValue(100, parameters)).toBe(-2);
    expect(prospectValue(0, parameters)).toBe(0);
  });

  it('V inicial −16,44; λ=1 da 12,34; λ=3 baja V sin cambiar la esperanza', () => {
    const value = (lambda: number) => gambleProspectValue([150, -100], [0.5, 0.5], { ...parameters, lambda });
    expect(value(2)).toBeCloseTo(-16.44, 2);
    expect(chapter).toContain(`−${num(-value(2))}`);
    expect(value(1)).toBeCloseTo(12.34, 2);
    expect(chapter).toContain(num(value(1)));
    expect(value(3)).toBeLessThan(value(2));
    for (const lambda of [1, 2, 3]) {
      expect(prospectValue(-100, { ...parameters, lambda })).toBeCloseTo(-lambda * prospectValue(100, parameters));
      expect(gambleExpectedValue([150, -100], [0.5, 0.5])).toBe(25);
    }
    // At λ=1 curvature still changes attitudes to risk on the gains branch.
    expect(gambleProspectValue([0, 100], [0.5, 0.5], { ...parameters, lambda: 1 }))
      .toBeLessThan(prospectValue(50, { ...parameters, lambda: 1 }));
  });

  it('γ=1 restaura probabilidades; γ=0,61 ilustra pesos que no suman uno', () => {
    expect(TK1992.gamma).toBe(0.61);
    for (const p of [0, 0.01, 0.5, 0.99, 1]) expect(probabilityWeight(p, parameters)).toBeCloseTo(p, 14);
    expect(probabilityWeight(0.01)).toBeGreaterThan(0.01);
    expect(probabilityWeight(0.99)).toBeLessThan(0.99);
    expect(2 * probabilityWeight(0.5)).not.toBeCloseTo(1, 2);
    expect(chapter).toContain('No implementa la teoría de la perspectiva acumulativa completa');
  });

  it('cinco situaciones, cinco sesgos, clave y puntuación sin respuestas', () => {
    expect(biases).toHaveLength(5);
    expect(biasExamples).toHaveLength(5);
    expect(new Set(biasExamples.map((e) => e.answer)).size).toBe(5);
    expect(biasScore({})).toBe(0);
    const key = Object.fromEntries(biasExamples.map((e) => [e.id, e.answer]));
    expect(biasScore(key)).toBe(5);
    expect(biasScore({ ...key, pronostico: 'anclaje' })).toBe(4);
  });

  it('audit note 08 §4: utilidad cóncava clásica también trata cambios iguales de forma asimétrica', () => {
    const base = 1000;
    const gain = Math.log(base + 100) - Math.log(base);
    const loss = Math.log(base - 100) - Math.log(base);
    expect(-loss).toBeGreaterThan(gain);
    // A positive-mean gamble may be rejected with classical log utility, without a loss-aversion parameter.
    expect(gambleExpectedValue([200, -150], [0.5, 0.5])).toBe(25);
    const utility = [Math.log(300 + 200) - Math.log(300), Math.log(300 - 150) - Math.log(300)];
    expect(gambleExpectedValue(utility, [0.5, 0.5])).toBeLessThan(0);
  });

  it('inventario numérico: cualquier cifra nueva en el cuerpo requiere ampliar la cobertura', () => {
    const body = chapter.split('---')[2].replace(/^import .*;$/gm, '').replace(/\{,\}/g, ',');
    const numbers = [...new Set((body.match(/\d+(?:,\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.'))))].sort((a, b) => a - b);
    expect(numbers).toEqual([0, 0.5, 0.61, 0.88, 1, 2, 3, 12.34, 16.44, 25, 50, 57.54, 100, 115.09, 150]);
  });
});
