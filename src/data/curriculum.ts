/**
 * The course outline. Chapters that exist as MDX files in src/content/chapters/
 * are linked; the rest show as "próximamente". Placeholder until the real curriculum lands.
 */
export interface PartInfo {
  number: number;
  roman: string;
  title: string;
  difficulty: string;
  chapters: { number: number; title: string }[];
}

export const parts: PartInfo[] = [
  {
    number: 1, roman: 'I', title: 'Ejemplo', difficulty: '●',
    chapters: [{ number: 1, title: 'Capitalización compuesta (ejemplo)' }],
  },
];

/** Absolute URL path under the configured base (`/economia-financiera`). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}
