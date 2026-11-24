# ADR-0007: Publicación y caché — guardar = publicar + revalidación

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

El CMS debe permitir «guardar y publicar cambios» con una estrategia sencilla. La web pública debe ser rápida (cacheada) y, a la vez, reflejar los cambios enseguida.

## Opciones consideradas

1. **Guardar = publicar**, sin borradores; historial de versiones en globals; invalidación de caché al guardar.
2. Borradores de Payload (`versions.drafts`) con botones «Guardar borrador» / «Publicar» en todo el contenido.
3. Borradores + live preview.
4. Renderizado dinámico sin caché (siempre consulta la BD).

## Decisión

**Opción 1.**

- Al guardar, el cambio queda publicado. El panel muestra el botón estándar de guardar de Payload.
- `versions: { max: 20 }` (sin drafts) en `site-settings` y `homepage` para poder ver y **restaurar** versiones anteriores (red de seguridad ante errores).
- Hook compartido `revalidateSite` en `afterChange` y `afterDelete` de todas las colecciones/globals con contenido público (`media`, `menu-categories`, `dishes`, `site-settings`, `homepage`, `gallery`) → `revalidatePath('/', 'layout')` (invalida todo el sitio, que tiene muy pocas páginas).
- Respaldo temporal: las páginas públicas se revalidan como máximo cada hora aunque falle un hook.
- Si la revalidación falla, se registra el error pero **no** se revierte el guardado.
- El hook no se ejecuta en contextos sin servidor Next.js (p. ej. scripts de seed/migración): se protege y se testea.

## Motivos

- Es el modelo mental más simple para un usuario no técnico: «lo que guardo es lo que se ve».
- Los borradores añaden estados (`_status`), filtros en todas las consultas y más casos de prueba, con poco valor para cambios pequeños (precio, disponibilidad).
- Invalidar el sitio entero evita errores por olvidar una etiqueta/ruta concreta; el coste de regenerar 2–3 páginas es despreciable.

## Trade-offs y consecuencias

- No se pueden preparar cambios sin publicarlos (FP-02).
- Si el sitio crece (muchas páginas), se migraría a invalidación por etiquetas (`revalidateTag`/`cacheTag`).
- **La API de caché de Next.js 16 ha cambiado respecto a versiones anteriores** (Cache Components, `cacheTag`, firma de `revalidateTag`): la implementación concreta (p. ej. `revalidatePath` vs `revalidateTag` y configuración de `revalidate`) se verifica contra la documentación de la versión instalada en M3/M5 y se añade aquí como nota.

## Verificación

- Test de integración: guardar un documento invoca la revalidación (mock de `next/cache`).
- Test E2E (M5/M7): editar un plato en `/admin` → el cambio aparece en `/es/menu` (y en `/en/menu` si aplica).
