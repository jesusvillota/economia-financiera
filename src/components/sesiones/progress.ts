// Progress per session in localStorage; every access is guarded (private mode, blocked storage).
const key = (slug: string) => `ef:sesiones:${slug}`;

export function readSolved(slug: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(slug)) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function markSolved(slug: string, exerciseId: string) {
  try {
    const s = readSolved(slug);
    if (!s.includes(exerciseId)) localStorage.setItem(key(slug), JSON.stringify([...s, exerciseId]));
    window.dispatchEvent(new Event('ef-progress'));
  } catch { /* progress is optional */ }
}
