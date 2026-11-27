# MILESTONE.md — Fuente de verdad del proyecto

> Leer este archivo al inicio de cada sesión, junto con el documento del milestone activo en `docs/milestones/`. Última actualización: **2026-11-26**.

## 1. Estado actual

|                               |                                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Milestone activo**          | **M5 — Public Restaurant Website** (🚧 en curso; plan aprobado, PR 1 en `feat/m5-foundation`). M4 ✅ cerrado (2026-11-27, PR #7).    |
| **Estado de M0**              | ✅ **Cerrado** (2026-11-24): completado, verificado, revisado y confirmado por el propietario; commit inicial en `main`.             |
| **Siguiente acción concreta** | PR 1 de M5 (`feat/m5-foundation`) implementada y verificada en local: pendiente de push, PR y CI. Después, PR 2 `feat/m5-home-menu`. |
| **No hacer**                  | No trabajar directamente en `main` (ver [CONTRIBUTING.md](CONTRIBUTING.md)). No hacer commit/push/merge sin petición expresa.        |

## 2. Visión resumida

MVP de un sistema para que **un restaurante** gestione el contenido de su propia web sin depender de un desarrollador: **web pública** (moderna, responsive, SEO) + **panel CMS** autenticado (carta, imágenes, horarios, contacto, redes). **Una instancia independiente por restaurante, sin multi-tenancy.** Detalle: [vision.md](docs/product/vision.md).

## 3. Alcance y exclusiones del MVP

- **Dentro**: home (hero, sobre nosotros, destacados, galería, horarios, ubicación/contacto), carta `/{es|en}/menu` con categorías y platos (precio en EUR, imagen, disponibilidad, orden, destacados, **14 alérgenos UE**), **web en español e inglés** (selector, fallback a español, hreflang), WhatsApp, redes, Google Maps (enlace), SEO básico; CMS con login, información del restaurante, home, imágenes, galería, categorías, platos, horarios, ubicación, redes; guardar = publicar con versiones restaurables; branding con opciones predefinidas (M6); despliegue y demo (M7). Detalle: [mvp-scope.md](docs/product/mvp-scope.md).
- **Fuera**: multi-tenancy, subdominios/dominios por cliente, reservas, pedidos, pagos, POS, IA/chatbot, fidelización, app móvil, analytics avanzados, editor drag-and-drop/plantillas complejas, borradores/preview, idiomas distintos de es/en, etiquetas dietéticas/trazas/filtro por alérgenos, roles adicionales, mapa embebido, moneda distinta de EUR. Ideas nuevas → [future-proposals.md](docs/product/future-proposals.md).

## 4. Stack confirmado ([ADR-0001](docs/decisions/ADR/ADR-0001-tech-stack-and-versions.md))

| Pieza       | Versión / elección                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime     | Node.js 24 LTS **≥ 24.22.3**, pnpm                                                                                                                            |
| App         | Next.js **16.4.x** (App Router) + React 19.2.x                                                                                                                |
| CMS         | Payload **3.94.x** (todos los `@payloadcms/*` misma versión exacta); Payload 4 en beta → no se usa                                                            |
| BD          | Supabase PostgreSQL vía `@payloadcms/db-postgres` ([ADR-0003](docs/decisions/ADR/ADR-0003-database-supabase-postgres.md)); PostgreSQL en Docker para dev/test |
| Archivos    | Supabase Storage vía `@payloadcms/storage-s3` ([ADR-0004](docs/decisions/ADR/ADR-0004-media-storage.md))                                                      |
| Estilos     | Tailwind CSS 4.x                                                                                                                                              |
| Lenguaje    | TypeScript 5.x `strict`                                                                                                                                       |
| Tests       | Vitest (unit + integración) + Playwright (E2E + axe) ([ADR-0008](docs/decisions/ADR/ADR-0008-testing-strategy.md))                                            |
| Auth        | Payload auth nativa (sin Supabase Auth) ([ADR-0006](docs/decisions/ADR/ADR-0006-auth-and-access-control.md))                                                  |
| Hosting     | Vercel + Supabase — **Accepted** ([ADR-0009](docs/decisions/ADR/ADR-0009-deployment.md))                                                                      |
| Idiomas     | Español (por defecto) e inglés: localización de Payload + diccionarios propios ([ADR-0010](docs/decisions/ADR/ADR-0010-i18n-spanish-english.md))              |
| Moneda      | EUR fija ([ADR-0011](docs/decisions/ADR/ADR-0011-allergens-and-currency.md))                                                                                  |
| Repositorio | GitHub `danilokosam/rstaurante`, GitHub Flow ([ADR-0012](docs/decisions/ADR/ADR-0012-branching-and-ci-cd.md))                                                 |
| CI/CD       | GitHub Actions (CI, M1) + protección de `main` (M1) + Vercel Git (CD: previews por PR y producción desde `main`, M7)                                          |

## 5. Principios arquitectónicos

1. Monolito Next.js + Payload; la web pública lee con la Local API de Payload respetando el access control. ([architecture.md](docs/architecture/architecture.md))
2. Payload es la capa de dominio (esquema, validación, acceso, hooks); sin capas paralelas innecesarias.
3. Lógica pura aislada en `src/lib` y testeada; UI sin lógica de negocio.
4. Seguro por defecto: acceso denegado salvo regla explícita, secretos solo en servidor, validación en los límites. ([security.md](docs/architecture/security.md))
5. Sin abstracciones para un multi-tenant hipotético; todo dato del restaurante sale del CMS. ([ADR-0002](docs/decisions/ADR/ADR-0002-single-instance-monolith.md))
6. APIs oficiales de las versiones instaladas; no inventar APIs: verificar en documentación/tipos.

## 6. Reglas de trabajo

1. Trabajar **solo** en el milestone activo. No empezar el siguiente hasta que el actual esté terminado, verificado, documentado **y revisado**.
2. Antes de trabajar: leer este archivo, la documentación relevante y el estado del repo.
3. **TDD obligatorio** ([testing-strategy.md](docs/development/testing-strategy.md)): tests primero → fallan por la razón esperada → código mínimo → verde → refactor → typecheck/lint/build → documentar.
4. No marcar tareas como completadas sin ejecutarlas y verificarlas. Si un test no puede ejecutarse, documentar el motivo y no declararlo verificado.
5. Bloqueos: explicar, registrar aquí y no avanzar silenciosamente.
6. Cambios en milestones completados: evaluar impacto, documentar y actualizar el plan antes de implementar.
7. Mantener este archivo actualizado (tareas, estado, decisiones, bloqueos, verificaciones, próximos pasos).
8. Al cerrar un milestone: resumen de entregables, tests, riesgos, docs y **commit propuesto** (Conventional Commits, inglés). **No hacer commit sin petición expresa.**
9. Sin comandos destructivos, cambios de credenciales ni recursos externos sin autorización explícita.
10. Código/commits en inglés; documentación en español ([conventions.md](docs/development/conventions.md)).
11. Decisiones relevantes → ADR. Ideas fuera de alcance → propuestas futuras.
12. **Flujo Git obligatorio para personas y agentes de IA** ([CONTRIBUTING.md](CONTRIBUTING.md), [ADR-0012](docs/decisions/ADR/ADR-0012-branching-and-ci-cd.md)): una rama por funcionalidad (`<tipo>/<milestone>-<descripcion>`), Pull Request hacia `main`, **CI en verde obligatoria** (typecheck, lint, tests, build) y revisión antes de fusionar (squash merge). Nunca commits directos a `main` (única excepción: commit inicial de M0).

## 7. Roadmap

| #   | Milestone                         | Estado                   | Documento                                        |
| --- | --------------------------------- | ------------------------ | ------------------------------------------------ |
| M0  | Product Definition & Architecture | ✅ Completado y revisado | [milestone-0.md](docs/milestones/milestone-0.md) |
| M1  | Project Foundation                | ✅ Cerrado (PR #1)       | [milestone-1.md](docs/milestones/milestone-1.md) |
| M2  | Authentication & Admin Foundation | ✅ Cerrado (PR #2)       | [milestone-2.md](docs/milestones/milestone-2.md) |
| M3  | CMS & Content Management          | ✅ Cerrado (PRs #3–#5)   | [milestone-3.md](docs/milestones/milestone-3.md) |
| M4  | Restaurant Menu Management        | ✅ Cerrado (PR #7)       | [milestone-4.md](docs/milestones/milestone-4.md) |
| M5  | Public Restaurant Website         | 🚧 En curso              | [milestone-5.md](docs/milestones/milestone-5.md) |
| M6  | Customization & Branding          | ⏳ Pendiente             | —                                                |
| M7  | Deployment & Demo Readiness       | ⏳ Pendiente             | —                                                |

### Resumen de cada milestone

- **M1 — Project Foundation**: scaffolding desde la plantilla `with-postgres` de Payload 3.94 (rutas públicas bajo `[locale]`); Tailwind 4; TS strict, ESLint, Prettier; `env.ts` con validación (TDD); `docker-compose.yml` con Postgres dev/test; conexión a BD verificada por test de integración; scripts `dev`, `build`, `typecheck`, `lint`, `format`, `test:unit`, `test:int`, `test:e2e`, `verify`; `.env.example`; `.gitignore`; GraphQL deshabilitado; `.gitignore`/`.nvmrc`; decisión sobre `schemaName`; **CI en GitHub Actions** (typecheck, lint, formato, unit, integración con Postgres de servicio, build, audit) y **protección de la rama `main`** (PR + checks obligatorios; con autorización del propietario).
- **M2 — Auth & Admin Foundation**: colección `users` (lockout, contraseña ≥ 12, último usuario protegido), funciones de acceso en `src/access`, CSRF/CORS/serverURL, panel en español (+ inglés) y `localization` es/en configurada, tests de permisos y E2E de login/logout.
- **M3 — CMS & Content**: campos localizados es/en; `media` (tipos, tamaño, alt, tamaños), globals `site-settings`, `homepage`, `gallery`; validadores (URL, WhatsApp, teléfono, horas); versiones; hook `revalidateSite`; configuración de Supabase Storage (smoke test).
- **M4 — Menu**: `menu-categories`, `dishes` (precio EUR, disponibilidad, destacados, alérgenos en `select` múltiple, `orderable`, textos es/en), lectura pública con constraints, borrado protegido, usabilidad del listado.
- **M5 — Public Website**: rutas `/es` `/en` + selector de idioma y diccionarios, secciones de la home, `/{locale}/menu` con alérgenos y aviso, 404/error, metadata/OG/canónica/hreflang, sitemap, robots, JSON-LD, responsive, accesibilidad (axe), rendimiento, E2E de publicación.
- **M6 — Branding**: temas/paletas predefinidas con contraste AA, logo/branding, opciones limitadas de secciones. Sin builder.
- **M7 — Deploy & Demo**: **CD con Vercel** (preview por PR, producción desde `main`, migraciones en el build), E2E en la CI, producción segura (cabeceras/CSP, pooler, Data API off, migraciones), seed demo ficticio, E2E de flujos críticos contra build de producción, Lighthouse, documentación de operación.

## 8. Milestone activo — M5 (en curso)

Documento: [milestone-5.md](docs/milestones/milestone-5.md). Plan aprobado (2026-11-27): tres PRs (`feat/m5-foundation`, `feat/m5-home-menu`, `feat/m5-seo`), `@axe-core/playwright` y `experimental.globalNotFound`. Pendientes heredados: de M3 (revalidación de respaldo, E2E de publicación visible, WhatsApp, «Cerrado», enlace de Maps; ver [milestone-3.md](docs/milestones/milestone-3.md#pendientes-trasladados)) y de M4 (carta pública, alérgenos y aviso, formato de precios, destacados; ver [milestone-4.md](docs/milestones/milestone-4.md#pendientes-trasladados)). M4 cerrado: ver [milestone-4.md](docs/milestones/milestone-4.md).

### Checklist de M0 (cerrado)

Documento: [milestone-0.md](docs/milestones/milestone-0.md)

- [x] Inspeccionar el repositorio (vacío, sin git) — nada que preservar
- [x] Verificar compatibilidad de versiones (npm registry, plantilla oficial `v3.94.2`, tipos de Payload) → ADR-0001
- [x] Visión, público objetivo y alcance del MVP → vision.md, mvp-scope.md
- [x] Requisitos funcionales y no funcionales → requirements.md
- [x] User stories y criterios de aceptación → user-stories.md
- [x] Arquitectura pragmática sin multi-tenancy → architecture.md, ADR-0002
- [x] Modelo de datos inicial → data-model.md, ADR-0005
- [x] Estructura del proyecto → folder-structure.md
- [x] Flujos de datos → data-flows.md
- [x] Estrategia de testing TDD → testing-strategy.md, ADR-0008
- [x] Estrategia de seguridad → security.md, ADR-0006
- [x] Estrategia de almacenamiento → ADR-0004
- [x] Estrategia de publicación/caché → ADR-0007
- [x] Estrategia de despliegue (planificación) → deployment.md, environment.md, ADR-0009 (Accepted tras la revisión)
- [x] Convenciones y setup → conventions.md, setup.md
- [x] ADRs con índice y plantilla → docs/decisions/ADR/README.md
- [x] MILESTONE.md creado
- [x] Revisión de consistencia entre documentos y comprobación de enlaces
- [x] **Revisión del propietario** (2026-11-24): EUR, es+en, alérgenos incluidos, Vercel aprobado, repositorio creado, Node actualizado
- [x] Incorporar cambios de la revisión → ADR-0010, ADR-0011, ADR-0009 Accepted, docs de producto/arquitectura/testing actualizados
- [x] `git init -b main` + remoto `origin` (sin commit ni push)
- [x] Confirmación del propietario de los cambios incorporados (2026-11-24)
- [x] Flujo de contribución documentado: CONTRIBUTING.md, AGENTS.md/CLAUDE.md, ADR-0012
- [x] Commit inicial en `main` y push a `origin` (autorizado por el propietario)

### Criterios de aceptación de M0

| Criterio                                                                                                             | Verificado |
| -------------------------------------------------------------------------------------------------------------------- | ---------- |
| Alcance del MVP y exclusiones definidos y sin contradicción con el prompt original                                   | ✅         |
| Cada funcionalidad del alcance tiene requisito con ID y milestone asignado                                           | ✅         |
| User stories con criterios de aceptación verificables para M2–M7                                                     | ✅         |
| Compatibilidad del stack verificada con fuentes oficiales (registro npm, repositorio oficial)                        | ✅         |
| Arquitectura, modelo de datos, flujos y seguridad documentados                                                       | ✅         |
| Decisiones importantes con ADR (stack, arquitectura, BD, storage, contenido, auth, publicación, testing, deployment) | ✅         |
| Ningún código de aplicación implementado                                                                             | ✅         |
| Enlaces internos de la documentación válidos                                                                         | ✅         |

## 9. Definition of Done (aplica a todos los milestones)

- [ ] Todas las tareas del alcance completadas.
- [ ] Tests escritos antes de la implementación (TDD) y ejecutados.
- [ ] Tests relevantes en verde.
- [ ] `typecheck`, `lint` y `build` ejecutados (cuando aplique).
- [ ] Sin errores conocidos ocultos o ignorados sin explicación.
- [ ] Revisión de seguridad y mantenibilidad realizada.
- [ ] Criterios de aceptación verificados.
- [ ] Documentación técnica y funcional actualizada.
- [ ] Documento del milestone actualizado.
- [ ] MILESTONE.md actualizado.
- [ ] Decisiones relevantes registradas en ADR.
- [ ] Limitaciones y deuda técnica registradas.
- [ ] Resumen final y mensaje de commit propuesto (inglés).

Para M0 (solo documentación) aplican todos salvo tests/typecheck/lint/build, que no corresponden al no existir código.

## 10. Tests y verificaciones requeridas por milestone

Ver la matriz en [testing-strategy.md](docs/development/testing-strategy.md#matriz-de-cobertura-por-milestone). Comando de verificación previsto desde M1: `pnpm verify` (typecheck + lint + unit + int + build) + `pnpm test:e2e`.

## 11. Bloqueos y riesgos

| ID   | Tipo                    | Descripción                                                                                      | Impacto                                                    | Mitigación / acción                                                                                                           | Estado                 |
| ---- | ----------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| B-01 | Bloqueo (M1)            | Node.js local 24.18.0; Payload 3.94 exige ≥ 24.22.3                                              | No se puede instalar/ejecutar Payload                      | Node actualizado a 24.22.3 (verificado)                                                                                       | ✅ Cerrado             |
| R-01 | Riesgo seguridad        | Data API de Supabase podría exponer tablas de Payload                                            | Fuga de datos (hashes de usuarios)                         | Deshabilitar Data API; evaluar `schemaName`; verificación manual en M1/M7 (ADR-0003)                                          | Mitigación planificada |
| R-02 | Riesgo técnico          | Cambios en la API de caché de Next.js 16                                                         | Publicación no inmediata                                   | Verificado en M3 contra la doc de Next.js 16.4 (`revalidatePath('/', 'layout')`); E2E de publicación visible en M5 (ADR-0007) | Mitigado (M3)          |
| R-03 | Riesgo técnico          | Pooling de conexiones Supabase desde funciones serverless                                        | Errores de conexión en producción                          | Pooler de Supabase; prueba en M7 (ADR-0003/0009)                                                                              | Abierto                |
| R-04 | Riesgo producto         | Payload 4 en beta → futura migración                                                             | Trabajo de actualización                                   | Mantener configuración estándar; FP-09                                                                                        | Aceptado               |
| R-05 | Riesgo coste            | Proyectos gratuitos de Supabase se pausan por inactividad; plan Hobby de Vercel no comercial     | Demo caída / coste                                         | Decidir planes en M7                                                                                                          | Abierto                |
| R-06 | Riesgo funcional        | Recuperación de contraseña por email no incluida (sin adaptador de email)                        | Usuario bloqueado sin acceso                               | Otro admin o script restablece; reevaluar en M7 (ADR-0006)                                                                    | Aceptado               |
| R-07 | Riesgo legal/producto   | Exactitud de los alérgenos (responsabilidad del restaurante)                                     | Información incorrecta a clientes alérgicos                | Alérgenos incluidos (ADR-0011); lista cerrada UE; aviso fijo en la carta; documentar responsabilidad en la guía de uso (M7)   | Mitigado               |
| R-08 | Riesgo técnico          | Validación de campos obligatorios localizados en Payload (¿exige cada idioma?)                   | Inglés obligatorio sin querer                              | Confirmado en M3: `required` exige todos los idiomas → validación propia `requiredInDefaultLocale` con tests                  | ✅ Cerrado             |
| R-09 | Riesgo de alcance       | i18n duplica el trabajo de contenido y de pruebas en M3–M5                                       | Más esfuerzo                                               | Diccionarios simples, rutas no traducidas, fallback a español                                                                 | Aceptado               |
| R-10 | Riesgo seguridad (bajo) | Vulnerabilidad moderada GHSA-67mh-4wv8-2f99 en `esbuild <= 0.24.2` (transitiva de `drizzle-kit`) | Solo afecta al servidor de desarrollo de esbuild, no usado | Aceptada; revisar al actualizar Payload; CI falla solo con altas/críticas                                                     | Aceptado               |
| R-11 | Riesgo seguridad        | Colecciones `Users`/`Media` de la plantilla sin access control propio                            | Exposición si se desplegara antes de M2/M3                 | Reglas de acceso explícitas en `users` (M2) y `media` (M2, ampliado en M3) con tests                                          | ✅ Cerrado             |

## 12. Preguntas abiertas (para el propietario)

Respondidas el 2026-11-24 (detalle en [milestone-0.md](docs/milestones/milestone-0.md#revisión-del-propietario-2026-11-24)):

1. ~~Moneda e idioma~~ → **EUR**; web en **español e inglés**.
2. ~~Hosting~~ → **Vercel + Supabase aprobado**.
3. ~~Alérgenos~~ → **incluidos en el MVP**.
4. ~~Git~~ → repositorio `danilokosam/rstaurante` creado; inicializado localmente con remoto.

Cambios confirmados y primer commit autorizado por el propietario. Sin preguntas abiertas.

## 13. Decisiones relevantes

| ADR                                                               | Decisión                                                                                  | Estado   |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------- |
| [0001](docs/decisions/ADR/ADR-0001-tech-stack-and-versions.md)    | Payload 3.94.x + Next 16.4.x + Node ≥ 24.22.3, versiones exactas                          | Accepted |
| [0002](docs/decisions/ADR/ADR-0002-single-instance-monolith.md)   | Monolito, una instancia por restaurante, sin tenants                                      | Accepted |
| [0003](docs/decisions/ADR/ADR-0003-database-supabase-postgres.md) | Supabase Postgres vía adaptador oficial; migraciones; Data API off                        | Accepted |
| [0004](docs/decisions/ADR/ADR-0004-media-storage.md)              | Supabase Storage vía plugin S3                                                            | Accepted |
| [0005](docs/decisions/ADR/ADR-0005-content-model.md)              | Globals + collections, textarea, precio numeric, disponibilidad de 3 estados, `orderable` | Accepted |
| [0006](docs/decisions/ADR/ADR-0006-auth-and-access-control.md)    | Payload auth, un rol, access control explícito                                            | Accepted |
| [0007](docs/decisions/ADR/ADR-0007-publishing-and-caching.md)     | Guardar = publicar + revalidación del sitio + versiones                                   | Accepted |
| [0008](docs/decisions/ADR/ADR-0008-testing-strategy.md)           | Vitest + Playwright + Postgres en Docker                                                  | Accepted |
| [0009](docs/decisions/ADR/ADR-0009-deployment.md)                 | Vercel + Supabase                                                                         | Accepted |
| [0010](docs/decisions/ADR/ADR-0010-i18n-spanish-english.md)       | Español e inglés: localización Payload, rutas `/es` `/en`, diccionarios                   | Accepted |
| [0011](docs/decisions/ADR/ADR-0011-allergens-and-currency.md)     | 14 alérgenos UE en platos; moneda fija EUR                                                | Accepted |
| [0012](docs/decisions/ADR/ADR-0012-branching-and-ci-cd.md)        | GitHub Flow + CI (M1) + CD con Vercel (M7)                                                | Accepted |

## 14. Último progreso

**2026-11-24 — M0 completado (pendiente de revisión).** Creados:
`MILESTONE.md`, `README.md`, `docs/README.md`,
`docs/product/{vision,mvp-scope,requirements,user-stories,future-proposals}.md`,
`docs/architecture/{architecture,folder-structure,data-model,data-flows,security}.md`,
`docs/development/{testing-strategy,conventions,setup}.md`,
`docs/operations/{environment,deployment}.md`,
`docs/milestones/milestone-0.md`,
`docs/decisions/ADR/{README,ADR-template,ADR-0001…ADR-0009}.md`.

**2026-11-24 — Revisión de M0 incorporada.** Respuestas del propietario aplicadas: ADR-0010 (es/en) y ADR-0011 (alérgenos, EUR) creados; ADR-0009 aceptado; actualizados mvp-scope, requirements, user-stories, future-proposals, architecture, data-model, data-flows, folder-structure, testing-strategy, conventions, setup, deployment, ADR-0001/0005/0007 (notas). `git init -b main` y remoto `origin` configurados. Enlaces verificados.

**2026-11-24 — Confirmación y primer commit.** Añadidos `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md` y ADR-0012 (GitHub Flow + CI/CD). Commit inicial en `main` y push a `origin`. **M0 cerrado.**
Commit propuesto en [milestone-0.md](docs/milestones/milestone-0.md#commit-propuesto-no-ejecutado) (no ejecutado).

**2026-11-24 — M1 implementado y verificado en local** (rama `feat/m1-project-foundation`): Next.js 16.4.6 + Payload 3.94.1 + Postgres 17 (Docker) + Tailwind 4; `env.ts` validado (TDD); GraphQL deshabilitado; migración inicial; rutas `/es` `/en`; Vitest unit (29) + integración (2) + Playwright E2E (4) en verde; `pnpm verify` y build en verde; CI en `.github/workflows/ci.yml` con detección de migraciones pendientes. Detalle en [milestone-1.md](docs/milestones/milestone-1.md). Pendiente: push, PR, CI en GitHub, protección de `main`, merge.

**2026-11-24 — M1 cerrado.** PR #1 con CI en verde en GitHub; `main` protegida (PR + checks `Quality` y `App` obligatorios, rama al día, historial lineal, sin force-push, aplicado también a administradores; 0 aprobaciones requeridas mientras haya un único desarrollador); repositorio con solo squash merge y borrado automático de ramas. Siguiente: M2.

**2026-11-26 — M2 cerrado.** PR #2 (de un colaborador) revisada; correcciones incorporadas (sin `LocaleSync`, E2E solo contra BD local, _advisory lock_ en el borrado del último usuario, tests de CSRF/logout/error genérico) y fusionada con squash. Detalle en [milestone-2.md](docs/milestones/milestone-2.md).

**2026-11-26 — M3 iniciado.** Plan aprobado (3 PRs; Supabase real en M7; `users.name` incluido). PR 1 (`feat/m3-validators-media`): validadores puros, `media` completa con detector propio de _magic bytes_, `alt` obligatorio solo en español (R-08 cerrado), migración que conserva los textos `alt`. Detalle en [milestone-3.md](docs/milestones/milestone-3.md).

**2026-11-26 — M3, PR 1 fusionada (#3). PR 2** (`feat/m3-globals`): globals `site-settings` (pestañas, contacto, ubicación, horarios, redes, SEO), `homepage` (hero con CTA validado, sobre nosotros, títulos, SEO) y `gallery` (ordenable, máx. 30); versiones restaurables (máx. 20); E2E de la portada en es/en; servidor E2E sin `push`.

**2026-11-26 — M3, PR 2 fusionada (#4). PR 3** (`feat/m3-publishing-storage`): hook `revalidateSite` (Next.js 16.4 verificado, no deshace el guardado si falla), Supabase Storage condicional con `S3_PUBLIC_URL` y esquema idéntico con y sin S3. Con ella se completa el alcance de M3; pendientes trasladados a M4, M5 y M7 en [milestone-3.md](docs/milestones/milestone-3.md).

**2026-11-26 — M3 cerrado.** PR 3 (#5) fusionada tras la aprobación del propietario; `main` verificado tras la fusión. README ampliado con el estado real del proyecto (qué funciona, qué falta, stack, arquitectura, puesta en marcha y estructura). Siguiente: M4.

**2026-11-26 — M4 implementado en local** (rama `feat/m4-menu-management`): catálogo único de los 14 alérgenos UE (`src/lib/allergens.ts`), validador de precios EUR (`src/lib/validation/price.ts`) y `numberValidator`, colecciones `menu-categories` y `dishes` (ordenables con `defaultSort: '_order'`, localización es obligatoria / en opcional, alérgenos en `select` múltiple `hasMany: true`, lectura pública restringida a categorías visibles y platos no ocultos, borrado protegido de categorías con platos, hooks de revalidación), migración `20261126_203258_menu_categories_and_dishes` y `payload-types.ts`. Verificado en local con unit (178), integración (91), E2E (8), `typecheck`, `lint`, `build` y `schema-drift-check`. Detalle en [milestone-4.md](docs/milestones/milestone-4.md).

**2026-11-27 — M4 cerrado.** PR #7 (de un colaborador) revisada por el propietario: cumple RF-MENU-01 a 08. Correcciones menores incorporadas en la misma PR (nombre de categoría recortado y único sin distinguir mayúsculas, E2E de cambio de disponibilidad desde el listado, ayuda del listado de platos, criterios de aceptación y pendientes trasladados a M5) y fusionada con squash. Siguiente: M5.

**2026-11-27 — M5 iniciado.** Plan propuesto en [milestone-5.md](docs/milestones/milestone-5.md) (tres PRs: base y contenido, portada y carta, SEO), verificado contra la documentación de Next.js 16.4.6. Aprobado por el propietario con `@axe-core/playwright` y `experimental.globalNotFound`.

**2026-11-27 — M5, PR 1 implementada en local** (`feat/m5-foundation`): diccionarios es/en, lógica pura (precios, horarios, enlaces, rutas por idioma, imágenes), capa de contenido `src/lib/content`, layout público (cabecera, selector de idioma, pie, WhatsApp), 404/error con diseño (`experimental.globalNotFound`), revalidación de respaldo de 1 h y E2E con axe. Corregidos los E2E inestables de `main` (`payload.destroy()` compartido). Verificado: unit 217, integración 101, E2E 14 (también contra el build de producción). **Nota**: las primeras ejecuciones locales del E2E dejaron datos de prueba en `site-settings` de la BD de desarrollo (antes nunca guardado); limpiarlos borrando las filas de `site_settings` y `_site_settings_v` en la BD `rstaurante`.
