# Milestone 3 — CMS & Content Management

- **Estado**: 🚧 En progreso. Plan aprobado por el propietario el 2026-11-26.

## Decisiones del propietario (2026-11-26)

- **Tres PRs** en lugar de una:
  1. `feat/m3-validators-media`: validadores, colección `media` y campo `name` de `users`.
  2. `feat/m3-globals`: `site-settings`, `homepage` y `gallery`.
  3. `feat/m3-publishing-storage`: `revalidateSite` y Supabase Storage condicional.
- **Supabase Storage real**: la prueba manual contra un bucket se aplaza a M7 (permitido por ADR-0004). En M3 solo se configura el plugin condicional y se prueba sin red.
- **`users.name`**: se añade en la PR 1 (opcional, máx. 100), pendiente heredado de M2 según `data-model.md`.

## Hallazgos de la implementación

- **Payload no basta para validar el tipo por contenido.** Si `file-type` no reconoce el contenido del archivo, Payload acepta el tipo deducido de la extensión y solo registra un aviso (`payload/dist/uploads/checkFileRestrictions.js`). Un archivo de texto renombrado a `.jpg` pasaría. Por eso se añade una comprobación propia de _magic bytes_ (`src/lib/media/detectImageType.ts`) en `beforeOperation`, antes de que Payload procese el archivo.
- **Límite de 4 MB**: en HTTP lo aplica `upload.limits.fileSize` de Payload (aborta con 413 por defecto, sin leer el archivo entero); la Local API no pasa por ese límite, así que el mismo hook comprueba el tamaño.
- **Antes de M3, Payload aceptaba SVG y GIF** en `media` (comprobado con los tests nuevos en rojo).
- **R-08 confirmado**: `required: true` en un campo localizado exige el valor en **todos** los idiomas; guardar la versión inglesa sin traducir fallaba. Solución: `requiredInDefaultLocale` (`src/fields/localizedText.ts`), obligatorio al guardar en español o al crear, y conserva las validaciones de Payload (longitud). La columna queda nullable en la BD.
- **La migración generada perdía datos**: al traducir `media.alt`, drizzle-kit crea `media_locales` y borra `media.alt` sin copiar los textos. Se añadió a mano la copia como español (`up`) y la restauración (`down`), con test (`tests/int/migrations.int.spec.ts`). Documentado en `setup.md`.
- **PR 2 — borrado de imágenes en uso**: verificado. Las referencias simples (`logo`, `hero.image`…) usan `ON DELETE SET NULL` y la galería `ON DELETE CASCADE` (la imagen desaparece de la lista).
- **PR 2 — `required` en campos con validación propia**: un `validate` propio sustituye al de Payload (longitud máxima incluida). `src/fields/validate.ts` (`textValidator`) ejecuta primero el validador puro y después el de Payload.
- **PR 2 — aviso de WhatsApp (US-C1 CA3)**: la acción `whatsapp` del botón principal consulta `site-settings` al validar. Si después se borra el número de WhatsApp, la portada conserva la acción: **la web (M5) debe ocultar el botón cuando no haya número**.
- **PR 2 — E2E y modo `push`**: cada ejecución local de los E2E arrancaba `pnpm dev` con `push`, que marca la BD de desarrollo como «dev» y hace que el siguiente `pnpm migrate` pida confirmación o falle. Ahora el servidor de los E2E usa `PAYLOAD_DISABLE_PUSH=true` (cambio menor sobre la configuración de M1, documentado en `setup.md`).
- **PR 2 — E2E en paralelo**: cada archivo E2E usa su propio usuario para que la limpieza de uno no cierre la sesión del otro. El E2E de la portada restaura la última versión previa de `homepage` en la BD de desarrollo al terminar.

## Objetivo

Que el administrador pueda gestionar desde el panel todo el contenido del restaurante que no es la carta: información general, contacto, ubicación, horarios, redes, SEO, contenido de la home, imágenes y galería. Todo en español (obligatorio) e inglés (opcional), con validaciones claras, historial de versiones restaurable y revalidación de la web al guardar.

## Requisitos y user stories cubiertos

- **Requisitos**: `RF-SITE-01` a `RF-SITE-07`, `RF-HOME-01` a `RF-HOME-04`, `RF-MEDIA-01` a `RF-MEDIA-05`, `RF-PUB-01` y `RF-PUB-02` (parte del CMS: hook de revalidación), `RF-I18N-02`, `RNF-07`.
- **User stories**: `US-B1` a `US-B6`, `US-C1` a `US-C3`, `US-D1` a `US-D3` (solo la parte del panel; lo que «muestra la web» se verifica en M5).
- **ADRs**: [ADR-0004](../decisions/ADR/ADR-0004-media-storage.md), [ADR-0005](../decisions/ADR/ADR-0005-content-model.md), [ADR-0007](../decisions/ADR/ADR-0007-publishing-and-caching.md), [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md).
- **Riesgos que se cierran**: `R-08` (español obligatorio / inglés opcional en campos localizados), `R-11` (Media sin reglas propias).

## Alcance

### Incluido

1. **Validadores puros** en `src/lib/validation/` (TDD unitario):
   - URL `https` genérica y URL de Google Maps (lista de hosts permitidos).
   - Teléfono permisivo (dígitos, espacios, `+`, `-`, `()`, máx. 30).
   - WhatsApp E.164 (`^\+[1-9]\d{7,14}$`).
   - Hora `HH:MM` y franja horaria (`opens ≠ closes`; `closes < opens` = cruza medianoche).
   - Mensajes de error en español e inglés, según el idioma del panel (como la contraseña en M2).
2. **Colección `media`** completa:
   - `alt` 🌐 obligatorio (es), máx. 200; `caption` 🌐 opcional, máx. 200.
   - Solo JPEG, PNG, WebP y AVIF, verificados por contenido (magic bytes); SVG y resto rechazados.
   - Máximo 4 MB.
   - `imageSizes` en WebP: `thumbnail` 400 px, `card` 800 px, `hero` 1920 px, sin ampliar originales pequeños; `focalPoint` activado.
   - Reemplazar archivo y borrar; al borrar una imagen en uso, las referencias quedan a `null`.
3. **Global `site-settings`**: nombre, eslogan 🌐, descripción 🌐, logo; contacto (teléfono, email, WhatsApp, mensaje 🌐); ubicación (dirección + URL de Maps opcional); horarios (franjas varias por día + nota 🌐); redes sociales (lista cerrada de plataformas + URL `https`, máx. 10, ordenables); SEO por defecto (título 🌐, descripción 🌐, imagen). `versions: { max: 20 }`.
4. **Global `homepage`**: hero (título 🌐 obligatorio, subtítulo 🌐, imagen, CTA con acción de lista cerrada y URL solo para `external`; aviso si la acción es `whatsapp` sin WhatsApp configurado), «Sobre nosotros» (título 🌐, texto 🌐 sin HTML, imagen), títulos de sección 🌐, SEO 🌐. `versions: { max: 20 }`.
5. **Global `gallery`**: lista ordenable de imágenes de `media`, máx. 30.
6. **Access control**: lectura pública y escritura solo autenticados en `media` y en los tres globals.
7. **Hook `revalidateSite`** (`afterChange`/`afterDelete` en `media` y los tres globals): invalida el sitio entero; si falla, registra el error sin revertir el guardado; no hace nada fuera de un servidor Next.js (scripts, tests). La API concreta se verifica en `node_modules/next/dist/docs/` (Next.js 16) y se anota en ADR-0007.
8. **Supabase Storage** con `@payloadcms/storage-s3`: se activa solo si están las variables `S3_*` (ya validadas por `env.ts`); sin ellas, disco local. Imágenes servidas directamente desde la URL pública del bucket.
9. **Usabilidad del panel (RNF-07)**: etiquetas y descripciones de ayuda en español e inglés, opciones cerradas en lugar de texto libre.
10. Migración de base de datos y tipos regenerados.

### Excluido

- Carta: `menu-categories` y `dishes` (M4).
- Cualquier página pública que muestre este contenido (M5). M3 solo deja el contenido guardado, validado y la revalidación invocada.
- Campos de branding (M6).
- Prueba real contra Supabase Storage en producción (M7), salvo el _smoke test_ manual si el propietario aporta un bucket (ver preguntas).

## Plan de tests (TDD)

1. **Unit**:
   - Cada validador: casos válidos, inválidos y límites (p. ej. `24:00`, `9:00`, `+34 600…`, `http://`, `maps.evil.com`, `google.com.evil.com`).
   - `revalidateSite`: llama a la revalidación con el alcance correcto, captura errores sin propagarlos y no hace nada fuera de Next.js (mock de `next/cache`).
2. **Integración**:
   - Access control: anónimo lee `media` y los globals, pero no puede escribir; autenticado sí.
   - Media: acepta JPEG/PNG/WebP/AVIF reales; rechaza un archivo de texto renombrado a `.jpg`, un SVG y uno de más de 4 MB; `alt` obligatorio; se generan los tres tamaños en WebP; borrar una imagen usada en `homepage.hero.image` deja el campo a `null`.
   - Localización (R-08): un campo obligatorio localizado exige español y permite guardar sin inglés; leer en `en` sin traducción devuelve el español (fallback).
   - Globals: validaciones de WhatsApp, Maps, horarios, redes y CTA aplicadas al guardar; límites de longitud; CTA `whatsapp` sin WhatsApp → error de validación.
   - Versiones: guardar dos veces genera historial y restaurar una versión recupera el contenido.
   - Revalidación: guardar un global y una imagen invoca `revalidateSite`.
   - Storage: con variables `S3_*` el plugin se registra; sin ellas, se usa disco local.
3. **E2E**: editar el título del hero en español y en inglés desde `/admin`, guardar y comprobar que se conserva cada idioma.

## Checklist

- [x] Plan aprobado por el propietario
- [x] PR 1: TDD `users.name`
- [x] PR 1: TDD validadores (`src/lib/validation/`)
- [x] PR 1: TDD `media` (tipos por contenido, tamaño en Local API y HTTP, `alt` es/en, tamaños, reemplazo y borrado)
- [x] PR 1: migración con conservación de datos + test
- [x] PR 2: borrado de imagen en uso → referencias a `null`
- [x] PR 2: TDD `site-settings`
- [x] PR 2: TDD `homepage`
- [x] PR 2: TDD `gallery`
- [x] PR 2: versiones (historial, restaurar, máx. 20)
- [x] PR 2: E2E del hero en ambos idiomas
- [x] PR 1 fusionada (#3) y PR 2 fusionada (#4), con CI en verde
- [x] PR 3: TDD `revalidateSite` (unit + integración con mock y con `next/cache` real) + API de caché de Next.js 16.4 verificada (nota en ADR-0007)
- [x] PR 3: Storage S3 condicional con `alwaysInsertFields` (esquema idéntico con y sin S3, verificado) + `S3_PUBLIC_URL`
- [x] PR 3: migración `storage_fields` + `payload-types.ts`
- [x] PR 3: `pnpm verify` + `pnpm test:e2e` en verde
- [x] Documentación (`data-model.md`, `environment.md`, ADR-0004, ADR-0007, `setup.md`, `MILESTONE.md`, este documento) y riesgos `R-02`, `R-08` y `R-11` actualizados
- [ ] PR 3 con CI en verde, revisión y squash merge → cierre de M3

## Hallazgos de la PR 3

- Fuera de Next.js, `revalidatePath` lanza `Invariant: static generation store missing`; se ignora a propósito (scripts y tests) y cualquier otro error se registra sin deshacer el guardado.
- `next/cache` no se resuelve en Node ESM puro (Playwright); se importa `next/cache.js`.
- Sin `alwaysInsertFields`, el plugin S3 cambiaría el esquema de `media` solo cuando está activo y las migraciones de desarrollo no valdrían en producción.
- Los tests de integración guardan archivos en la carpeta `media/` del proyecto (ignorada por git). Si un test falla antes de su limpieza, quedan restos y Payload renombra los siguientes archivos (`-1`, `-2`…); el test de disco local lo tolera.

## Pendientes trasladados

- **M5**: revalidación de respaldo cada hora en las páginas públicas (RF-PUB-02); E2E «cambio guardado visible en la web»; ocultar el botón de WhatsApp de la portada si ya no hay número; mostrar «Cerrado» los días sin franjas; generar el enlace de Maps desde la dirección si no hay URL.
- **M4**: añadir los hooks de revalidación a `menu-categories` y `dishes`, y usar `requiredInDefaultLocale` en sus campos traducibles obligatorios.
- **M7**: prueba real contra un bucket de Supabase Storage; exigir las variables S3 en el despliegue de producción (ya anotado en `environment.md`).

## Resumen de M3

| Área                        | Entregado                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Validadores                 | URL `https`, Google Maps, teléfono, WhatsApp E.164, horas y franjas; mensajes es/en                                  |
| Imágenes                    | Solo JPEG/PNG/WebP/AVIF por contenido, 4 MB (Local API y HTTP 413), `alt`/`caption` es/en, tamaños WebP, punto focal |
| Información del restaurante | General, contacto, ubicación, horarios, redes, SEO; versiones restaurables                                           |
| Portada y galería           | Hero con CTA validado, sobre nosotros, títulos, SEO; galería ordenable de hasta 30                                   |
| Publicación                 | Revalidación de todo el sitio al guardar, sin deshacer el guardado si falla                                          |
| Almacenamiento              | Supabase Storage vía S3 si hay variables; disco local si no; mismo esquema en todos los entornos                     |
| Idiomas                     | Español obligatorio e inglés opcional con _fallback_ (R-08 cerrado)                                                  |
