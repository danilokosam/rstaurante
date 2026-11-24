# ADR-0003: Base de datos — Supabase PostgreSQL con el adaptador de Payload

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

Payload necesita una base de datos. El stack propone Supabase PostgreSQL. Hay que definir cómo conectar, cómo gestionar el esquema y qué riesgos introduce Supabase.

## Opciones consideradas

1. **`@payloadcms/db-postgres` (node-postgres + Drizzle) contra Supabase PostgreSQL.**
2. Usar el cliente de Supabase (`supabase-js`) — no aplica: Payload necesita un adaptador de base de datos, no un cliente REST.
3. Otra base de datos gestionada (Neon, RDS) o MongoDB — fuera del stack definido sin razón para cambiar.

## Decisión

- Adaptador oficial `@payloadcms/db-postgres` con `pool.connectionString = DATABASE_URL`.
- **Conexión en producción**: a través del pooler de Supabase (Supavisor). El modo concreto (transaction, puerto 6543, adecuado para serverless; o session, puerto 5432) se fija y prueba en M7 según el hosting. Las migraciones usan conexión directa o session pooler.
- **Esquema**:
  - Desarrollo: modo `push` de Payload (sincroniza el esquema automáticamente) **solo en local**.
  - Producción: **migraciones** versionadas (`payload migrate:create` / `payload migrate`), `push: false`. Se ejecutan en el pipeline de despliegue antes de arrancar la nueva versión.
- **Desarrollo y tests**: PostgreSQL en Docker (`docker compose`), con bases de datos separadas para dev y test. Nunca se ejecutan tests contra Supabase de producción.
- **No se usa Supabase Auth, Realtime ni la Data API**: Supabase es solo PostgreSQL gestionado (+ Storage, ADR-0004).

## Riesgo específico: Data API de Supabase

Supabase expone automáticamente las tablas del esquema `public` mediante PostgREST (`/rest/v1`) con la clave `anon`. Si Payload crea sus tablas en `public` sin RLS, podrían ser accesibles públicamente (incluida la tabla de usuarios con hashes).

Mitigación (se aplica en M1 al crear el proyecto Supabase y se verifica en M7):

1. **Deshabilitar la Data API** en la configuración del proyecto Supabase (no la usamos).
2. Además, evaluar en M1 la opción `schemaName` del adaptador (existe en `@payloadcms/db-postgres@3.94.2`) para usar un esquema dedicado `payload`, no expuesto por defecto. Si da problemas con migraciones, se mantiene `public` + Data API deshabilitada + RLS activado (sin políticas) como defensa en profundidad. El resultado se documenta como nota en este ADR.

## Motivos

- Adaptador oficial y mantenido; PostgreSQL estándar (portabilidad, RNF-11).
- Docker local: tests rápidos, aislados y gratuitos.

## Trade-offs y consecuencias

- Diferencias mínimas entre Postgres local y Supabase (versión, extensiones): usar la misma versión mayor que el proyecto Supabase (se fija en M1).
- Las migraciones exigen disciplina: cada cambio de esquema en M2–M6 debe incluir su migración generada y revisada.

## Impacto

- Seguridad: consultas parametrizadas (Drizzle); Data API deshabilitada; credenciales solo en el servidor.
- Coste: plan gratuito de Supabase suficiente para la demo; los proyectos gratuitos se pausan por inactividad (riesgo para la demo — revisar en M7).

## Nota de implementación (M1, 2026-11-24)

- **`schemaName` descartado**: en `@payloadcms/db-postgres@3.94.1` la opción está marcada como `@experimental` ("only works when there are not other tables or enums of the same name in the database under a different schema. Awaiting fix from Drizzle"). Se aplica la alternativa prevista: esquema `public` + **Data API de Supabase deshabilitada** + RLS habilitado sin políticas como defensa en profundidad (verificación en M7). Se reevaluará cuando deje de ser experimental.
- `push` solo cuando `NODE_ENV === 'development'`. Tests, CI y producción usan migraciones versionadas (`src/migrations/`).
- Migración inicial `20261124_205719_initial` generada y aplicada con `pnpm migrate` sobre una BD vacía.
- CI comprueba que el esquema no cambie sin migración (`migrate:create --skip-empty` + `git status`); comprobado localmente que detecta un campo añadido sin migración.
- PostgreSQL local: `postgres:17-alpine` en Docker, puerto `127.0.0.1:5433`, BD `rstaurante` (dev) y `rstaurante_test` (tests).
