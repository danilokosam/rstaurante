# Setup del entorno de desarrollo

> Estado: **planificado**. Este documento se completa en M1 con los comandos reales y verificados.

## Prerrequisitos

| Herramienta | Versión requerida | Estado en la máquina de desarrollo (2026-11-24) |
|---|---|---|
| Node.js | **≥ 24.22.3** (24 LTS) — exigido por Payload 3.94 | ✅ 24.22.3 (actualizada por el propietario el 2026-11-24) |
| pnpm | 9, 10 u 11 | ✅ 11.20.0 |
| Docker + Compose | Reciente | ✅ Docker 29.9.3, Compose 5.7.1 |
| Git | — | ✅ Repositorio inicializado (rama `main`), remoto `origin` = `https://github.com/danilokosam/rstaurante.git` (vacío; sin commits todavía) |

## Pasos previstos (M1)

1. Crear el proyecto a partir de la plantilla `with-postgres` de Payload 3.94.x.
2. `docker compose up -d` → PostgreSQL local (dev + test).
3. Copiar `.env.example` a `.env` y completar.
4. `pnpm install`, `pnpm dev` → web en `http://localhost:3000`, panel en `/admin`.
5. `pnpm test:unit`, `pnpm test:int`, `pnpm test:e2e`.
