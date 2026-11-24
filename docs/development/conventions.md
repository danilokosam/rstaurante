# Convenciones de desarrollo

## Idioma

- **Código, nombres de archivos, identificadores, comentarios y commits**: inglés.
- **Documentación** (`docs/`, `MILESTONE.md`): español.
- **Textos de la UI**: web pública en español e inglés (diccionarios en `src/i18n/dictionaries`); panel en español por defecto con inglés disponible. El contenido del restaurante lo escribe el usuario en ambos idiomas.

## Código

- TypeScript `strict`. Prohibido `any` salvo justificado, aislado y comentado (`// Reason: ...`).
- Tipos de contenido: usar los generados por Payload (`payload-types.ts`), no duplicarlos.
- Nombres:
  - Archivos de componentes React: `PascalCase.tsx`; resto: `camelCase.ts`.
  - Colecciones/globals: archivo `PascalCase.ts`, slug `kebab-case` (`menu-categories`).
  - Campos: `camelCase`.
  - Funciones: verbos descriptivos (`formatPrice`, `buildMapsUrl`).
- Server Components por defecto; `'use client'` solo cuando haya interactividad.
- Sin lógica de negocio en componentes; la lógica pura va a `src/lib`.
- Errores: las validaciones de Payload devuelven mensajes traducidos (es/en) para el usuario; los errores inesperados se registran (`payload.logger`) sin exponer detalles internos al visitante.
- Comentarios solo cuando aportan el "por qué".
- Antes de añadir una dependencia: comprobar si el stack ya lo resuelve; si se añade, documentarla en el milestone (y ADR si es relevante).

## Formato y lint

- ESLint (config de Next.js) + Prettier (configurados en M1). Sin desactivar reglas sin justificación.

## Git

- **Flujo obligatorio: [CONTRIBUTING.md](../../CONTRIBUTING.md)** ([ADR-0012](../decisions/ADR/ADR-0012-branching-and-ci-cd.md)). Nunca se trabaja directamente en `main`.
- Una rama por funcionalidad: `<tipo>/<milestone>-<descripcion>` (p. ej. `feat/m4-dish-allergens`), Pull Request hacia `main`, CI en verde, squash merge.
- **Conventional Commits** en inglés: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `build:`, `ci:`. Ámbito opcional: `feat(menu): ...`.
- Al final de cada milestone se propone un mensaje de commit; **no se hace commit sin petición expresa**.
- Nunca se versionan `.env*` (salvo `.env.example`), `node_modules`, `.next`, archivos subidos locales.

## Documentación

- Cada cambio de comportamiento actualiza la documentación afectada en el mismo trabajo.
- Las decisiones importantes van a un ADR; las ideas fuera de alcance a [future-proposals.md](../product/future-proposals.md).
