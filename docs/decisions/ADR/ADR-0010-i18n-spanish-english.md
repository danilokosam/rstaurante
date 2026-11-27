# ADR-0010: Internacionalización — español e inglés

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0 (revisión), implementación en M2–M5
- **Modifica**: alcance de [mvp-scope.md](../../product/mvp-scope.md) (i18n pasa de "fuera" a "dentro") y amplía [ADR-0005](ADR-0005-content-model.md)

## Contexto y problema

En la revisión de M0 el propietario decidió que la web debe estar en **español e inglés**. Hay que traducir tres cosas distintas:

1. **Contenido editable** (platos, textos de la home, etc.), que escribe el restaurante.
2. **Textos fijos de la web pública** («Horario», «Cerrado», «No disponible», nombres de alérgenos…), que escribe el producto.
3. **Interfaz del panel** de administración.

## Opciones consideradas

| Ámbito         | Opción elegida                                                                                                                         | Alternativas descartadas                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Contenido      | **Localización nativa de Payload** (`localization` + `localized: true` en campos de texto)                                             | Duplicar campos (`nameEs`, `nameEn`): no escala y ensucia el modelo. Colecciones separadas por idioma: duplica relaciones e imágenes.     |
| Textos fijos   | **Diccionarios tipados propios** (`src/i18n/dictionaries/{es,en}.ts`), patrón documentado por Next.js                                  | `next-intl` u otra librería: dependencia extra para unas decenas de cadenas; se reconsidera si crecen pluralizaciones/formatos complejos. |
| Rutas públicas | **Prefijo de idioma**: `/es`, `/en` (`app/(frontend)/[locale]/…`); `/` redirige a `/es`                                                | Detección automática por `Accept-Language` sin prefijo: peor para SEO y caché. Subdominios/dominios por idioma: complejidad innecesaria.  |
| Panel          | `i18n.supportedLanguages` de Payload con `es` (por defecto) y `en` (traducciones oficiales de `@payloadcms/translations`, verificadas) | —                                                                                                                                         |

## Decisión

- `localization: { locales: ['es', 'en'], defaultLocale: 'es', fallback: true }` en Payload.
- **Campos localizados**: textos en lenguaje natural (nombres de platos y categorías, descripciones, títulos, subtítulos, textos de la home, etiqueta del CTA, `alt` y pie de imágenes, nota de horarios, mensaje de WhatsApp, eslogan, descripción, SEO). **No localizados**: nombre del restaurante, precios, imágenes, dirección, teléfono, URLs, horas, disponibilidad, alérgenos (valores de lista cerrada, traducidos por diccionario). Lista exacta en [data-model.md](../../architecture/data-model.md).
- **Español obligatorio, inglés opcional**: si falta la traducción inglesa, la web en inglés muestra el texto en español (fallback). Si Payload exigiera los campos `required` en cada idioma, se implementará una validación propia que solo los exija en `es` (a verificar con test en M3).
- **Rutas**: `/{locale}` (home) y `/{locale}/menu` (carta). Mismo segmento `menu` en ambos idiomas (sin rutas traducidas, por simplicidad). `/` → redirección a `/es`.
- **SEO**: `<html lang>`, `hreflang` alternativos (`es`, `en`, `x-default` → `es`) en metadata y sitemap; canónica por idioma.
- **Selector de idioma** en la cabecera que conserva la página actual.
- **Formato de precios** por idioma con moneda fija EUR ([ADR-0011](ADR-0011-allergens-and-currency.md)).

## Trade-offs y consecuencias

- Más trabajo en M3–M5: cada campo de texto se edita en dos idiomas (selector de idioma de Payload en el formulario) y cada página se prueba en dos idiomas.
- El modelo de datos cambia (Payload guarda los campos localizados en tablas `_locales`); como aún no hay código, el coste de incluirlo ahora es mínimo (incluirlo después obligaría a migrar datos).
- Ampliable a más idiomas añadiendo un locale y un diccionario.

## Verificación prevista

- Unit: diccionarios con las mismas claves en `es` y `en` (test que compara claves); resolución de locale válida/inválida.
- Integración: lectura con `locale: 'en'` y fallback a `es`.
- E2E: `/` redirige a `/es`; selector de idioma; `hreflang` presentes; `/fr` → 404.

## Nota de implementación (M5, 2026-11-27)

- Diccionarios en `src/i18n/dictionaries/{es,en}.ts` con `getDictionary(locale)`; el tipo `Dictionary` y un test unitario exigen las mismas claves en ambos idiomas. Las etiquetas de alérgenos salen de `src/lib/allergens.ts` (fuente única, ADR-0011).
- Las lecturas de la web (`src/lib/content`) piden el idioma con `fallbackLocale: 'es'`: un texto sin traducir se muestra en español (verificado con tests de integración y E2E).
- Selector de idioma en la cabecera (`switchLocalePath`) que mantiene la página; `hreflang` `es`/`en`/`x-default` → `es` en los metadatos de cada página y en `sitemap.xml`; Open Graph con `es_ES` / `en_IE`.
- Las páginas 404 de rutas inexistentes (`global-not-found`, fuera de cualquier layout) y `global-error` muestran el texto en los dos idiomas, porque no pueden conocer el idioma de la URL.
