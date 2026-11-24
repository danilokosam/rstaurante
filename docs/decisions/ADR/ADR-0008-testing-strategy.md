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

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unit | Vitest (entorno `node`; `jsdom` solo si hay componentes con lógica) | Lógica pura de `src/lib` (precios, horarios, enlaces, JSON-LD, validadores, `env.ts`). |
| Integración | Vitest + Payload **Local API** contra PostgreSQL de test en Docker | Access control, validación de colecciones/globals, hooks, subida de archivos, consultas de `src/lib/content`. |
| E2E | Playwright (Chromium + viewport móvil) + `@axe-core/playwright` | Login/logout, editar y ver cambios publicados, navegación pública, responsive, accesibilidad básica. |

- Base de datos de test separada, reseteada entre suites; nunca Supabase.
- Sin mocks de Payload ni de la BD en integración (se mockea solo `next/cache` cuando no hay servidor Next).
- La justificación de Postgres real: los permisos y constraints dependen de las consultas reales del adaptador.

## Consecuencias

- Requiere Docker para la suite de integración/E2E (disponible: Docker 29.9.3, Compose 5.7.1).
- Los tests de integración son más lentos que los unitarios → se ejecutan por separado (`test:unit`, `test:int`, `test:e2e`).

Detalles en [testing-strategy.md](../../development/testing-strategy.md).
