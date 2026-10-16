import { describe, expect, it } from 'vitest';
import { defaultDescription, pageMeta } from '../src/lib/seo';

const deployment = { site: 'https://jesusvillota.github.io', imagePath: '/economia-financiera/og.png' };

describe('page metadata', () => {
  it('uses the course title and default description on the landing page', () => {
    expect(pageMeta({ ...deployment, title: 'Economía Financiera', pathname: '/economia-financiera/' })).toEqual({
      title: 'Economía Financiera', description: defaultDescription,
      canonicalUrl: 'https://jesusvillota.github.io/economia-financiera/',
      imageUrl: 'https://jesusvillota.github.io/economia-financiera/og.png',
    });
  });

  it('keeps frontmatter text and resolves nested chapter URLs under the base', () => {
    const meta = pageMeta({ ...deployment, site: new URL(deployment.site), title: 'VAN, TIR y otros criterios',
      description: 'Compara inversión y valor: «hoy» & mañana.', pathname: '/economia-financiera/chapters/03-van-tir/' });
    expect(meta.title).toBe('VAN, TIR y otros criterios · Economía Financiera');
    expect(meta.description).toBe('Compara inversión y valor: «hoy» & mañana.');
    expect(meta.canonicalUrl).toBe('https://jesusvillota.github.io/economia-financiera/chapters/03-van-tir/');
    expect(meta.imageUrl).toBe('https://jesusvillota.github.io/economia-financiera/og.png');
  });

  it.each([undefined, '', '  '])('falls back when a description is empty (%s)', (description) => {
    expect(pageMeta({ ...deployment, title: 'Glosario', description, pathname: '/economia-financiera/glosario/' }).description)
      .toBe(defaultDescription);
  });

  it('also supports deployment at a domain root', () => {
    const meta = pageMeta({ site: 'https://example.org', imagePath: '/og.png', title: 'Sesiones', pathname: '/sesiones/' });
    expect(meta.canonicalUrl).toBe('https://example.org/sesiones/');
    expect(meta.imageUrl).toBe('https://example.org/og.png');
  });
});
