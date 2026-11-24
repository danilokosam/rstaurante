# ADR-0009: Despliegue — Vercel + Supabase

- **Estado**: Accepted (aprobado por el propietario el 2026-11-24 en la revisión de M0; los planes concretos y costes se fijan en M7)
- **Fecha**: 2026-11-24
- **Milestone**: M0 (planificación), M7 (implementación)

## Contexto y problema

Hay que desplegar una aplicación Next.js 16 + Payload con Supabase (BD + Storage), con coste bajo y operación sencilla.

## Opciones consideradas

| Opción                                               | Pros                                                                                                                  | Contras                                                                                                                                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. **Vercel** (aplicación) + Supabase (BD y Storage) | Soporte nativo de Next.js; despliegues por Git con previews; HTTPS y CDN; plan gratuito/Pro; documentado por Payload. | Límite de 4,5 MB en el cuerpo de peticiones de funciones (cubierto: subida máx. 4 MB); conexiones a BD desde funciones → usar pooler; plan Hobby no es para uso comercial (cliente real → plan Pro). |
| 2. Contenedor Docker en un VPS / Railway / Fly.io    | Proceso persistente (sin problemas de pooling); coste fijo.                                                           | Más operación (actualizaciones, TLS, monitorización).                                                                                                                                                |
| 3. Netlify / Cloudflare                              | —                                                                                                                     | Soporte de Payload/Next 16 menos directo.                                                                                                                                                            |

## Decisión

**Opción 1**, con Vercel y Supabase en la misma región. Migraciones ejecutadas en el comando de build (`payload migrate && next build`), como hace la plantilla oficial (`ci` script).

## Pendiente de confirmar (M7)

- Planes concretos (Vercel Hobby no admite uso comercial: un cliente real requiere Pro; Supabase gratuito se pausa por inactividad) y costes.
- Modo del pooler de Supabase compatible con funciones (ADR-0003).
- Uso o no de la optimización de imágenes de Vercel (coste) frente a los tamaños generados por Payload.
- Política de pausa de proyectos gratuitos de Supabase para la demo.
