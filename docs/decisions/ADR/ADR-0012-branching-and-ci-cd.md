# ADR-0012: Flujo de ramas y CI/CD

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0 (decisión), M1 (CI + protección de `main`), M7 (CD)

## Contexto y problema

El propietario quiere que colaboren personas y agentes de IA, y que el código que escriban **no pueda romper** lo que ya funciona. Hace falta un flujo de trabajo común y controles automáticos.

## Opciones consideradas

1. **GitHub Flow**: `main` siempre desplegable + ramas cortas por funcionalidad + Pull Request con CI obligatoria.
2. Git Flow (`develop`, `release/*`, `hotfix/*`): demasiada ceremonia para un MVP con un despliegue por cliente.
3. Trunk-based con commits directos a `main`: sin barrera antes de integrar, no cumple el objetivo.

## Decisión

- **GitHub Flow** con las reglas de [CONTRIBUTING.md](../../../CONTRIBUTING.md): una rama por funcionalidad (`<tipo>/<milestone>-<descripcion>`), PR hacia `main`, **squash merge**, rama borrada tras fusionar.
- **CI con GitHub Actions** (M1): en cada PR y push a `main` → instalación con lockfile congelado, `typecheck`, `lint`, formato, tests unitarios, tests de integración con PostgreSQL como servicio, `build`, `pnpm audit` (nivel alto). E2E con Playwright se añaden al pipeline en M5/M7.
- **Protección de `main`** (M1): PR obligatorio, checks obligatorios, rama al día, sin force-push ni borrado. Se configura con `gh` o en la web de GitHub; requiere permisos de administrador del repositorio (acción autorizada por el propietario en ese momento).
- **CD con la integración Git de Vercel** (M7, ADR-0009): preview por PR, producción al fusionar en `main`, migraciones antes del build.
- **Excepción documentada**: el commit inicial de la documentación de M0 se hizo directamente en `main` (repositorio vacío, sin CI aún). A partir de ahí, todo cambio entra por PR.

## Consecuencias

- Cada cambio pasa por la misma barrera automática, sea humano o IA.
- La CI necesita secretos de prueba no sensibles (p. ej. `PAYLOAD_SECRET` de test generado en el workflow); nunca credenciales de producción.
- Coste: GitHub Actions gratuito en repositorios públicos y con cuota mensual en privados; suficiente para el MVP.
