/**
 * The course outline (docs/AUDIT.md section 4, as settled by DEC-002 option B).
 * Chapters that exist as MDX files in src/content/chapters/ are linked; the rest
 * show as "Próximamente". `slug` is the MDX file name once written.
 * A Vitest test (tests/curriculum.test.ts) keeps this in sync with AUDIT.md and the content.
 */
export interface ChapterInfo {
  number: number;
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  prerequisites: number[];
}

export interface PartInfo {
  number: number;
  roman: string;
  title: string;
  difficulty: string;
  chapters: ChapterInfo[];
}

export const parts: PartInfo[] = [
  {
    number: 1, roman: 'I', title: 'Valor del dinero en el tiempo', difficulty: '●',
    chapters: [
      { number: 1, slug: '01-interes', title: 'Interés simple y compuesto; tasas fraccionadas', difficulty: 1, prerequisites: [] },
      { number: 2, slug: '02-valor-actual', title: 'Valor actual, rentas y perpetuidades', difficulty: 1, prerequisites: [1] },
      { number: 3, slug: '03-van-tir', title: 'VAN, TIR y otros criterios', difficulty: 2, prerequisites: [2] },
    ],
  },
  {
    number: 2, roman: 'II', title: 'Valorar acciones y empresas', difficulty: '●●',
    chapters: [
      { number: 4, slug: '04-dividendos', title: 'Valorar una acción: modelo de descuento de dividendos', difficulty: 2, prerequisites: [2] },
      { number: 5, slug: '05-empresa-wacc', title: 'Valorar una empresa: FCFF, FCFE y WACC', difficulty: 2, prerequisites: [4] },
      { number: 6, slug: '06-rentabilidad-riesgo', title: 'Rentabilidad y riesgo de un activo', difficulty: 2, prerequisites: [4] },
    ],
  },
  {
    number: 3, roman: 'III', title: 'Carteras y CAPM', difficulty: '●●●',
    chapters: [
      { number: 7, slug: '07-dos-activos', title: 'Dos activos: correlación y diversificación', difficulty: 2, prerequisites: [6] },
      { number: 8, slug: '08-markowitz', title: 'Markowitz: varios activos y frontera eficiente', difficulty: 3, prerequisites: [7] },
      { number: 9, slug: '09-activo-libre-riesgo', title: 'Activo libre de riesgo: CAL y cartera tangente', difficulty: 3, prerequisites: [8] },
      { number: 10, slug: '10-capm', title: 'CAPM: CML, SML y beta', difficulty: 3, prerequisites: [9] },
      { number: 11, slug: '11-mas-alla-capm', title: 'Más allá del CAPM: estudios de eventos, Fama-French y APT', difficulty: 3, prerequisites: [10] },
    ],
  },
  {
    number: 4, roman: 'IV', title: 'Mercados', difficulty: '●●',
    chapters: [
      { number: 12, slug: '12-estructura-mercado', title: 'Estructura de mercado: mercados y participantes', difficulty: 1, prerequisites: [] },
      { number: 13, slug: '13-negociacion', title: 'Negociación: órdenes, margen, ventas en corto y costes', difficulty: 2, prerequisites: [12] },
      { number: 14, slug: '14-opv', title: 'Ofertas públicas de venta (OPV)', difficulty: 2, prerequisites: [5] },
      { number: 15, slug: '15-eficiencia', title: 'Eficiencia de mercado', difficulty: 2, prerequisites: [11] },
      { number: 16, slug: '16-conductuales', title: 'Finanzas conductuales', difficulty: 1, prerequisites: [15] },
    ],
  },
  {
    number: 5, roman: 'V', title: 'Renta fija y derivados', difficulty: '●●●',
    chapters: [
      { number: 17, slug: '17-bonos', title: 'Bonos: precio, TIR y cupón corrido', difficulty: 2, prerequisites: [2] },
      { number: 18, slug: '18-estructura-temporal', title: 'Estructura temporal y tipos forward', difficulty: 3, prerequisites: [17] },
      { number: 19, slug: '19-duracion', title: 'Duración y riesgo de tipo de interés', difficulty: 3, prerequisites: [17] },
      { number: 20, slug: '20-forwards-futuros', title: 'Forwards y futuros', difficulty: 3, prerequisites: [18] },
      { number: 21, slug: '21-opciones', title: 'Opciones: pagos y estrategias', difficulty: 3, prerequisites: [20] },
    ],
  },
];

/** Problem-session track (DEC-001): separate from the chapters. */
export const sessions = [
  { number: 1, title: 'Sesión 1: valor del dinero en el tiempo', chapters: [1, 2, 3] },
  { number: 2, title: 'Sesión 2: acciones, empresas y riesgo', chapters: [4, 5, 6] },
  { number: 3, title: 'Sesión 3: carteras y CAPM', chapters: [7, 8, 9, 10] },
  { number: 4, title: 'Sesión 4: mercados, renta fija y derivados', chapters: [11, 13, 17, 18, 19, 20, 21] },
];
export const finalExam = { title: 'Examen final: práctica por dificultad', slug: 'examen-final', chapters: [2, 3, 4, 5, 7, 10, 17, 19] };

/** Absolute URL path under the configured base (`/economia-financiera`). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
