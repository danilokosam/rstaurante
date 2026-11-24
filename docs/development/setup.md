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
2. `pnpm migrate:create <nombre-descriptivo>` y revisa el SQL generado.
3. `pnpm generate:types`.
4. Commitea la migración junto con el cambio. **La CI falla si el esquema cambia sin migración.**

## Problemas frecuentes

- `ECONNREFUSED 127.0.0.1:5433` → `docker compose up -d`.
- `Invalid environment configuration` → el mensaje lista qué variables faltan o son inválidas (ver [environment.md](../operations/environment.md)).
- `pnpm: command not found` tras cambiar de Node → `npm i -g pnpm@11.20.0`.
