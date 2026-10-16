import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parts } from '../src/data/curriculum';
import {
  venues, examples, score, shuffledExamples, participants, bmeSession,
  settlementDays, usT1Year, euT1, mifid2Year, moneyMarketMaxYears, type VenueId,
} from '../src/data/venues';

const chapter = readFileSync('src/content/chapters/12-estructura-mercado.mdx', 'utf8');
const words = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'];
const yesNo = (b: boolean) => (b ? 'Sí' : 'No');

describe('capítulo 12: cada número y cada tabla del texto salen de src/data/venues.ts', () => {
  it('seis secciones en el orden de la plantilla y tres quizzes', () => {
    const tags = [...chapter.matchAll(/^## <span class="section-tag">([^<]+)<\/span>/gm)].map((m) => m[1]);
    expect(tags).toEqual(['Gancho', 'Intuición', 'Formalización', 'Zona de juego', 'Compruébalo', 'Resumen']);
    expect(chapter.match(/<Quiz client:visible/g)).toHaveLength(3);
    expect(chapter).toContain('<VenueSorter client:visible />');
    expect(chapter).toMatch(/^sessions: \[\]$/m);
  });

  it('el clasificador: ocho situaciones, seis casillas, cada casilla con al menos una situación', () => {
    expect(examples).toHaveLength(8);
    expect(venues).toHaveLength(6);
    expect(chapter).toContain(`las ${words[examples.length]} situaciones`);
    expect(chapter).toContain(`las ${words[venues.length]} casillas`);
    for (const v of venues) expect(examples.some((e) => e.answer === v.id)).toBe(true);
    expect(new Set(examples.map((e) => e.id)).size).toBe(examples.length);
  });

  it('«Prueba esto»: la 6 es el internalizador y la 8 el OTC puntual en el orden inicial', () => {
    const order = shuffledExamples(0);
    expect(order).toEqual(examples);
    const six = order[5];
    const eight = order[7];
    expect([six.answer, eight.answer]).toEqual(['si', 'otc']);
    expect(six.text).toContain('de forma organizada');
    expect(eight.text).toContain('de forma puntual');
    expect(chapter).toContain(`Compara la ${order.indexOf(six) + 1} con la ${order.indexOf(eight) + 1}`);
  });

  it('puntuación: la clave da 8 de 8, vacío 0, y cada error resta uno', () => {
    const key = Object.fromEntries(examples.map((e) => [e.id, e.answer]));
    expect(score(key)).toBe(8);
    expect(score({})).toBe(0);
    expect(score({ ...key, swap: 'si', bloque: 'smn' })).toBe(6);
  });

  it('el orden barajado es una permutación reproducible por semilla', () => {
    for (const seed of [1, 2, 3]) {
      const a = shuffledExamples(seed);
      expect(a).toEqual(shuffledExamples(seed));
      expect([...a].sort((x, y) => x.id.localeCompare(y.id))).toEqual([...examples].sort((x, y) => x.id.localeCompare(y.id)));
    }
    expect(shuffledExamples(1).map((e) => e.id)).not.toEqual(examples.map((e) => e.id));
  });

  it('tabla de centros: cada fila coincide con las propiedades del fichero de datos', () => {
    const who: Record<VenueId, string> = { regulado: 'Reglas fijas', smn: 'Reglas fijas', soc: 'El operador, con margen', oscuro: 'Reglas fijas', si: 'El banco decide si opera', otc: 'Las dos partes' };
    const seen: Record<VenueId, string> = { regulado: 'Libro de órdenes', smn: 'Libro de órdenes', soc: 'Cotizaciones y órdenes', oscuro: 'Nada', si: 'Cotizaciones firmes', otc: 'Nada' };
    for (const v of venues) {
      expect(v.discretionary).toBe(!who[v.id].startsWith('Reglas fijas'));
      expect(v.preTradeVisible).toBe(seen[v.id] !== 'Nada');
      expect(chapter).toContain(`| ${v.label} | ${yesNo(v.tradingVenue)} | ${v.multilateral ? 'Muchas' : 'Dos'} | ${who[v.id]} | ${seen[v.id]} |`);
    }
  });

  it('MiFID II: tres centros de negociación, todos multilaterales, desde 2018', () => {
    const tradingVenues = venues.filter((v) => v.tradingVenue && v.id !== 'oscuro');
    expect(tradingVenues.map((v) => v.id)).toEqual(['regulado', 'smn', 'soc']);
    expect(venues.filter((v) => v.tradingVenue).every((v) => v.multilateral)).toBe(true);
    expect(chapter).toContain(`se aplican desde ${mifid2Year}. Definen ${words[tradingVenues.length]} **centros de negociación**`);
    expect(chapter).toContain(`define ${words[tradingVenues.length]} centros de negociación multilaterales`);
  });

  it('participantes y estrategias: tablas generadas desde los datos', () => {
    for (const p of participants) {
      const kind = { intermediario: 'Intermediario', mediador: 'Mediador', estrategia: '' }[p.kind];
      const row = kind ? `| ${p.label} | ${kind} | ${yesNo(p.ownAccount)} |` : `| ${p.label} | ${yesNo(p.ownAccount)} |`;
      expect(chapter).toContain(row);
    }
  });

  it('sesión de BME, liquidación y plazo del mercado monetario', () => {
    for (const s of bmeSession) expect(chapter).toContain(`| ${s.phase} | ${s.from} | ${s.to} |`);
    bmeSession.slice(1).forEach((s, i) => expect(s.from).toBe(bmeSession[i].to));
    expect(chapter).toContain(`es hoy T+${settlementDays}, es decir, ${words[settlementDays]} días hábiles`);
    expect(chapter).toContain(`pasó a T+1 en ${usT1Year} y la UE lo tiene previsto para ${euT1.month} de ${euT1.year}`);
    expect(chapter).toContain(`Monetario (hasta ${moneyMarketMaxYears} año) o de capitales (más de ${moneyMarketMaxYears} año)`);
  });

  it('las referencias a otros capítulos apuntan a los temas correctos', () => {
    const chapters = parts.flatMap((p) => p.chapters);
    const slug = (n: number) => chapters.find((c) => c.number === n)!.slug;
    expect(chapter).toContain('la estudiamos en el capítulo 14');
    expect(slug(14)).toBe('14-opv');
    expect(chapter).toContain('vuelven en el capítulo 20');
    expect(slug(20)).toBe('20-forwards-futuros');
    expect(chapters.find((c) => c.number === 12)!.slug).toBe('12-estructura-mercado');
  });

  it('cinco criterios de clasificación en la tabla', () => {
    const rows = chapter.split('### Cinco formas')[1].split('###')[0].match(/^\| (?!Criterio|---)[^|]+ \|/gm);
    expect(rows).toHaveLength(5);
  });
});

describe('audit note 05: corrections used by chapter 12', () => {
  it('audit note 05 §2: speculators and arbitrageurs trade on own account, so they are not brokers', () => {
    const byId = Object.fromEntries(participants.map((p) => [p.id, p]));
    expect(byId.broker.ownAccount).toBe(false);
    for (const id of ['especulador', 'arbitrajista', 'cobertura']) {
      expect(byId[id].kind).toBe('estrategia');
      expect(byId[id].ownAccount).toBe(true);
    }
  });

  it('audit note 05 §4: MiFID II has three trading venues; an SI is bilateral and not a venue', () => {
    const si = venues.find((v) => v.id === 'si')!;
    expect(si.tradingVenue).toBe(false);
    expect(si.multilateral).toBe(false);
    const dark = venues.find((v) => v.id === 'oscuro')!;
    expect(dark.multilateral).toBe(true);
    expect(venues.filter((v) => v.tradingVenue && v.preTradeVisible).map((v) => v.id)).toEqual(['regulado', 'smn', 'soc']);
  });
});
