# Economía Financiera

Curso interactivo, en español y al estilo 3Blue1Brown, de Economía Financiera. Primero ves la imagen, después la fórmula, y puedes mover los deslizadores tú mismo.

![Vista previa](public/course-preview.svg)

## Qué es

- **Capítulos** (21, en cinco partes): valor del dinero en el tiempo, valoración, carteras y CAPM, mercados, renta fija y derivados.
- **Sesiones de problemas**: una pista aparte, con ejercicios de datos variables, pistas graduales y solución paso a paso.

## Para quién

Estudiantes de un curso de Economía Financiera. No hace falta cuenta ni servidor: es un sitio estático.

Modelo: [options-explained](https://github.com/jesusvillota/options-explained). La profundidad en opciones se enlaza allí.

## Cómo ejecutarlo

1. `npm ci`
2. `npm run dev` (servidor local)
3. `npm test && npm run build` (pruebas y compilación)
4. `npm run preview` (ver el sitio compilado)

Más detalle del proceso en `CLAUDE.md` y `docs/STYLE_GUIDE.md`. El plan vive en `goals/course-site/`.

## Despliegue

URL pública: <https://jesusvillota.github.io/economia-financiera/>.

1. Usa Node.js 22 (versión 22.12.0 o posterior de la rama 22), como el flujo de despliegue.
2. Ejecuta `npm ci && npm test && npm run build`. El sitio compilado queda en `dist/`.
3. En GitHub, selecciona **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Publica los cambios en `main`. El flujo `.github/workflows/ci.yml` compila y despliega `dist/` en Pages.

Astro usa `site: 'https://jesusvillota.github.io'` y `base: '/economia-financiera'`.
El despliegue usa el artefacto de Pages, sin Jekyll; no necesita `.nojekyll`.

## Licencia

Código: MIT (`LICENSE`). Contenido: CC BY 4.0 (`LICENSE-CONTENT.md`).
