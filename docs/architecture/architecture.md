# Arquitectura

## Resumen

**Monolito modular**: una única aplicación Next.js (App Router) que integra Payload CMS 3 dentro del mismo proceso. La web pública y el panel de administración comparten código, despliegue y base de datos. Una instancia = un restaurante.

```
                         ┌──────────────────────── Aplicación Next.js (1 despliegue) ───────────────────────┐
 Visitante (navegador) ──┼─► (frontend) rutas públicas  /{es|en}, /{es|en}/menu, sitemap.xml, robots.txt   │
                         │        │ Server Components → Local API de Payload (sin HTTP)                     │
                         │        ▼                                                                         │
 Administrador ──────────┼─► (payload) /admin  (UI de Payload)      /api/*  (REST de Payload)               │
                         │        │                                                                         │
                         │        ▼                                                                         │
                         │   Payload core: colecciones, globals, access control, validación, hooks          │
                         │        │                     │                         │ afterChange           │
                         │        │ Drizzle/pg          │ S3 API                  ▼                         │
                         │        │                     │              revalidatePath('/', 'layout')        │
                         └────────┼─────────────────────┼─────────────────────────────────────────────────┘
                                  ▼                     ▼
                     Supabase PostgreSQL       Supabase Storage (bucket público "media")
                     (esquema dedicado)        ◄── el navegador descarga imágenes directamente
```

## Componentes

| Componente | Responsabilidad | Tecnología |
|---|---|---|
| Web pública | Renderizar contenido publicado; SEO; accesibilidad. Solo lectura. | Next.js App Router, React Server Components, Tailwind CSS |
| Panel CMS | UI de edición, autenticación, gestión de imágenes. | Payload Admin (`/admin`), personalizado solo mediante configuración (labels, descripciones, idioma) |
| API | REST de Payload para el panel. GraphQL **deshabilitado** (no se usa; reduce superficie). | Payload REST (`/api/*`) |
| Dominio / contenido | Esquema de contenido, validación, control de acceso, hooks de revalidación. | Configuración de Payload (TypeScript) |
| Persistencia | Datos estructurados y versiones. | PostgreSQL gestionado en Supabase vía `@payloadcms/db-postgres` (Drizzle) |
| Archivos | Imágenes originales y tamaños generados. | Supabase Storage (API S3) vía `@payloadcms/storage-s3` |

## Principios arquitectónicos

1. **Payload es la capa de dominio y datos.** El esquema, la validación de datos de negocio y el control de acceso viven en la configuración de Payload (colecciones, globals, `access`, `validate`, `hooks`). No se crea una capa de repositorios/servicios paralela.
2. **La web pública lee con la Local API de Payload** desde Server Components, a través de un pequeño módulo de consultas (`src/lib/content/`) que respeta el control de acceso (`overrideAccess: false`, sin usuario → permisos de visitante). Así la web pública y la API REST ven exactamente los mismos datos públicos.
3. **Lógica pura aislada y testeable** en `src/lib/` (formatear precios, construir enlaces de WhatsApp/Maps, normalizar horarios, generar JSON-LD). Sin dependencias de React ni de Payload.
4. **Componentes de UI sin lógica de negocio**: reciben datos ya preparados.
5. **Seguro por defecto**: acceso denegado salvo regla explícita; secretos solo en servidor; validación en los límites (formularios del CMS → validación Payload; variables de entorno → validación al arrancar).
6. **Sin abstracciones para el futuro multi-tenant** (ver [ADR-0002](../decisions/ADR/ADR-0002-single-instance-monolith.md)), pero sin acoplar el contenido a valores fijos de un restaurante concreto: todo dato del restaurante sale del CMS.
7. **Usar APIs oficiales** de Next.js y Payload de las versiones instaladas; verificar en la documentación correspondiente antes de usar una API.

## Idiomas

- Contenido editable localizado con la localización nativa de Payload (`es` por defecto, `en` con fallback a `es`).
- Textos fijos de la web en diccionarios tipados (`src/i18n/dictionaries/`), sin dependencias extra.
- Rutas con prefijo de idioma (`app/(frontend)/[locale]/`); `/` redirige a `/es`.
- Detalle en [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md).

## Rendering y caché

- Páginas públicas renderizadas en servidor y cacheadas (estáticas/ISR).
- Hooks `afterChange`/`afterDelete` de las colecciones y globals públicas invalidan la caché del sitio completo (`revalidatePath('/', 'layout')`). El sitio tiene pocas páginas, por lo que invalidar todo es simple y barato.
- Revalidación temporal de respaldo (1 h) por si una invalidación falla.
- Detalle y alternativas en [ADR-0007](../decisions/ADR/ADR-0007-publishing-and-caching.md). La API exacta de caché de Next.js 16 se fija y testea en M3/M5.

## Entornos

| Entorno | Base de datos | Almacenamiento | Uso |
|---|---|---|---|
| Local (dev) | PostgreSQL en Docker (`docker compose`) | Disco local (adaptador por defecto de Payload) o Supabase si se configuran variables S3 | Desarrollo |
| Test | PostgreSQL en Docker, base de datos separada (`*_test`) | Disco local temporal | Tests de integración y E2E |
| Producción / demo | Supabase PostgreSQL | Supabase Storage | Restaurante real o demo |

Ver [ADR-0003](../decisions/ADR/ADR-0003-database-supabase-postgres.md), [ADR-0004](../decisions/ADR/ADR-0004-media-storage.md) y [ADR-0009](../decisions/ADR/ADR-0009-deployment.md).

## Documentos relacionados

- [folder-structure.md](folder-structure.md) — estructura de carpetas.
- [data-model.md](data-model.md) — modelo de datos.
- [data-flows.md](data-flows.md) — flujos de datos.
- [security.md](security.md) — modelo de seguridad.
- [ADRs](../decisions/ADR/README.md).
