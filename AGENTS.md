# Instrucciones para agentes de IA

Este proyecto se desarrolla por milestones con TDD obligatorio. Antes de hacer nada:

1. Lee [`MILESTONE.md`](MILESTONE.md) (fuente de verdad: milestone activo, reglas, siguiente acción).
2. Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) — **flujo obligatorio**: una rama por funcionalidad, Pull Request hacia `main`, CI en verde antes de fusionar. Nunca trabajes directamente en `main`.
3. Lee la documentación relevante en [`docs/`](docs/README.md) y los ADRs en [`docs/decisions/ADR/`](docs/decisions/ADR/README.md).

Reglas clave: trabaja solo en el milestone activo; tests primero; no amplíes el alcance; código y commits en inglés, documentación en español; no hagas commit/push/merge ni toques recursos externos sin petición expresa.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
