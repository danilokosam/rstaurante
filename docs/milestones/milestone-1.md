# Milestone 1 — Project Foundation

- **Estado**: ✅ Implementado y verificado en local (2026-11-24). **Falta para cerrar**: subir la rama `feat/m1-project-foundation`, abrir el PR, ver la CI en verde en GitHub, activar la protección de `main` y fusionar (las tres acciones requieren autorización del propietario).

## Objetivo

Dejar una base de proyecto ejecutable, segura y verificable: Next.js 16 + Payload 3.94 + PostgreSQL + Tailwind 4 con TypeScript estricto, herramientas de calidad, validación de entorno, tests de los tres niveles funcionando y CI en GitHub Actions que proteja `main`.

## Alcance

Incluido: base del proyecto a partir de la plantilla oficial, dependencias exactas, PostgreSQL local, validación de entorno, configuración de Payload, migraciones, Tailwind, estructura `[locale]` con página provisional, herramientas de calidad, tests unit/int/E2E y CI.

Excluido (milestones posteriores): colecciones de contenido, reglas de acceso, configuración de auth (M2), localización de Payload y panel en es/en (M2), almacenamiento S3 / Supabase real (M3/M7), cabeceras de seguridad y CSP (M7), CD (M7).

## Checklist

- [x] Plantilla oficial `templates/with-postgres` (tag `v3.94.2`) descargada y revisada archivo por archivo
- [x] `package.json` con versiones exactas, scripts y `engines`; `.nvmrc`; `pnpm-workspace.yaml`
- [x] `docker-compose.yml` (Postgres 17, BD dev + test, solo en localhost)
- [x] `.env.example` documentado; `.gitignore` ignora todos los `.env*` salvo el ejemplo
- [x] TDD `env.ts` (unit)
- [x] TDD guarda de BD de test (`tests/helpers/testDatabase.ts`)
- [x] TDD `i18n/config.ts`
- [x] `payload.config.ts`: entorno validado, GraphQL deshabilitado (y rutas eliminadas), `serverURL`, `push` solo en desarrollo
- [x] Decisión `schemaName`: descartado (experimental) → nota en ADR-0003
- [x] Migración inicial generada y aplicada en BD limpia (`pnpm migrate`)
- [x] Integración: conexión Payload ↔ Postgres con migraciones
- [x] Tailwind 4 solo en `(frontend)`
- [x] E2E smoke (dev y build de producción)
- [x] ESLint + Prettier + typecheck en verde
- [x] `pnpm build` en verde
- [x] `pnpm audit` (1 moderada aceptada, ver riesgos)
- [x] CI (`.github/workflows/ci.yml`) con comprobación de migraciones pendientes
- [x] Documentación actualizada
- [ ] Push de la rama + PR + CI verde en GitHub ← requiere autorización
- [ ] Protección de `main` (PR + checks `Quality` y `App` obligatorios) ← requiere autorización
- [ ] Merge del PR (squash) ← requiere autorización

## Archivos adoptados de la plantilla oficial

| Adoptado (con cambios)                                                 | Descartado y por qué                                                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `next.config.ts` (+ `poweredByHeader: false`, redirección `/` → `/es`) | `Dockerfile` (despliegue en Vercel, ADR-0009)                                                                                          |
| `tsconfig.json`, `.prettierrc.json`, `.gitignore` (+ regla `.env*`)    | `docker-compose.yml` de la plantilla (contenedor de app innecesario, Postgres `latest`, `trust` sin contraseña, puerto expuesto a red) |
| `src/app/(payload)/**` (generado por Payload) **sin** rutas `graphql*` | `src/app/my-route` (ejemplo), `.vscode/`, `.yarnrc`, README de plantilla                                                               |
| `src/collections/Users.ts`, `Media.ts` (mínimas; se rehacen en M2/M3)  | Migración y `payload-types.ts` de la plantilla (se regeneran con nuestra config)                                                       |
|                                                                        | `eslint.config.mjs` con `FlatCompat` (Next 16 ya exporta configuración flat), página de ejemplo de `(frontend)`, tests de ejemplo      |

## Arquitectura relevante

```
src/
├── payload.config.ts        ← getEnv() valida el entorno al cargar la config
├── lib/env.ts               ← parseEnv(source) puro + getEnv() memoizado
├── i18n/config.ts           ← locales ['es','en'], defaultLocale 'es', isLocale()
├── collections/             ← Users (auth), Media (upload) — plantilla, se rehacen en M2/M3
├── migrations/              ← 20261124_205719_initial
└── app/
    ├── (frontend)/[locale]/ ← root layout público (lang), generateStaticParams + dynamicParams=false
    └── (payload)/           ← admin + REST (GraphQL eliminado)
```

## Flujo de datos

**Arranque** (`pnpm dev`, `pnpm build`, CLI de Payload, tests): `payload.config.ts` → `getEnv()` → `parseEnv(process.env)` valida todas las variables y lanza `EnvValidationError` con la lista completa de problemas (nombres de variables, nunca valores). Con un entorno válido se construye el adaptador Postgres con `DATABASE_URL`.

**Petición pública**: `GET /` → redirección 307 (`next.config.ts`) → `/es` → `[locale]/layout.tsx` (página estática generada en build para `es` y `en`). `GET /fr` → no está en `generateStaticParams` y `dynamicParams = false` → 404.

**Petición al panel**: `GET /admin` → Payload → sin usuario redirige a `/admin/create-first-user` (BD vacía) o `/admin/login`.

**Tests de integración**: `tests/int/setup.ts` sustituye `DATABASE_URL` por `DATABASE_URL_TEST` (validada: termina en `_test`) → `getPayload()` → `resetDatabase()` vuelve a validar, borra el esquema `public` y aplica las migraciones versionadas.

## Decisiones y patrones

- **Validación de entorno propia** (≈ 100 líneas, sin dependencia): `parseEnv` es una función pura testeable; `getEnv` la memoiza. Reporta todos los errores a la vez y nunca imprime valores.
- **Guarda `_test`** para que ningún test pueda borrar una BD que no sea de pruebas.
- **Migraciones desde el principio**: tests y CI usan las mismas migraciones que producción; `push` solo en desarrollo.
- **Comprobación de esquema sin migración en CI** (`migrate:create --skip-empty` + `git status`): probado en local que detecta un campo nuevo sin migración.
- **Locale por segmento con `dynamicParams = false`**: 404 nativo de Next para idiomas no soportados, sin middleware ni APIs experimentales.
- **Payload 3.94.1** en lugar de 3.94.2 por la política de edad mínima de pnpm 11 (ADR-0001).

## Tests

| Nivel       | Archivo                           | Qué verifica                                                                                                                                                                                                                      |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (16)   | `tests/unit/env.test.ts`          | Config válida; `postgresql://`; barra final; `DATABASE_URL` ausente/vacía/espacios/no-Postgres; secreto ausente o < 32; URL sin esquema o no-http; S3 completo/parcial; todos los errores a la vez; sin fugas de valores secretos |
| Unit (5)    | `tests/unit/testDatabase.test.ts` | Acepta `*_test` (con query params); falla sin variable; rechaza BD sin `_test`; rechaza `_test` fuera del nombre de BD                                                                                                            |
| Unit (8)    | `tests/unit/i18n-config.test.ts`  | `es`/`en` válidos, `es` por defecto; rechaza `fr`, `''`, `ES`, `es-ES`, `admin`                                                                                                                                                   |
| Integración | `tests/int/database.int.spec.ts`  | Todas las migraciones se aplican a una BD vacía; escritura y lectura con la Local API                                                                                                                                             |
| E2E         | `tests/e2e/smoke.e2e.spec.ts`     | `/` → `/es` con `lang="es"`; `/en` 200 con `lang="en"`; `/fr` 404; `/admin` pide autenticación                                                                                                                                    |

Ejecutar: `pnpm test:unit`, `pnpm test:int` (requiere `docker compose up -d`), `pnpm test:e2e`, o todo con `pnpm verify && pnpm test:e2e`.

**TDD**: los tests unitarios y E2E se escribieron antes del código y se vieron fallar por la razón esperada (módulos inexistentes; servidor sin páginas públicas → timeout por 404). El test de integración verifica configuración generada por la plantilla (excepción documentada en la estrategia de testing): su primera ejecución falló por un problema real de carga de migraciones, que se corrigió.

## Verificación ejecutada (2026-11-24)

| Comando                                                                | Resultado                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm test:unit` (antes de implementar)                                | ❌ 3 archivos fallan: módulos `@/lib/env`, `@/i18n/config`, helper inexistentes |
| `pnpm test:unit`                                                       | ✅ 29/29                                                                        |
| `pnpm test:int`                                                        | ✅ 2/2                                                                          |
| `pnpm test:e2e` (antes de las rutas)                                   | ❌ timeout del servidor: `/` devolvía 404                                       |
| `pnpm test:e2e` (dev)                                                  | ✅ 4/4                                                                          |
| `CI=1 pnpm test:e2e` (build de producción)                             | ✅ 4/4                                                                          |
| `pnpm migrate` / `payload migrate:status`                              | ✅ `20261124_205719_initial` aplicada                                           |
| `pnpm migrate:create --skip-empty` (sin cambios / con campo de prueba) | ✅ no genera archivo / genera archivo (detecta el cambio); prueba revertida     |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`                     | ✅                                                                              |
| `pnpm build`                                                           | ✅ `/es`, `/en` estáticas; `/admin`, `/api` dinámicas                           |
| `pnpm verify`                                                          | ✅                                                                              |
| `pnpm audit`                                                           | ⚠️ 1 moderada (ver riesgos); 0 altas/críticas                                   |
| CI en GitHub                                                           | ⏳ pendiente de push (requiere autorización)                                    |

## Problemas encontrados y solución

| Problema                                                                                  | Solución                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm` desapareció al cambiar de Node con fnm (instalación global por versión)            | `npm i -g pnpm@11.20.0` (documentado en setup.md)                                                            |
| pnpm 11 ignora el campo `pnpm` de `package.json` y bloquea paquetes de < 1 día            | Ajustes en `pnpm-workspace.yaml`; Payload 3.94.1 en vez de 3.94.2                                            |
| `migrateFresh` falla en Vitest: `does not provide an export named 'MigrateDownArgs'`      | `resetDatabase` borra el esquema y pasa las migraciones ya importadas a `payload.db.migrate({ migrations })` |
| Tipos genéricos del adaptador en el helper de tests                                       | Conversión explícita documentada en el código                                                                |
| `next dev` añade a `AGENTS.md` un bloque oficial de reglas para agentes (docs de Next 16) | Se mantiene: indica leer `node_modules/next/dist/docs/` antes de escribir código Next.js                     |
| Aviso de Vite: `vite-tsconfig-paths` innecesario                                          | Eliminado; `resolve.tsconfigPaths: true` nativo                                                              |

## Riesgos, limitaciones y deuda

- **Vulnerabilidad moderada** GHSA-67mh-4wv8-2f99 en `esbuild <= 0.24.2`, transitiva de `drizzle-kit` (vía `@payloadcms/db-postgres`). Afecta solo al _servidor de desarrollo de esbuild_, que el proyecto no usa. Aceptada; se revisa al actualizar Payload. La CI falla solo con altas/críticas.
- Las colecciones `Users`/`Media` son las de la plantilla, sin access control propio: **no desplegar** hasta M2/M3.
- Los E2E usan la BD de desarrollo (solo lectura). Cuando escriban datos (M2+) deberán usar una BD de test.
- `webpack.extensionAlias` de la plantilla se mantiene por compatibilidad de Payload aunque Next 16 usa Turbopack por defecto.
- Acciones de GitHub fijadas por versión mayor (`@v7`, `@v6`), no por SHA: decisión de mantenimiento; reevaluar en M7.

## Estado final

Implementación completa y verificada en local. Pendiente de autorización: push + PR + CI verde en GitHub + protección de `main` + merge.

## Siguiente milestone (no iniciado)

**M2 — Authentication & Admin Foundation**: auth de Payload (bloqueo, contraseña ≥ 12, último usuario), access control en `src/access`, CSRF/CORS, panel en es/en y `localization` es/en, tests de permisos y E2E de login/logout.

## Commit propuesto

```
feat: set up project foundation (milestone 1)

- Scaffold Next.js 16 + Payload 3.94.1 from the official with-postgres template
- Add validated environment config with fail-fast errors
- Add local PostgreSQL 17 via Docker Compose (dev and test databases)
- Add initial migration; schema push only in development
- Disable GraphQL API
- Add Tailwind CSS 4 and locale-prefixed public routes (/es, /en)
- Add Vitest (unit + integration) and Playwright smoke tests
- Add ESLint, Prettier and strict TypeScript
- Add GitHub Actions CI with migration drift check
```
