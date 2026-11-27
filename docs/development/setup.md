# Setup del entorno de desarrollo

## Prerrequisitos

| Herramienta      | Versión                                        | Comprobación                                                  |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Node.js          | **24.22.3** (`.nvmrc`; `engines: ^24.22.3`)    | `node -v`                                                     |
| pnpm             | **11.20.0** (`packageManager` en package.json) | `pnpm -v` (instalar: `npm i -g pnpm@11.20.0`)                 |
| Docker + Compose | Reciente                                       | `docker compose version`                                      |
| Git + GitHub CLI | —                                              | Flujo de ramas y PR: [CONTRIBUTING.md](../../CONTRIBUTING.md) |

> Si cambias de versión de Node con un gestor (fnm, nvm…), los paquetes globales como pnpm se instalan por versión: reinstala pnpm tras cambiar.

## Primera vez

```bash
git clone https://github.com/danilokosam/rstaurante.git && cd rstaurante
pnpm install                      # dependencias exactas del lockfile
docker compose up -d              # PostgreSQL 17 en 127.0.0.1:5433 (BD rstaurante + rstaurante_test)
cp .env.example .env              # y completa PAYLOAD_SECRET:
openssl rand -hex 32              #   ← pega el resultado en PAYLOAD_SECRET
pnpm migrate                      # crea las tablas en la BD de desarrollo
pnpm exec playwright install chromium   # navegador para los tests E2E
pnpm dev                          # http://localhost:3000 (→ /es) y http://localhost:3000/admin
```

En `/admin`, con la BD vacía, Payload pide crear el primer usuario.

## Comandos

| Comando                        | Qué hace                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `pnpm dev`                     | Servidor de desarrollo (Payload usa `push` para sincronizar el esquema solo en dev)  |
| `pnpm build` / `pnpm start`    | Build y servidor de producción                                                       |
| `pnpm typecheck`               | TypeScript sin emitir                                                                |
| `pnpm lint`                    | ESLint (0 warnings permitidos)                                                       |
| `pnpm format` / `format:check` | Prettier                                                                             |
| `pnpm test:unit`               | Tests unitarios                                                                      |
| `pnpm test:int`                | Tests de integración (usan `DATABASE_URL_TEST`; borran sus datos)                    |
| `pnpm test:e2e`                | Playwright (arranca `pnpm dev` si no hay servidor; con `CI=1` usa `pnpm start`)      |
| `pnpm verify`                  | format:check + lint + typecheck + unit + int + build — **ejecutar antes de cada PR** |
| `pnpm migrate`                 | Aplica migraciones pendientes                                                        |
| `pnpm migrate:create <name>`   | Genera una migración tras cambiar colecciones/globals (commitear los archivos)       |
| `pnpm generate:types`          | Regenera `src/payload-types.ts`                                                      |
| `pnpm generate:importmap`      | Regenera el import map del panel (si se añaden componentes personalizados)           |

## Cambios de esquema (colecciones, globals, campos)

1. Cambia la configuración en `src/collections` / `src/globals`.
2. `pnpm migrate:create <nombre-descriptivo>` y revisa el SQL generado. Si drizzle-kit pregunta si una columna se ha «creado» o «renombrado», elige **crear** salvo que realmente sea un renombrado.
3. **Revisa si la migración pierde datos.** Al traducir un campo (`localized: true`) o moverlo de tabla, drizzle-kit genera `DROP COLUMN` sin copiar los valores: añade a mano el `INSERT … SELECT` (en `up` y en `down`) y un test en `tests/int/migrations.int.spec.ts`.
4. `pnpm generate:types`.
5. Commitea la migración junto con el cambio. **La CI falla si el esquema cambia sin migración.**

## Migraciones en la BD de desarrollo

`pnpm dev` sincroniza el esquema por su cuenta (modo `push`). Los tests E2E, en cambio, arrancan su servidor con `PAYLOAD_DISABLE_PUSH=true` (ver `playwright.config.ts`) para probar el esquema migrado, como la CI, así que necesitan que la BD de desarrollo tenga **todas las migraciones aplicadas**. Al cambiar a una rama que trae migraciones nuevas:

```bash
pnpm migrate
```

Si tenías `pnpm dev` abierto, los E2E reutilizan ese servidor (con `push`). Si `pnpm migrate` avisa de que la BD se modificó en modo desarrollo («data loss will occur») o falla con «already exists», la BD de desarrollo se sincronizó con `push`. Si no tiene datos que conservar, lo más limpio es recrearla:

```bash
docker exec rstaurante-postgres-1 psql -U postgres -d rstaurante -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm migrate
```

## Tests E2E y BD de desarrollo

Los E2E usan la BD de desarrollo y limpian lo que crean (usuarios, platos, categorías y bloqueos de documento). Si `site-settings` o `homepage` nunca se habían guardado, al terminar los devuelven a ese estado; si no, restauran la versión anterior. Antes de M5 no era así, y versiones antiguas de los E2E podían dejar textos «… E2E …»; si aparecen y la BD no tiene contenido real, se limpian así:

```bash
docker exec rstaurante-postgres-1 psql -U postgres -d rstaurante -c "DELETE FROM _site_settings_v; DELETE FROM site_settings; DELETE FROM _homepage_v; DELETE FROM homepage;"
```

Con `next dev` y varios workers, un E2E del panel puede fallar de forma esporádica mientras se compila una ruta bajo demanda (sobre todo en la primera ejecución tras un `pnpm build`). Contra el build de producción (`pnpm build && CI=1 pnpm test:e2e`, como la CI) no ocurre.

## Problemas frecuentes

- `ECONNREFUSED 127.0.0.1:5433` → `docker compose up -d`.
- `Invalid environment configuration` → el mensaje lista qué variables faltan o son inválidas (ver [environment.md](../operations/environment.md)).
- `pnpm: command not found` tras cambiar de Node → `npm i -g pnpm@11.20.0`.
