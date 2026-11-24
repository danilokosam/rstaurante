# Guía de contribución

Aplica a **cualquier persona o agente de IA** que contribuya al proyecto. Decisión registrada en [ADR-0012](docs/decisions/ADR/ADR-0012-branching-and-ci-cd.md).

## Antes de empezar

1. Lee [`MILESTONE.md`](MILESTONE.md): solo se trabaja en el **milestone activo**.
2. Lee la documentación relevante en [`docs/`](docs/README.md) (alcance, arquitectura, modelo de datos, ADRs).
3. No amplíes el alcance: las ideas nuevas van a [future-proposals.md](docs/product/future-proposals.md).

## Flujo de trabajo (obligatorio)

**Nunca se hace commit ni push directamente a `main`.** `main` siempre debe estar en verde y desplegable.

1. Actualiza `main`:
   ```bash
   git switch main && git pull origin main
   ```
2. Crea **una rama por funcionalidad o cambio**:
   ```bash
   git switch -c feat/m4-dish-allergens
   ```
   Formato: `<tipo>/<milestone>-<descripcion-corta>` (`m0`…`m7`, o `chore` si no hay milestone), en inglés y kebab-case.
   Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`.
3. Trabaja con **TDD** ([testing-strategy.md](docs/development/testing-strategy.md)): primero los tests, comprueba que fallan, implementa, deja todo en verde y refactoriza.
4. Haz commits pequeños con **Conventional Commits** en inglés (`feat(menu): add allergens field to dishes`).
5. Antes de subir, ejecuta en local (disponible a partir de M1):
   ```bash
   pnpm verify      # typecheck + lint + unit + integración + build
   pnpm test:e2e    # si tu cambio afecta a flujos de usuario
   ```
6. Sube la rama y abre un **Pull Request hacia `main`**:
   ```bash
   git push -u origin feat/m4-dish-allergens
   ```
7. El PR solo se fusiona cuando:
   - **todos los checks de CI pasan** (ver abajo),
   - se actualizaron la documentación afectada, el documento del milestone y `MILESTONE.md`,
   - hay ADR si se tomó una decisión importante,
   - se revisó (revisión humana del propietario, o revisión explícita si el autor es una IA).
8. Fusión con **squash merge** (un commit limpio por PR en `main`) y se borra la rama.

## Descripción del Pull Request

Incluye: objetivo y milestone, requisitos/user stories cubiertos (IDs), qué tests se añadieron y cómo ejecutarlos, resultado de `pnpm verify`, riesgos/limitaciones y documentación actualizada.

## CI/CD (control de calidad automático)

Definida en [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Se ejecuta en **cada Pull Request hacia `main`** y en cada push a `main`.

| Job         | Comprobaciones                                                                                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quality** | Instalación con lockfile congelado · formato (Prettier) · lint (ESLint, 0 warnings) · typecheck · tests unitarios · `pnpm audit` (falla con vulnerabilidades altas/críticas)                                                                          |
| **App**     | PostgreSQL 17 efímero · `pnpm migrate` sobre BD vacía (igual que producción) · **el esquema no puede cambiar sin migración** · tests de integración · `pnpm build` · tests E2E (Playwright) contra el build de producción (informe adjunto si fallan) |

| Pieza                | Estado                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                   | ✅ Creada en M1                                                                                                                                    |
| Protección de `main` | Se activa al cerrar M1: PR obligatorio, checks `Quality` y `App` obligatorios, rama al día, sin force-push (requiere autorización del propietario) |
| CD (Vercel)          | M7: preview por PR, producción al fusionar en `main`, migraciones antes del build                                                                  |

Si un check falla, **no se fusiona**: se corrige en la misma rama. No se desactivan tests, reglas de lint ni checks para que pasen.

## Reglas para agentes de IA

Además de todo lo anterior:

- Trabajar siempre en una rama propia; nunca `main`.
- No hacer commit, push, merge ni crear recursos externos (bases de datos, despliegues, credenciales) sin petición expresa del propietario.
- No inventar APIs: verificar contra la documentación/tipos de las versiones instaladas.
- No marcar nada como verificado sin haberlo ejecutado; si algo no puede ejecutarse, decirlo.
- Mantener `MILESTONE.md` y la documentación sincronizados con el código.

## Seguridad

- Nunca subas secretos (`.env`, claves, tokens). Usa `.env.example` para documentar variables.
- Si encuentras una vulnerabilidad, avisa al propietario en privado; no la publiques en un issue.
