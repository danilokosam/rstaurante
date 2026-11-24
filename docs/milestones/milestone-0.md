# Milestone 0 — Product Definition & Architecture

- **Estado**: ✅ Completado, verificado y **revisado por el propietario** (2026-11-24). Cambios de alcance de la revisión incorporados (ver "Revisión del propietario").

## Objetivo

Definir de forma verificable el producto, el alcance del MVP, los requisitos, la arquitectura, el modelo de datos y las estrategias (testing, seguridad, almacenamiento, publicación, despliegue), y dejar la documentación de trabajo y el roadmap listos. **Sin implementar funcionalidades.**

## Alcance

Incluido: documentación en `docs/`, `MILESTONE.md`, ADRs, verificación de compatibilidad del stack.
Excluido: código de la aplicación, instalación de dependencias, `git init`, creación de recursos externos (Supabase, hosting).

## Requisitos del milestone y cómo se cumplieron

| # | Requisito | Entregable |
|---|---|---|
| 1 | Inspeccionar el repositorio | Directorio vacío, no es repositorio git. Nada que preservar. |
| 2 | Verificar compatibilidad del stack | [ADR-0001](../decisions/ADR/ADR-0001-tech-stack-and-versions.md) (npm registry + plantilla oficial `v3.94.2`; tipos de `payload@3.94.2` inspeccionados) |
| 3 | Visión, público, alcance | [vision.md](../product/vision.md), [mvp-scope.md](../product/mvp-scope.md), [future-proposals.md](../product/future-proposals.md) |
| 4 | Requisitos funcionales y no funcionales | [requirements.md](../product/requirements.md) |
| 5 | User stories y criterios de aceptación | [user-stories.md](../product/user-stories.md) |
| 6 | Arquitectura | [architecture.md](../architecture/architecture.md), [data-flows.md](../architecture/data-flows.md), [ADR-0002](../decisions/ADR/ADR-0002-single-instance-monolith.md) |
| 7 | Modelo de datos inicial | [data-model.md](../architecture/data-model.md), [ADR-0005](../decisions/ADR/ADR-0005-content-model.md) |
| 8 | Estructura del proyecto | [folder-structure.md](../architecture/folder-structure.md) |
| 9 | Estrategias: testing, seguridad, almacenamiento, publicación, despliegue | [testing-strategy.md](../development/testing-strategy.md) + ADR-0008; [security.md](../architecture/security.md) + ADR-0006; ADR-0003/0004; ADR-0007; [deployment.md](../operations/deployment.md) + ADR-0009 |
| 10 | Convenciones y setup | [conventions.md](../development/conventions.md), [setup.md](../development/setup.md), [environment.md](../operations/environment.md) |
| 11 | `MILESTONE.md` | [/MILESTONE.md](../../MILESTONE.md) |
| 12 | Consistencia entre documentos | Ver "Verificación" |

## Cambios realizados

Solo archivos de documentación (lista en `MILESTONE.md` → "Último progreso").

## Arquitectura y decisiones (resumen)

- Monolito Next.js 16 + Payload 3.94 (Local API para la web pública), una instancia por restaurante, sin multi-tenancy.
- Supabase PostgreSQL vía `@payloadcms/db-postgres`; migraciones en producción; Data API de Supabase deshabilitada.
- Supabase Storage vía `@payloadcms/storage-s3`; disco local solo en dev/test.
- Auth nativa de Payload, un rol, access control explícito con constraints de lectura pública.
- Guardar = publicar + `revalidatePath('/', 'layout')` + versiones restaurables en globals.
- Vitest (unit + integración con Postgres real en Docker) + Playwright (E2E + axe).
- Despliegue: Vercel + Supabase (aprobado en la revisión).
- Idiomas español e inglés (ADR-0010); 14 alérgenos UE y moneda EUR fija (ADR-0011).

## Flujo de datos

Documentado en [data-flows.md](../architecture/data-flows.md) (escritura en CMS, lectura pública, subida de imágenes, login, arranque, restauración de versiones).

## Tests

No aplica código en M0 (no hay comportamiento implementado que testear). La estrategia TDD y la matriz de tests por milestone quedan definidas en [testing-strategy.md](../development/testing-strategy.md).

## Verificación ejecutada

| Comprobación | Comando / método | Resultado |
|---|---|---|
| Estado del repo | `ls -la`, `git status` | Directorio vacío; no es repo git |
| Herramientas locales | `node -v`, `pnpm -v`, `docker --version` | Node 24.18.0 (⚠️ < 24.22.3 requerido), pnpm 11.20.0, Docker 29.9.3, Compose 5.7.1 |
| Versiones y peers | `npm view <pkg> version/peerDependencies/engines` | Compatibles (ver ADR-0001) |
| APIs de Payload usadas en el diseño | Inspección de `.d.ts` de `payload@3.94.2`, `db-postgres`, `storage-s3` | Existen: `orderable`, upload `hasMany`, `maxLoginAttempts`/`lockTime`, `csrf`/`cors`, `schemaName`, `mimeTypes`, verificación de tipo por contenido (`file-type`), `clientUploads`/`acl` en S3 |
| Enlaces internos de la documentación | Script Python de comprobación de enlaces y anclas Markdown relativos | 117 enlaces comprobados, 0 rotos |
| Consistencia | Revisión cruzada: IDs de requisitos ↔ user stories ↔ data-model ↔ ADRs ↔ MILESTONE.md | Sin contradicciones detectadas tras la revisión (ver "Problemas encontrados") |

## Problemas encontrados y resolución

- **Node.js local incompatible** (24.18.0 < 24.22.3): registrado como bloqueo de M1; no afecta a M0.
- **Rama `main` de Payload ya es 4.0 beta**: se usó el tag `v3.94.2` para verificar la plantilla estable.
- **Riesgo Data API de Supabase** sobre tablas de Payload: mitigación definida en ADR-0003.
- **Almacenamiento en dev/test**: para no depender de servicios externos en tests se usa disco local; la verificación con Supabase se hace por smoke test (ADR-0004).

## Riesgos, limitaciones y deuda

Ver `MILESTONE.md` → "Bloqueos y riesgos" y "Preguntas abiertas".

## Revisión del propietario (2026-11-24)

| Pregunta abierta | Respuesta | Impacto incorporado |
|---|---|---|
| Moneda e idioma | **EUR**; web en **español e inglés** | [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md) (localización Payload, rutas `/es` `/en`, diccionarios, hreflang) y [ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md) (EUR fijo; se elimina el campo `currency`). Actualizados: mvp-scope, requirements (RF-I18N-01…05), user-stories (US-C3, US-F5), data-model (campos 🌐), architecture, folder-structure, data-flows, testing-strategy, conventions. |
| Hosting | **Aprobado Vercel + Supabase** | ADR-0009 → Accepted; planes concretos en M7. |
| Alérgenos | **Incluidos en el MVP** | ADR-0011 (14 alérgenos UE, lista cerrada); RF-MENU-08, US-E5, WEB-19, data-model `dishes.allergens`. |
| Git | Repositorio remoto creado | `git init -b main` + `git remote add origin https://github.com/danilokosam/rstaurante.git` ejecutados. **Sin commit ni push** (requieren petición expresa). No se ejecutó el `echo "# rstaurante" >> README.md` de las instrucciones de GitHub para no alterar el README existente. |
| Node.js | Actualizado a 24.22.3 | Bloqueo B-01 cerrado (verificado con `node -v`). |

**Análisis de impacto del cambio de alcance**: i18n y alérgenos afectan a M2 (idiomas del panel), M3 (campos localizados en globals y media), M4 (campos localizados, alérgenos) y M5 (rutas por idioma, selector, hreflang, sitemap, presentación de alérgenos). Incluirlos ahora, antes de escribir código, evita migraciones de datos posteriores. M1 no cambia salvo la estructura de carpetas `[locale]` prevista.

## Estado final

Todos los criterios de aceptación de M0 verificados, revisión del propietario realizada y preguntas abiertas respondidas e incorporadas. Sin bloqueos para M1.

## Siguiente milestone (no iniciado)

**M1 — Project Foundation**: scaffolding desde la plantilla oficial, Tailwind, tooling de calidad, validación de entorno (TDD), Docker Postgres, conexión verificada, scripts de test.

## Commit propuesto (no ejecutado)

> Actualización 2026-11-24: el propietario autorizó el commit; se ejecutó en `main` y se subió a `origin` (excepción documentada en ADR-0012).

```
docs: define MVP scope, architecture and roadmap (milestone 0)

- Add product vision, MVP scope, requirements and user stories
- Add architecture, data model, data flows and security model
- Add ADRs 0001-0011 (stack, monolith, database, storage, content
  model, auth, publishing, testing, deployment, i18n es/en,
  allergens and EUR currency, branching and CI/CD)
- Add CONTRIBUTING.md, AGENTS.md and CLAUDE.md with the mandatory
  branch + pull request + CI workflow
- Add testing strategy, conventions, setup and environment docs
- Add MILESTONE.md as project source of truth
```
