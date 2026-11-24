# ADR-0008: Estrategia de testing

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

El desarrollo es obligatoriamente TDD. Hay que elegir herramientas y niveles de test que verifiquen comportamiento real (permisos, validaciones, persistencia) sin ser lentos ni frágiles.

## Opciones consideradas

- Runner unit/integración: **Vitest** (usado por la plantilla oficial de Payload, rápido, ESM/TS nativo) vs Jest (más configuración con ESM).
- E2E: **Playwright** (plantilla oficial, multi-navegador, viewports móviles, axe) vs Cypress.
- BD para integración: **PostgreSQL real en Docker** vs mocks del adaptador vs Postgres en memoria (pglite).

## Decisión

| Nivel       | Herramienta                                                         | Qué cubre                                                                                                     |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Unit        | Vitest (entorno `node`; `jsdom` solo si hay componentes con lógica) | Lógica pura de `src/lib` (precios, horarios, enlaces, JSON-LD, validadores, `env.ts`).                        |
| Integración | Vitest + Payload **Local API** contra PostgreSQL de test en Docker  | Access control, validación de colecciones/globals, hooks, subida de archivos, consultas de `src/lib/content`. |
| E2E         | Playwright (Chromium + viewport móvil) + `@axe-core/playwright`     | Login/logout, editar y ver cambios publicados, navegación pública, responsive, accesibilidad básica.          |

- Base de datos de test separada, reseteada entre suites; nunca Supabase.
- Sin mocks de Payload ni de la BD en integración (se mockea solo `next/cache` cuando no hay servidor Next).
- La justificación de Postgres real: los permisos y constraints dependen de las consultas reales del adaptador.

## Consecuencias

- Requiere Docker para la suite de integración/E2E (disponible: Docker 29.9.3, Compose 5.7.1).
- Los tests de integración son más lentos que los unitarios → se ejecutan por separado (`test:unit`, `test:int`, `test:e2e`).

Detalles en [testing-strategy.md](../../development/testing-strategy.md).

## Nota de implementación (M1, 2026-11-24)

- Vitest con dos proyectos: `unit` (`tests/unit/**/*.test.ts`) e `int` (`tests/int/**/*.int.spec.ts`, secuencial).
- Los tests de integración usan **siempre** `DATABASE_URL_TEST`, cuyo nombre debe terminar en `_test` (guarda testeada en `tests/helpers/testDatabase.ts`); `resetDatabase` vuelve a comprobarlo antes de borrar.
- `resetDatabase` elimina el esquema y aplica las migraciones versionadas pasándolas explícitamente a `payload.db.migrate({ migrations })`. Motivo: `migrateFresh` importa los `.ts` de migración con `import()` nativo, fuera de la transformación de Vitest, y falla con los imports de tipos que genera Payload.
- E2E con Playwright ya en CI desde M1 (smoke), contra el build de producción (`pnpm start`); en local contra `pnpm dev`. Los E2E actuales no escriben datos; cuando lo hagan (M2+) deberán usar una BD de test.
