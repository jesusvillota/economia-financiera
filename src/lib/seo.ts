export const siteTitle = 'Economía Financiera';
export const defaultDescription = 'Curso interactivo y visual de Economía Financiera: 21 capítulos, cuatro sesiones de problemas y preparación del examen final.';

interface PageMetaOptions {
  title: string;
  description?: string;
  pathname: string;
  site: URL | string;
  imagePath: string;
}

/** Shared metadata for HTML, Open Graph and Twitter; URLs include the deployed base. */
export function pageMeta({ title, description, pathname, site, imagePath }: PageMetaOptions) {
  return {
    title: title === siteTitle ? title : `${title} · ${siteTitle}`,
    description: description?.trim() || defaultDescription,
    canonicalUrl: new URL(pathname, site).href,
    imageUrl: new URL(imagePath, site).href,
  };
}
