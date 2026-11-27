# Milestone 5 — Public Restaurant Website

- **Estado**: ✅ Completo, pendiente de fusionar la PR 3 (`feat/m5-seo`). PRs [#8](https://github.com/danilokosam/rstaurante/pull/8) y [#9](https://github.com/danilokosam/rstaurante/pull/9) fusionadas con squash. Al fusionar la PR 3, M5 queda cerrado.
- **Inicio**: 2026-11-27.

## Decisiones del propietario (2026-11-27)

- **Tres PRs**: `feat/m5-foundation`, `feat/m5-home-menu` y `feat/m5-seo`.
- **`@axe-core/playwright`** se añade como dependencia de desarrollo (versión exacta) para verificar RNF-02.
- **404 global con diseño**: se activa `experimental.globalNotFound` (Next.js 16.4) con `app/global-not-found.tsx`, cubierto por un E2E.

## Objetivo

Construir la web pública del restaurante en español e inglés a partir del contenido del CMS: portada con sus secciones, carta `/{locale}/menu` con precios en EUR y alérgenos, cabecera con selector de idioma, pie, WhatsApp, páginas 404/error, SEO completo (metadata, Open Graph, canónica, `hreflang`, sitemap, robots, JSON-LD), responsive desde 360 px y accesible (axe), con los cambios del CMS visibles nada más guardar.

## Requisitos y user stories cubiertos

- **Requisitos**: `RF-WEB-01` a `RF-WEB-07`, `RF-I18N-01`, `RF-I18N-03`, `RF-I18N-04`, `RF-PUB-01` (E2E), `RF-PUB-02`, `RNF-01` (comprobación manual; formal en M7), `RNF-02`, `RNF-03`, `RNF-10`.
- **User stories**: `US-F1` a `US-F5`; parte pública de `US-E1` CA2, `US-E2` CA3, `US-E3` CA1, `US-E4`, `US-E5` CA2–CA4.
- **ADRs**: [ADR-0007](../decisions/ADR/ADR-0007-publishing-and-caching.md), [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md), [ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md).
- **Pendientes heredados**:
  - De M3: revalidación de respaldo cada hora; E2E «cambio guardado visible en la web»; ocultar el botón de WhatsApp de la portada si no hay número; «Cerrado» los días sin franjas; enlace de Maps generado desde la dirección si no hay URL.
  - De M4: carta pública en el orden del panel, `unavailable` atenuado con aviso, alérgenos como texto y aviso fijo, formato de precios (`src/lib/price.ts`), destacados en la portada (hasta 6).

## Verificaciones previas (Next.js 16.4.6, `node_modules/next/dist/docs/`)

- El proyecto no usa Cache Components (`cacheComponents` no está activado): aplica el modelo de caché «previo». Las páginas con `generateStaticParams` y sin APIs de petición se generan estáticamente; `export const revalidate = 3600` da el respaldo de 1 hora (RF-PUB-02) y el `revalidatePath('/', 'layout')` de M3 las invalida al guardar.
- `generateMetadata` admite `alternates.canonical` y `alternates.languages` (hreflang); `sitemap.ts` admite `alternates.languages` por URL; `robots.ts` como archivo de metadatos.
- El layout raíz está en `[locale]`, así que una URL sin ruta (p. ej. `/es/no-existe` sí cae en `[locale]/not-found.tsx`, pero `/xx/yy` o `/foo.txt` no) usa la 404 por defecto de Next. Para darle el diseño del sitio hace falta `app/global-not-found.tsx` con `experimental.globalNotFound` (aprobado: ver decisiones del propietario).
- `error.tsx` debe ser un Client Component y no envuelve el layout del mismo segmento; `global-error.tsx` cubre errores del layout raíz.

## Propuesta de organización: tres PRs

### PR 1 — `feat/m5-foundation`: base, contenido y estructura

1. **Diccionarios** `src/i18n/dictionaries/{es,en}.ts` (textos fijos: navegación, días, «Cerrado», «No disponible», aviso de alergias, títulos por defecto de secciones, 404/error, etiquetas de contacto) y `getDictionary(locale)`.
2. **Lógica pura en `src/lib`** (TDD unitario):
   - `price.ts`: `formatPrice(value, locale)` → `12,50 €` / `€12.50` (EUR fijo, `es-ES` / `en-IE`).
   - `hours.ts`: agrupar franjas por día en orden lunes→domingo, días sin franjas = «Cerrado», cruce de medianoche, formato por idioma.
   - `links.ts`: `tel:` normalizado, `wa.me` con mensaje codificado, enlace de Maps (URL configurada o búsqueda generada desde la dirección).
   - `localePath.ts`: ruta equivalente en el otro idioma (selector) y URLs absolutas desde `NEXT_PUBLIC_SERVER_URL`.
3. **Capa de contenido** `src/lib/content/` (Local API con `overrideAccess: false`, `locale` y _fallback_ a español; TDD de integración): `getSiteSettings`, `getHomepage`, `getGallery`, `getMenu` (categorías visibles con sus platos no ocultos, en el orden del panel; sin categorías vacías), `getFeaturedDishes` (hasta 6, no ocultos, de categorías visibles, en el orden de la carta).
4. **Layout público**: cabecera (logo o nombre, navegación Inicio/Carta, selector de idioma que mantiene la página), pie (contacto, redes, horario), botón flotante de WhatsApp solo si hay número; `revalidate = 3600`; `[locale]/not-found.tsx`, `[locale]/error.tsx`, `global-error.tsx` y `global-not-found.tsx` (`experimental.globalNotFound`).
5. **Imágenes**: componente sobre `next/image` con tamaños de `media` (`thumbnail`/`card`/`hero`) y `alt` localizado; `remotePatterns` desde `S3_PUBLIC_URL` cuando haya almacenamiento S3.

### PR 2 — `feat/m5-home-menu`: portada y carta

1. **Portada** (`RF-WEB-01`), en orden fijo y sin renderizar secciones vacías: hero (CTA según acción; `whatsapp` oculto si no hay número), sobre nosotros (párrafos por línea en blanco, sin HTML), destacados, galería (rejilla simple, sin _lightbox_), horario, ubicación/contacto («Cómo llegar», `tel:`, WhatsApp).
2. **Carta** `/{locale}/menu` (`RF-WEB-02`): categorías y platos en el orden del panel, precio formateado, imagen opcional, `unavailable` atenuado con «No disponible», alérgenos como texto en el idioma de la página (sin lista si no hay) y aviso fijo de alergias.
3. **Responsive** desde 360 px sin scroll horizontal y **accesibilidad** (HTML semántico, foco visible, contraste, navegación por teclado).
4. **E2E**: navegación es/en y selector de idioma; carta con precios y alérgenos en ambos idiomas; `unavailable` visible y `hidden` ausente; WhatsApp solo con número; 360 px sin scroll horizontal; **axe sin violaciones _serious/critical_** en `/es`, `/en`, `/es/menu`, `/en/menu` y 404; **cambio guardado en `/admin` visible en la carta** (US-F4, RF-PUB-01).

### PR 3 — `feat/m5-seo`: SEO y cierre

1. `generateMetadata` por página: `title`/`description` (SEO del CMS con valores por defecto), Open Graph (imagen SEO o del hero), canónica por idioma y `hreflang` `es`/`en`/`x-default` → `es`.
2. `sitemap.ts` con alternativas por idioma y `robots.ts` (excluye `/admin` y `/api`; `Sitemap:` absoluto).
3. JSON-LD `Restaurant` en la portada (`src/lib/jsonLd.ts`, TDD): nombre, dirección, teléfono, URL, imagen, `openingHoursSpecification` desde las franjas, `hasMenu` → `/{locale}/menu`.
4. Comprobación manual de **Lighthouse** (móvil) en `/es` y `/es/menu` contra el build de producción local con contenido de ejemplo; resultado anotado aquí. La verificación formal con contenido demo es de M7.
5. Cierre: documentación, criterios de aceptación y pendientes trasladados.

## Hallazgos de la PR 1

- **Next.js 16.4**: el componente de `error.tsx` y `global-error.tsx` recibe `retry()` (vuelve a pedir y renderizar) además de `reset()`, y `error` llega como `unknown`. `not-found.tsx` no recibe props: el idioma se lee con `useParams`.
- **`global-not-found` funciona en el build** (`✓ globalNotFound`); sustituye la 404 por defecto en URLs sin ruta, también dentro de `/es/…`. Como se renderiza fuera de cualquier layout, el texto es bilingüe.
- **URLs de `media`**: con `serverURL` configurado, Payload devuelve URLs absolutas (`http://…/api/media/file/…`); `src/lib/imageSrc.ts` las convierte en rutas locales para `images.localPatterns` y deja las de S3, permitidas por `images.remotePatterns` desde `S3_PUBLIC_URL`.
- **E2E inestables en `main` (ya existían)**: con un único worker (CI), cada archivo E2E llamaba a `payload.destroy()`, que vacía el adaptador de BD sin quitar la instancia de la caché de `getPayload`; el archivo siguiente recibía una instancia rota (`Cannot read properties of undefined (reading 'id')`) y solo pasaba al reintentar. Se elimina `destroy()` de los E2E y se documenta en `tests/e2e/helpers/adminUser.ts`.
- **E2E contra el build de producción**: las páginas son estáticas (ISR), así que el E2E guarda `site-settings` por la API REST del servidor (como el panel) para que se ejecute la revalidación real; un cambio hecho con la Local API desde el proceso de Playwright no revalidaría la web.
- **Limpieza de la BD de desarrollo**: si `site-settings` no tenía versiones, el E2E lo devuelve al estado «sin guardar» al terminar. Las primeras ejecuciones locales de esta PR, anteriores a esa corrección, dejaron datos de prueba («Casa E2E …») en la BD de desarrollo del propietario; ver la nota en `MILESTONE.md`.

## Hallazgos de la PR 2

- **Bloqueos de documento huérfanos en los E2E**: Payload bloquea un documento mientras se edita en el panel. Los E2E borraban su usuario con `db.deleteMany` y dejaban el bloqueo sin usuario; durante 5 minutos el panel mostraba el global en blanco y el siguiente E2E fallaba. `deleteE2EUser` libera ahora los bloqueos del usuario antes de borrarlo.
- **Servidor de desarrollo**: en la suite completa con varios workers, el E2E de la portada falló una vez en unas ocho ejecuciones locales, esperando el formulario del panel durante la compilación bajo demanda de `next dev`. No se reproduce contra el build de producción (el modo de la CI). Se anota por si reaparece.
- **E2E de la portada**: si `homepage` no tenía versiones previas, el E2E lo devuelve al estado «sin guardar», como `site-settings`. Los datos de prueba que los E2E de M3 dejaron en `homepage` de la BD de desarrollo (21 versiones, todas de E2E) los limpió el propietario.
- **`cache` de React** en `src/lib/content`: el layout y la portada comparten la lectura de `site-settings` en la misma petición.
- **No disponible**: se atenúa con colores que mantienen el contraste AA (no con `opacity`) y con un aviso de texto, no solo con estilo.

## Hallazgos de la PR 3

- **`priority` de `next/image` está obsoleto en Next.js 16**: se sustituye por `preload` (inserta un `<link rel="preload">` en el `<head>`) o por `loading="eager"` / `fetchPriority="high"`, y la documentación pide no combinarlos. `CmsImage` usa `preload` en la imagen del hero (único candidato a LCP en todas las anchuras) y `loading="eager"` en el logo.
- **Favicon**: sin icono, el navegador pedía `/favicon.ico` (404) y Lighthouse lo contaba como error de consola (Best Practices 96). Se añade un icono neutro `src/app/icon.svg`; el icono a partir del logo es de M6.
- **`experimental.inlineCss` descartado**: medido en local, no mejora el LCP de la portada (sigue en 2,6 s simulados) y se aplicaría también al panel de Payload (la página de login pasa a 715 KB de HTML).
- **Medición de Lighthouse con imágenes sintéticas**: con colores lisos, Chrome descarta el hero como LCP (baja entropía) y el resultado no es representativo; con ruido gaussiano sin comprimir, el peor caso, la portada bajaba a 88. Las cifras de abajo usan imágenes con textura desenfocada, más parecidas a fotos.
- **`sitemap.ts` y `robots.ts`** van en la raíz de `src/app` (convención de archivos de metadatos), no dentro de `(frontend)` como anticipaba `folder-structure.md` (actualizado).

### Lighthouse (móvil, 2026-11-27)

Lighthouse 13.6.0, perfil móvil por defecto (4G lento simulado, CPU ×4), build de producción local, contenido de ejemplo ficticio (6 imágenes, 3 categorías, 15 platos) en la BD de tests:

| Página     | Performance | Accessibility | Best Practices | SEO | LCP       |
| ---------- | ----------- | ------------- | -------------- | --- | --------- |
| `/es`      | 97–99       | 100           | 100            | 100 | 2,0–2,6 s |
| `/en`      | 97          | 100           | 100            | 100 | 2,6 s     |
| `/es/menu` | 99–100      | 100           | 100            | 100 | 0,8–0,9 s |
| `/en/menu` | 100         | 100           | 100            | 100 | 0,9 s     |

RNF-01 exige ≥ 90 en las cuatro categorías (cumplido) y LCP < 2,5 s. En la portada, el LCP es la imagen del hero y queda en el límite (2,0–2,6 s) por la latencia simulada de la propia petición de la imagen (sin simulación tarda unos 60 ms). Se acepta en M5 y la verificación formal se hace en M7 con fotos reales del contenido demo y desplegado en Vercel.

## Criterios de aceptación

| Criterio                                                                                                         | Verificado | Evidencia                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| RF-WEB-01: portada en orden fijo y sin secciones vacías                                                          | ✅         | `page.tsx`, `public-menu.e2e`, `homepage.e2e`                           |
| RF-WEB-02 / US-F1 CA2: carta en orden, precios EUR por idioma, alérgenos como texto y aviso                      | ✅         | `content.int`, `formatPrice.test`, `public-menu.e2e`                    |
| RF-WEB-03: cabecera con logo/nombre y navegación; pie con contacto, redes y horario                              | ✅         | `site.e2e`                                                              |
| RF-WEB-04: botón de WhatsApp solo con número                                                                     | ✅         | `links.test`, `home.test`, `site.e2e`                                   |
| RF-WEB-05 / US-F3: metadatos, Open Graph, canónica, `hreflang`, sitemap, robots y JSON-LD `Restaurant`           | ✅         | `seo.test`, `jsonLd.test`, `site.e2e`                                   |
| RF-WEB-06: 404 y error con el diseño del sitio                                                                   | ✅         | `site.e2e` (404 dentro y fuera de `/{locale}`)                          |
| RF-WEB-07: la web no enlaza ni expone el panel; `/admin` y `/api` excluidos del rastreo                          | ✅         | `robots.txt` y sitemap en `site.e2e`                                    |
| RF-I18N-01/03/04, US-F5: es/en, textos fijos traducidos, selector que mantiene la página, _fallback_, `hreflang` | ✅         | `dictionaries.test`, `content.int`, `site.e2e`                          |
| RF-PUB-01 / US-F4: lo guardado en `/admin` se ve en la web en < 10 s                                             | ✅         | `public-menu.e2e`, `homepage.e2e`, `site.e2e`                           |
| RF-PUB-02: revalidación de respaldo de 1 hora                                                                    | ✅         | `revalidate = 3600` (ADR-0007, nota M5)                                 |
| US-E1 CA2, US-E2 CA3, US-E3 CA1, US-E4, US-E5 CA2–CA4 (parte pública de M4)                                      | ✅         | `content.int`, `public-menu.e2e`                                        |
| US-F2 CA1: `tel:`, `wa.me` y «Cómo llegar»                                                                       | ✅         | `links.test`, `site.e2e`                                                |
| RNF-01: Lighthouse móvil ≥ 90 y LCP < 2,5 s                                                                      | ⚠️         | ≥ 97 en todo; LCP de la portada en el límite (ver arriba; formal en M7) |
| RNF-02: sin violaciones _serious/critical_ de axe                                                                | ✅         | `site.e2e`, `public-menu.e2e`                                           |
| RNF-03: correcto desde 360 px                                                                                    | ✅         | `site.e2e`, `public-menu.e2e`                                           |
| RNF-10: sin cookies de seguimiento en la web pública                                                             | ✅         | Sin scripts de terceros ni analítica                                    |

## Pendientes trasladados

- **M6**: favicon e imagen Open Graph por defecto a partir del logo; temas y tipografías sobre las variables de `globals.css`.
- **M7**: Lighthouse formal y LCP de la portada con fotos reales del contenido demo y desplegado en Vercel; cabeceras de seguridad/CSP (el JSON-LD es un `<script>` inline: tenerlo en cuenta en la CSP); E2E en la CI contra el despliegue.

## Excluido

- Temas, paletas, tipografías de marca y logo como favicon → **M6**. M5 usa un diseño neutro y sobrio con Tailwind y tipografía del sistema, preparado para que M6 cambie colores y fuentes con variables CSS.
- Seed de contenido demo, Lighthouse formal, cabeceras de seguridad/CSP → **M7**.
- Mapa embebido, reservas, filtros de alérgenos, _lightbox_ de galería, rutas traducidas (`/en/menu` usa el mismo segmento) → fuera del MVP.

## Plan de tests (TDD)

| Nivel       | Qué                                                                                                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Diccionarios con las mismas claves en `es` y `en`; `formatPrice`; agrupación y formato de horarios (cerrado, medianoche, turnos partidos); enlaces `tel:`/`wa.me`/Maps; ruta del selector; JSON-LD; metadata/hreflang |
| Integración | `src/lib/content`: lectura anónima con `locale` y _fallback_; carta sin categorías ocultas ni platos `hidden` y en orden; destacados (máx. 6, orden de la carta); globals vacíos sin errores                          |
| E2E         | Navegación es/en, `/`→`/es`, locale inválido → 404 con diseño, selector de idioma, carta y alérgenos, WhatsApp condicional, 360 px, axe, `hreflang`/canónica, sitemap/robots, cambio publicado visible                |

## Checklist

- [x] Plan documentado (rama `feat/m5-foundation`)
- [x] Plan aprobado por el propietario (2026-11-27)
- [x] PR 1 — TDD unit: diccionarios (mismas claves es/en), `formatPrice`, horarios, enlaces (`tel:`, `wa.me`, Maps), rutas por idioma, `imageSrc`
- [x] PR 1 — TDD integración: `src/lib/content` (carta, destacados, globals, galería; acceso anónimo, orden y _fallback_)
- [x] PR 1 — Layout público (cabecera, navegación, selector de idioma, pie, WhatsApp), `revalidate = 3600`, 404/error/`global-not-found`/`global-error`, `remotePatterns` de S3
- [x] PR 1 — E2E del layout (contenido publicado vía API, WhatsApp condicional, selector de idioma, 404, 360 px, axe) y `@axe-core/playwright` 4.14.1
- [x] PR 1 — Verificación local: `format:check`, `lint`, `typecheck`, unit (217), integración (101), E2E (14) con el servidor de desarrollo y contra el build de producción (`CI=1`)
- [x] PR 1 — PR #8 con CI en verde, aprobada por el propietario y fusionada con squash (2026-11-27)
- [x] PR 2 — TDD unit: párrafos de «Sobre nosotros», destino del botón del hero (`heroCtaHref`: sin número de WhatsApp o teléfono no hay botón), etiquetas de alérgenos por idioma
- [x] PR 2 — Portada con secciones en orden fijo y sin secciones vacías (hero, sobre nosotros, destacados, galería, horario, ubicación/contacto) y carta `/{locale}/menu` (orden del panel, precios EUR, «No disponible», alérgenos como texto, aviso de alergias, índice de categorías)
- [x] PR 2 — E2E: carta es/en con precios, alérgenos, `unavailable` y sin `hidden`; destacados en la portada; precio guardado en `/admin` visible en la carta; título del hero publicado en es/en; 360 px y axe en `/es`, `/es/menu`, `/en/menu`
- [x] PR 2 — Verificación local: unit (229), integración (101), E2E (17) con el servidor de desarrollo y contra el build de producción (`CI=1`, dos veces seguidas)
- [x] PR 2 — PR #9 con CI en verde, aprobada por el propietario y fusionada con squash (2026-11-27)
- [x] PR 3 — TDD unit: `localeAlternates`, `pageMetadata`, `sitemapEntries`, `robotsRules` (`src/lib/seo.ts`), `restaurantJsonLd` y `serializeJsonLd` (`src/lib/jsonLd.ts`); `ogImage` (`src/lib/content/seo.ts`, test escrito después de la función)
- [x] PR 3 — `generateMetadata` en layout (`metadataBase`, plantilla de título), portada y carta; `sitemap.ts`, `robots.ts`, JSON-LD en la portada, icono neutro `icon.svg`
- [x] PR 3 — E2E: título, descripción, canónica, `hreflang` (es, en, x-default), Open Graph y JSON-LD en `/es` y `/en/menu`; `sitemap.xml` y `robots.txt`
- [x] PR 3 — Lighthouse manual (móvil) contra el build de producción con contenido de ejemplo ficticio en la BD de tests (resultados abajo)
- [x] PR 3 — Verificación local: unit (240), integración (101), E2E (19) con el servidor de desarrollo y contra el build de producción (`CI=1`)
- [x] Criterios de aceptación, pendientes trasladados y documentación de cierre
- [ ] PR 3 — Push, PR, CI en verde y fusión → M5 cerrado
