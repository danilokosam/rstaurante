# ADR-0001: Stack tecnológico y versiones

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

El stack está predefinido (Next.js, Payload CMS, Supabase PostgreSQL, Tailwind CSS, TypeScript). Hay que confirmar que las versiones actuales son compatibles entre sí y con el entorno de desarrollo, y fijar una línea de versiones.

## Verificación realizada (2026-11-24)

Consultado en el registro npm (`npm view`) y en la plantilla oficial `templates/with-postgres` del repositorio de Payload en el tag `v3.94.2`:

| Paquete                                                                                              | Última versión                                                | Restricción relevante                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/storage-s3`, `@payloadcms/ui` | 3.94.2 (estable)                                              | Todos los paquetes `@payloadcms/*` deben tener **la misma versión exacta**. `payload@4.0.0-beta.12` existe pero es beta.                                                           |
| `next`                                                                                               | 16.4.6                                                        | `@payloadcms/next@3.94.2` exige `next >=16.4.5 <17` (o 15.x parcheadas). ✅                                                                                                        |
| `react` / `react-dom`                                                                                | 19.3.1 (última); la plantilla 3.x usa 19.2.9                  | `@payloadcms/ui` acepta `~19.2.9 \|\| ^19.3.1`. ✅                                                                                                                                 |
| `@payloadcms/db-postgres`                                                                            | 3.94.2                                                        | Usa `pg@8.20.0`, `drizzle-orm@0.45.2`. ✅ PostgreSQL estándar (Supabase).                                                                                                          |
| `tailwindcss`                                                                                        | 4.3.5                                                         | Independiente de Payload (solo en la web pública). ✅                                                                                                                              |
| `typescript`                                                                                         | 7.0.2 (última); plantilla 3.x usa 5.7.3 y la de 4.0 usa 6.0.3 | Usar la versión de la plantilla 3.x (5.x) para evitar incompatibilidades con la generación de tipos/tooling; evaluar actualización después.                                        |
| `vitest`                                                                                             | 5.1.1 (última); plantilla 3.x usa 4.0.18                      | Usar la línea de la plantilla salvo que M1 justifique otra.                                                                                                                        |
| `@playwright/test`                                                                                   | 1.65.1; plantilla usa 1.63.0                                  | Compatible.                                                                                                                                                                        |
| `sharp`                                                                                              | 0.35.5                                                        | Requerido por Payload para redimensionar imágenes.                                                                                                                                 |
| **Node.js**                                                                                          | —                                                             | `payload` y `@payloadcms/next` exigen `^22.23.5 \|\| ^24.22.3 \|\| >=26.13.1`. **El entorno local tiene Node 24.18.0 → incompatible**; hay que actualizar a ≥ 24.22.3 antes de M1. |
| pnpm                                                                                                 | 11.20.0 instalado                                             | Plantilla: `pnpm ^9 \|\| ^10 \|\| ^11`. ✅                                                                                                                                         |

## Opciones consideradas

1. **Payload 3.94.x (estable) + Next 16.4.x** — línea estable soportada.
2. Payload 4.0 beta — más reciente, pero beta: riesgo de cambios incompatibles y documentación incompleta.
3. Next.js 15.x — innecesario: Payload 3.94 soporta Next 16.

## Decisión

- Node.js **24 LTS ≥ 24.22.3** (`.nvmrc` / campo `engines`).
- Gestor de paquetes **pnpm** (el que usa la plantilla oficial).
- **Payload 3.94.x** (todas las dependencias `@payloadcms/*` con la misma versión exacta), **Next.js 16.4.x**, **React 19.2.x** (o 19.3.x si la plantilla/peers lo permiten sin advertencias), **TypeScript 5.x** (`strict`), **Tailwind CSS 4.x**, **Vitest**, **Playwright**.
- Versiones **exactas** (sin `^`) en `package.json` para paquetes críticos; lockfile versionado.
- Proyecto creado a partir de la plantilla oficial `with-postgres` de Payload 3 (vía `create-payload-app`) en M1, revisando cada archivo generado.

## Motivos

- Estabilidad para un MVP comercial; la plantilla oficial garantiza una combinación probada.

## Trade-offs y consecuencias

- Se pospone Payload 4 (ver propuesta FP-09); habrá una migración futura.
- Fijar versiones exactas exige actualizaciones manuales periódicas (registradas en `docs/development/setup.md`).

## Impacto

- Seguridad: versiones fijadas + `pnpm audit` por milestone.
- ~~Bloqueo: actualización de Node en la máquina de desarrollo~~ → resuelto el 2026-11-24.

## Verificación / seguimiento

- 2026-11-24 (revisión de M0): el propietario actualizó Node.js a **24.22.3** (`node -v` verificado) → cumple `engines`.
- M1: re-verificar versiones al instalar (pueden haber salido parches) y registrar las versiones finales en este ADR como nota.

## Nota de implementación (M1, 2026-11-24)

Versiones instaladas (exactas, `package.json` + `pnpm-lock.yaml`):

- Node 24.22.3 (`.nvmrc`, `engines: ^24.22.3`), pnpm 11.20.0 (`packageManager`).
- `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/db-postgres`: **3.94.1** (no 3.94.2). Motivo: pnpm 11 aplica por defecto una edad mínima de publicación (_minimumReleaseAge_) como protección de la cadena de suministro y 3.94.2 se publicó el mismo día. 3.94.1 es además la versión fijada por la plantilla oficial. Se actualizará a un parche posterior en un PR propio.
- `next` 16.4.6, `react`/`react-dom` 19.2.9, `sharp` 0.35.5, `graphql` 16.15.0 (peer de Payload; la API GraphQL está deshabilitada).
- Dev: `typescript` 5.9.3, `vitest` 4.1.12, `@playwright/test` 1.65.1, `tailwindcss`/`@tailwindcss/postcss` 4.3.5, `eslint` 9.39.5 + `eslint-config-next` 16.4.6 + `eslint-config-prettier` 10.1.8, `prettier` 3.10.1, `dotenv` 18.0.10, `cross-env` 10.1.0.
- Scripts de instalación permitidos solo para `esbuild`, `sharp` y `unrs-resolver` (`pnpm-workspace.yaml` → `allowBuilds`).
