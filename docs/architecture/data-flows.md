# Flujos de datos

Flujos principales del sistema, desde la interacción del usuario hasta la persistencia y la respuesta. Se refinan con nombres de archivos reales en cada milestone.

## F1 — Administrador edita un plato (escritura)

```
Administrador (/admin, formulario "Platos")
  │ 1. Pulsa "Guardar"
  ▼
Payload Admin UI ──► PATCH /api/dishes/:id  (cookie HTTP-only con sesión; protección CSRF por Origin/cookies)
  │
  ▼
Payload REST handler (route group (payload))
  │ 2. Autenticación: resuelve req.user desde la cookie (JWT/sesión de Payload)
  │ 3. Access control: access.update(req) → ¿usuario autenticado? si no → 403
  │ 4. Hooks beforeValidate / beforeChange
  │ 5. Validación de campos (required, min/max, validate personalizados: precio con 2 decimales…)
  │      └─ error → 400 con mensajes por campo → la UI los muestra junto al campo
  ▼
Adaptador Postgres (Drizzle) ──► UPDATE en Supabase PostgreSQL (consultas parametrizadas)
  │
  ▼
Hook afterChange: revalidateSite() → revalidatePath('/', 'layout')
  │   (si falla: se registra el error; el guardado NO se revierte; respaldo temporal 1 h)
  ▼
200 OK → la UI muestra "Guardado"
```

## F2 — Visitante consulta la carta (lectura)

```
Visitante ──► GET /en/menu
  │
  ▼
Next.js: ¿página en caché y válida? ── sí ──► HTML cacheado (rápido)
  │ no (primera vez o invalidada)
  ▼
Server Component [locale]/menu/page.tsx
  │ valida el locale (es|en; otro → 404) y llama a src/lib/content/getMenu(locale)
  ▼
Payload Local API (memoizada por petición con React cache):
  payload.find({ collection: 'menu-categories' | 'dishes', locale: 'en', fallbackLocale: 'es', overrideAccess: false, pagination: false })
  │  (sin usuario → reglas de visitante: excluye availability=hidden y categorías ocultas; orden _order del panel)
  ▼
PostgreSQL ──► datos ──► src/lib: agrupar platos por categoría (sin categorías vacías), formatPrice EUR según idioma,
  │                       etiquetas de alérgenos (src/lib/allergens.ts) y textos fijos (src/i18n/dictionaries)
  ▼
Componentes de UI (sin lógica de negocio) ──► HTML estático (ISR) ──► se cachea ──► Visitante
  Imágenes: next/image → /_next/image (optimiza los archivos de /api/media/file) o URL pública de Supabase Storage
  Invalidación: revalidatePath('/', 'layout') al guardar en el panel; respaldo cada hora (revalidate = 3600)
```

## F3 — Subida de imagen

```
Administrador ──► selecciona archivo en el campo de imagen / colección "Imágenes"
  ▼
POST /api/media (multipart) ── autenticación + access.create
  ▼
Payload upload pipeline:
  1. Límite de tamaño (4 MB) → error 413/400 si se excede
  2. Detección del tipo real por contenido (file-type / magic bytes) y comprobación contra mimeTypes permitidos
  3. Nombre de archivo saneado
  4. sharp: genera tamaños (thumbnail, card, hero) en WebP
  ▼
Adaptador de almacenamiento:
  - Producción: @payloadcms/storage-s3 → Supabase Storage (bucket "media", lectura pública)
  - Local/test: disco local
  ▼
Fila en tabla media (alt, filename, mimeType, sizes, url) ──► afterChange → revalidateSite()
```

## F4 — Inicio de sesión

```
Administrador ──► /admin/login ──► POST /api/users/login {email, password}
  ▼
Payload auth: ¿cuenta bloqueada? → error
  │ verifica hash; si falla incrementa loginAttempts (bloqueo tras 5 → 10 min)
  ▼
Set-Cookie: payload-token (HttpOnly, Secure en prod, SameSite=Lax) ──► redirección al dashboard
```

## F5 — Arranque de la aplicación

```
next start / next dev
  ▼
src/lib/env.ts valida variables de entorno (obligatorias según entorno)
  │  └─ falta o formato inválido → la app falla al arrancar con un mensaje claro (fail fast)
  ▼
payload.config.ts: adaptador Postgres (DATABASE_URL), storage (S3 si configurado), secret, serverURL
  ▼
Producción: las migraciones se aplican en el paso de build/deploy (`payload migrate`), nunca con `push`
```

## F6 — Restaurar versión (globals)

```
Administrador ──► Información del restaurante → pestaña "Versiones" → "Restaurar"
  ▼
POST /api/globals/site-settings/versions/:id (Payload) ── access.update
  ▼
Se escribe la versión restaurada como actual ──► afterChange → revalidateSite()
```
