# Modelo de datos inicial

Modelo de contenido en Payload CMS 3. Payload genera las tablas PostgreSQL (vía Drizzle) a partir de esta configuración; **no se escribe SQL a mano**. Decisiones de modelado en [ADR-0005](../decisions/ADR/ADR-0005-content-model.md).

- **Collections**: conjuntos de documentos (N elementos): usuarios, imágenes, categorías, platos.
- **Globals**: documentos únicos (1 elemento): ajustes del restaurante, home, galería.
- Slugs en inglés (`kebab-case`); etiquetas del panel en español e inglés.
- **🌐 = campo localizado** (es obligatorio si el campo es obligatorio; en opcional con fallback a es). Los campos 🌐 obligatorios usan `requiredInDefaultLocale` (`src/fields/localizedText.ts`) en lugar de `required: true`, que en Payload exige el valor en todos los idiomas (R-08, verificado en M3). Ver [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md). Configuración: `localization: { locales: ['es', 'en'], defaultLocale: 'es', fallback: true }`.
- Todos los documentos tienen `id`, `createdAt`, `updatedAt` (automáticos).
- Este modelo es **inicial**: se implementa y ajusta en M2–M4; cualquier cambio se documenta aquí.

## Diagrama

```
users (auth)

media (upload) ◄──────────────┬──────────────┬───────────────┬────────────────┐
                              │              │               │                │
site-settings (global) ─ logo, seo.image     │               │                │
homepage (global) ───────── hero.image, about.image           │                │
gallery (global) ─────────────────────────── images[] (hasMany, ordenado)      │
menu-categories ◄── category (N:1) ── dishes ─────────────────────────── image
```

---

## Collections

### `users` — Usuarios del panel (auth)

| Campo      | Tipo                 | Reglas                                     |
| ---------- | -------------------- | ------------------------------------------ |
| `email`    | email (Payload auth) | Obligatorio, único                         |
| `password` | (Payload auth, hash) | Mín. 12 caracteres (validación propia, M2) |
| `name`     | text                 | Opcional, máx. 100                         |

- Auth: `maxLoginAttempts: 5`, `lockTime: 600000` (10 min), cookies `httpOnly`, `secure` en producción, `sameSite: 'Lax'`.
- Access: `read/create/update/delete` → solo autenticados. Impedir borrar el último usuario (hook `beforeDelete`).
- Sin rol en el MVP (todos los usuarios son administradores; ver [ADR-0006](../decisions/ADR/ADR-0006-auth-and-access-control.md)).

### `media` — Imágenes (upload)

| Campo        | Tipo   | Reglas                                                                                                                                                                  |
| ------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alt` 🌐     | text   | **Obligatorio** (es), máx. 200                                                                                                                                          |
| `caption` 🌐 | text   | Opcional, máx. 200                                                                                                                                                      |
| archivo      | upload | `mimeTypes`: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Tamaño máx. 4 MB. Tipo verificado por contenido con un detector propio de _magic bytes_ (ver nota). |

- `imageSizes` (generados con `sharp`, salida WebP): `thumbnail` 400 px, `card` 800 px, `hero` 1920 px de ancho. Con `withoutEnlargement: true`, si el original es más pequeño se guarda una copia a su tamaño (los tres tamaños existen siempre). Definitivo (M3).
- **Validación del archivo** (`beforeOperation` de `media`, M3): tamaño ≤ 4 MB y tipo detectado por _magic bytes_ (`src/lib/media/detectImageType.ts`); el tipo detectado sustituye al declarado por el cliente. Payload por sí solo acepta el tipo de la extensión cuando no reconoce el contenido. En HTTP, `upload.limits.fileSize` corta las subidas de más de 4 MB con 413.
- `focalPoint` habilitado (recorte inteligente del hero).
- Campos técnicos `prefix` y `_objectkey` del plugin de almacenamiento S3, presentes siempre (`alwaysInsertFields`) para que el esquema sea igual con y sin S3 (ADR-0004).
- Access: `read` → público; escritura → autenticados.

### `menu-categories` — Categorías de la carta

| Campo            | Tipo                        | Reglas                                      |
| ---------------- | --------------------------- | ------------------------------------------- |
| `name` 🌐        | text                        | Obligatorio (es), único por idioma, máx. 80 |
| `description` 🌐 | textarea                    | Opcional, máx. 300                          |
| `isVisible`      | checkbox                    | Por defecto `true`                          |
| `_order`         | (Payload `orderable: true`) | Orden manual arrastrando en el listado      |

- Access: `read` → público **solo `isVisible = true`** (constraint de consulta); autenticados ven todo. Escritura → autenticados.
- `beforeDelete`: error si existen platos en la categoría (RF-MENU-06).

### `dishes` — Platos

| Campo            | Tipo                             | Reglas                                                                                                                                                                                                                                                                            |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` 🌐        | text                             | Obligatorio (es), máx. 120                                                                                                                                                                                                                                                        |
| `description` 🌐 | textarea                         | Opcional, máx. 500                                                                                                                                                                                                                                                                |
| `price`          | number                           | Obligatorio, `0 ≤ price ≤ 9999.99`, máx. 2 decimales (EUR)                                                                                                                                                                                                                        |
| `image`          | upload → `media`                 | Opcional                                                                                                                                                                                                                                                                          |
| `category`       | relationship → `menu-categories` | Obligatorio                                                                                                                                                                                                                                                                       |
| `availability`   | select                           | `available` \| `unavailable` \| `hidden`; por defecto `available`                                                                                                                                                                                                                 |
| `isFeatured`     | checkbox                         | Por defecto `false`                                                                                                                                                                                                                                                               |
| `allergens`      | select `hasMany`                 | Lista cerrada de los 14 alérgenos UE: `gluten`, `crustaceans`, `eggs`, `fish`, `peanuts`, `soybeans`, `milk`, `nuts`, `celery`, `mustard`, `sesame`, `sulphites`, `lupin`, `molluscs` ([ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md)). No localizado (códigos). |
| `_order`         | (Payload `orderable: true`)      | Orden manual                                                                                                                                                                                                                                                                      |

- Access: `read` → público con constraint `availability != hidden` **y** categoría visible; autenticados ven todo. Escritura → autenticados.
- Precio: se almacena como `numeric` en PostgreSQL (sin error de coma flotante en BD). El formateo usa `Intl.NumberFormat` con **EUR fijo** y el formato del idioma (`es-ES` / `en-IE`). Ver [ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md).
- La moneda **no** se guarda en la base de datos (EUR fijo en código).

---

## Globals

### `site-settings` — Información del restaurante

| Grupo / campo                | Tipo             | Reglas                                                                                                                               |
| ---------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `name`                       | text             | Obligatorio, máx. 80 (no localizado: nombre propio)                                                                                  |
| `tagline` 🌐                 | text             | Opcional, máx. 120                                                                                                                   |
| `description` 🌐             | textarea         | Opcional, máx. 300 (también descripción SEO por defecto si `seo.description` vacío)                                                  |
| `logo`                       | upload → `media` | Opcional                                                                                                                             |
| `contact.phone`              | text             | Opcional; validación de formato telefónico permisivo (dígitos, espacios, `+`, `-`, `()`), máx. 30                                    |
| `contact.email`              | email            | Opcional                                                                                                                             |
| `contact.whatsappNumber`     | text             | Opcional; formato E.164 (`^\+[1-9]\d{7,14}$`)                                                                                        |
| `contact.whatsappMessage` 🌐 | text             | Opcional, máx. 200                                                                                                                   |
| `location.street`            | text             | Opcional, máx. 150                                                                                                                   |
| `location.postalCode`        | text             | Opcional, máx. 20                                                                                                                    |
| `location.city`              | text             | Opcional, máx. 100                                                                                                                   |
| `location.region`            | text             | Opcional, máx. 100                                                                                                                   |
| `location.country`           | text             | Opcional, máx. 100                                                                                                                   |
| `location.mapsUrl`           | text             | Opcional; `https` y host en lista permitida (`google.com`, `www.google.com`, `maps.google.com`, `maps.app.goo.gl`, `goo.gl`)         |
| `openingHours.slots`         | array            | Filas `{ day: select(monday…sunday), opens: text HH:MM, closes: text HH:MM }`; `opens ≠ closes`; `closes < opens` = cruza medianoche |
| `openingHours.note` 🌐       | text             | Opcional, máx. 200                                                                                                                   |
| `socialLinks`                | array            | Filas `{ platform: select(instagram, facebook, tiktok, x, youtube, tripadvisor, google), url: text https }`; máx. 10                 |
| `seo.title` 🌐               | text             | Opcional, máx. 60 (por defecto: `name`)                                                                                              |
| `seo.description` 🌐         | textarea         | Opcional, máx. 160                                                                                                                   |
| `seo.image`                  | upload → `media` | Opcional (imagen Open Graph)                                                                                                         |

- `versions: { max: 20 }` (historial y restauración; sin drafts).
- Access: `read` → público; `update` → autenticados.
- Campos de branding (tema, color de acento) se añadirán en **M6** (no se modelan antes).
- En el panel se organiza en pestañas: General, Contacto, Ubicación, Horario, Redes sociales y SEO (los nombres de datos no cambian).

### `homepage` — Contenido de la home

| Grupo / campo               | Tipo             | Reglas                                                                                                        |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `hero.title` 🌐             | text             | Obligatorio (es), máx. 80                                                                                     |
| `hero.subtitle` 🌐          | textarea         | Opcional, máx. 200                                                                                            |
| `hero.image`                | upload → `media` | Opcional                                                                                                      |
| `hero.cta.label` 🌐         | text             | Opcional, máx. 30 (si vacío no hay CTA)                                                                       |
| `hero.cta.action`           | select           | `menu` \| `whatsapp` \| `phone` \| `external`; por defecto `menu`. `whatsapp` exige número en `site-settings` |
| `hero.cta.url`              | text             | Solo si `action = external`; `https`                                                                          |
| `about.title` 🌐            | text             | Opcional, máx. 80                                                                                             |
| `about.body` 🌐             | textarea         | Opcional, máx. 2000; párrafos separados por línea en blanco; sin HTML                                         |
| `about.image`               | upload → `media` | Opcional                                                                                                      |
| `sections.featuredTitle` 🌐 | text             | Opcional; si vacío, texto del diccionario («Nuestros destacados» / «Our highlights»)                          |
| `sections.galleryTitle` 🌐  | text             | Ídem («Galería» / «Gallery»)                                                                                  |
| `sections.hoursTitle` 🌐    | text             | Ídem («Horario» / «Opening hours»)                                                                            |
| `sections.contactTitle` 🌐  | text             | Ídem («Dónde estamos» / «Find us»)                                                                            |
| `seo.title` 🌐              | text             | Opcional, máx. 60                                                                                             |
| `seo.description` 🌐        | textarea         | Opcional, máx. 160                                                                                            |

- `versions: { max: 20 }`.
- Access: `read` → público; `update` → autenticados.

### `gallery` — Galería

| Campo    | Tipo                              | Reglas                            |
| -------- | --------------------------------- | --------------------------------- |
| `images` | upload → `media`, `hasMany: true` | Ordenable (`isSortable`); máx. 30 |

- Access: `read` → público; `update` → autenticados.

---

## Reglas transversales

- **Textos sin HTML**: ningún campo admite HTML; React escapa todo el contenido al renderizar. No se usa `dangerouslySetInnerHTML` salvo para el JSON-LD, que se serializa con escape de `<` (ver [security.md](security.md)).
- **Rich text**: no se usa en el MVP (textarea + párrafos). Ver [ADR-0005](../decisions/ADR/ADR-0005-content-model.md).
- **Borrado de imágenes en uso**: las relaciones a `media` son opcionales salvo `alt`; al borrar una imagen, los campos que la referencian quedan a `null` (comportamiento por defecto de Payload/Postgres con `ON DELETE SET NULL`; en la galería, `ON DELETE CASCADE` quita la imagen de la lista. Verificado con test en M3) y la UI pública debe tolerar `null`.
- **Esquema de base de datos**: tablas en un esquema PostgreSQL dedicado (`payload`) si el adaptador lo soporta sin problemas, para no exponerlas por la Data API de Supabase (ver [ADR-0003](../decisions/ADR/ADR-0003-database-supabase-postgres.md)).
