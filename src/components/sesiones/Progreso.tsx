import { useEffect, useState } from 'react';
import { readSolved } from './progress';

/** "2 de 5 resueltos", read from localStorage after hydration. */
export default function Progreso({ slug, total }: { slug: string; total: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const update = () => setN(readSolved(slug).length);
    update();
    window.addEventListener('ef-progress', update);
    return () => window.removeEventListener('ef-progress', update);
  }, [slug]);
  return <span className="ses-progress num">{n} de {total} resueltos</span>;
}
