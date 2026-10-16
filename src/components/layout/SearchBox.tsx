import { useEffect, useId, useRef, useState } from 'react';
import { rankSearch, type SearchEntry } from '../../lib/search';
import './search.css';

// Both navigation instances share one request. A failed request can be retried.
let indexRequest: Promise<SearchEntry[]> | undefined;
function loadIndex(indexUrl: string) {
  return indexRequest ??= fetch(indexUrl).then((response) => {
    if (!response.ok) throw new Error('Search index unavailable');
    return response.json() as Promise<SearchEntry[]>;
  }).catch((error) => { indexRequest = undefined; throw error; });
}

export default function SearchBox({ indexUrl }: { indexUrl: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = rankSearch(entries, query);
  const visible = open && query.trim().length > 0;
  const labels = { chapter: 'Capítulo', session: 'Sesión', glossary: 'Glosario' };

  function ensureIndex() {
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    loadIndex(indexUrl).then((data) => { setEntries(data); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      const field = input.current;
      if (!field) return;
      const menu = field.closest('details');
      if (menu && getComputedStyle(menu).display !== 'none') menu.open = true;
      if (!field.getClientRects().length) return;
      event.preventDefault();
      field.focus();
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (visible && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, visible, id]);

  return <div className="course-search" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <label htmlFor={id}>Buscar en el curso <span aria-hidden="true">/</span></label>
    <input ref={input} id={id} type="search" role="combobox" autoComplete="off"
      placeholder="Tema o término…" value={query} aria-autocomplete="list"
      aria-expanded={visible} aria-controls={`${id}-results`}
      aria-activedescendant={visible && active >= 0 ? `${id}-${active}` : undefined}
      onFocus={() => { ensureIndex(); setOpen(true); }}
      onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); ensureIndex(); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (results.length) setActive((previous) => event.key === 'ArrowDown'
            ? (previous + 1) % results.length : (previous <= 0 ? results.length : previous) - 1);
        }
        if (event.key === 'Enter' && visible && results.length) {
          event.preventDefault(); window.location.assign(results[active < 0 ? 0 : active].url);
        }
      }} />
    <p className="search-status" role="status" aria-live="polite">
      {visible && (status === 'error' ? 'No se pudo cargar la búsqueda. Vuelve a escribir para reintentar.'
        : status !== 'ready' ? 'Cargando…' : results.length ? `${results.length} resultados` : 'Sin resultados.')}
    </p>
    <ul id={`${id}-results`} role="listbox" aria-label="Resultados de búsqueda" hidden={!visible || !results.length}>
      {results.map((entry, index) => <li key={entry.url} id={`${id}-${index}`} role="option" aria-selected={active === index}>
        <a href={entry.url} tabIndex={-1} onMouseEnter={() => setActive(index)}>
          <small>{labels[entry.kind]}</small>
          <strong>{entry.title}</strong>
          <span>{entry.excerpt}</span>
        </a>
      </li>)}
    </ul>
  </div>;
}
