# Restaurant Website CMS (MVP)

Web pública para un restaurante + panel de administración (CMS) con el que el propio restaurante mantiene al día su contenido (carta, precios, fotos, horarios, contacto y redes) **sin conocimientos técnicos y sin depender de un desarrollador**.

- **Una instancia por restaurante**: un despliegue, una base de datos y un bucket de imágenes. Sin multi-tenancy ([ADR-0002](docs/decisions/ADR/ADR-0002-single-instance-monolith.md)).
- **Web en español e inglés**: el español es obligatorio y el inglés opcional; si falta una traducción, se muestra el español.
- **Guardar = publicar**: lo que se guarda en el panel aparece en la web, con historial de versiones para deshacer errores.

Visión completa: [docs/product/vision.md](docs/product/vision.md) · Alcance del MVP: [docs/product/mvp-scope.md](docs/product/mvp-scope.md)

## Estado del proyecto

El desarrollo avanza por milestones, con TDD y una Pull Request por funcionalidad. Estado al día y siguiente paso: [MILESTONE.md](MILESTONE.md).

| #   | Milestone                              | Estado                       |
| --- | -------------------------------------- | ---------------------------- |
| M0  | Definición del producto y arquitectura | ✅ Cerrado                   |
| M1  | Base del proyecto                      | ✅ Cerrado (PR #1)           |
| M2  | Autenticación y panel                  | ✅ Cerrado (PR #2)           |
| M3  | CMS y contenido                        | ✅ Cerrado (PRs #3, #4 y #5) |
| M4  | Carta del restaurante                  | ⏳ Siguiente                 |
| M5  | Web pública                            | ⏳ Pendiente                 |
| M6  | Personalización y branding             | ⏳ Pendiente                 |
| M7  | Despliegue y demo                      | ⏳ Pendiente                 |

### Qué funciona hoy

El **panel de administración** (`/admin`), en español por defecto y con inglés disponible:

- **Acceso seguro**:
  - Login con email y contraseña de 12 caracteres como mínimo.
  - La cuenta se bloquea 10 minutos tras 5 intentos fallidos.
  - Cerrar sesión invalida la sesión en el servidor.
  - No se puede borrar el último usuario.
  - No hay registro público: los usuarios los crea otro administrador.
- **Imágenes**:
  - Solo JPEG, PNG, WebP y AVIF de hasta 4 MB, comprobando el contenido real del archivo. SVG y el resto de formatos se rechazan.
  - Texto alternativo obligatorio en español.
  - Tamaños automáticos en WebP y punto de enfoque para los recortes.
- **Información del restaurante**: nombre, eslogan, logo, contacto (teléfono, email, WhatsApp), dirección y enlace de Google Maps, horarios (varias franjas por día, incluso pasada la medianoche), redes sociales y SEO.
- **Portada**: título, subtítulo e imagen principales; botón de acción (ver la carta, WhatsApp, llamar o enlace externo); «Sobre nosotros»; títulos de sección; SEO.
- **Galería**: hasta 30 imágenes ordenables arrastrando.
- **Historial de versiones**: la información del restaurante y la portada guardan las últimas 20 versiones y se pueden restaurar.
- **Mensajes de validación claros** en el idioma del panel (formato de WhatsApp, URL `https`, horas `HH:MM`…).
- **Publicación**: al guardar se marca toda la web para actualizarse. Si eso falla, el cambio queda guardado igualmente.

### Qué falta

- **La carta** (categorías, platos, precios en EUR, disponibilidad y los 14 alérgenos de la UE) llega en **M4**.
- **La web pública** es de momento una página provisional. Las páginas reales (`/es`, `/en`, la carta, SEO, accesibilidad) llegan en **M5**.
- **El despliegue en Vercel + Supabase y la demo** llegan en **M7**.

## Stack

| Pieza         | Elección                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| Aplicación    | Next.js 16.4 (App Router) + React 19.2, TypeScript 5 en modo estricto                                   |
| CMS           | Payload 3.94: panel, autenticación, validación, control de acceso y API, dentro de la misma app Next.js |
| Base de datos | PostgreSQL: Supabase en producción, Docker en local; esquema versionado con migraciones                 |
| Imágenes      | Supabase Storage (API S3) en producción; disco local en desarrollo y tests                              |
| Estilos       | Tailwind CSS 4 (solo en la web pública)                                                                 |
| Tests         | Vitest (unitarios e integración contra PostgreSQL real) + Playwright (E2E)                              |
| CI            | GitHub Actions: formato, lint, tipos, tests, auditoría, migraciones, build y E2E en cada PR             |
| Hosting (M7)  | Vercel + Supabase                                                                                       |

Las decisiones y sus motivos están en los [ADRs](docs/decisions/ADR/README.md).

## Arquitectura en breve

```
Navegador ──► Next.js (una sola app)
                ├── /es, /en …        web pública (lee el contenido con la Local API de Payload,
                │                      respetando las mismas reglas de acceso que la API)
                ├── /admin             panel de Payload
                └── /api/…             API REST de Payload (la usa el panel)
                       │
                       ├── PostgreSQL  (contenido, usuarios, versiones)
                       └── Storage S3  (imágenes; disco local sin variables S3)
```

- **Payload es la capa de dominio**: esquema, validación, control de acceso y hooks. La lógica pura (validadores, detección de tipo de imagen, revalidación…) vive en `src/lib` y tiene tests unitarios.
- **Seguro por defecto**: cada colección y global declara quién puede leer y escribir. Lectura pública solo del contenido de la web; todo lo demás exige sesión.

Más detalle: [arquitectura](docs/architecture/architecture.md) · [modelo de datos](docs/architecture/data-model.md) · [seguridad](docs/architecture/security.md).

## Puesta en marcha

Requisitos: Node.js ≥ 24.22.3, pnpm 11 y Docker.

```bash
pnpm install
docker compose up -d                 # PostgreSQL 17 en 127.0.0.1:5433 (BD de desarrollo y de tests)
cp .env.example .env                 # y rellena PAYLOAD_SECRET (openssl rand -hex 32)
pnpm migrate                         # crea las tablas
pnpm exec playwright install chromium
pnpm dev                             # http://localhost:3000 y http://localhost:3000/admin
```

Con la base de datos vacía, `/admin` pide crear el primer usuario. Guía completa y problemas frecuentes: [docs/development/setup.md](docs/development/setup.md). Variables de entorno: [docs/operations/environment.md](docs/operations/environment.md).

> Al cambiar a una rama con migraciones nuevas, ejecuta `pnpm migrate` antes de los tests E2E.

### Comandos principales

| Comando                      | Qué hace                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`                   | Servidor de desarrollo                                                      |
| `pnpm verify`                | Formato + lint + tipos + unitarios + integración + build (antes de cada PR) |
| `pnpm test:e2e`              | Tests E2E con Playwright                                                    |
| `pnpm migrate`               | Aplica las migraciones pendientes                                           |
| `pnpm migrate:create <name>` | Genera una migración tras cambiar colecciones o globals                     |

## Estructura del repositorio

```
src/
├── app/(frontend)/[locale]/   web pública (/es, /en)
├── app/(payload)/             panel /admin y API de Payload (generado)
├── collections/               users, media
├── globals/                   site-settings, homepage, gallery
├── access/                    reglas de acceso reutilizables
├── fields/                    piezas de campos reutilizables (p. ej. obligatorio solo en español)
├── hooks/                     hooks de Payload (revalidación de la web)
├── lib/                       lógica pura con tests: entorno, validadores, imágenes, storage…
├── i18n/                      idiomas (es/en)
└── migrations/                migraciones de base de datos versionadas
tests/
├── unit/                      Vitest, sin base de datos
├── int/                       Vitest + Payload + PostgreSQL de tests (rstaurante_test)
└── e2e/                       Playwright contra la app arrancada
docs/                          producto, arquitectura, desarrollo, operación, milestones y ADRs
```

## Cómo contribuir

Personas y agentes de IA siguen el mismo flujo ([CONTRIBUTING.md](CONTRIBUTING.md)):

1. Trabajar solo en el milestone activo ([MILESTONE.md](MILESTONE.md)).
2. Una rama por funcionalidad (`feat/m4-…`) y **nunca commits directos a `main`**.
3. TDD: primero el test, que falla por la razón esperada; después el código.
4. `pnpm verify` y `pnpm test:e2e` en local, Pull Request a `main`, CI en verde y revisión antes del _squash merge_.
5. Código y commits en inglés; documentación en español.

## Documentación

Índice completo: [docs/README.md](docs/README.md)

- Producto: [visión](docs/product/vision.md) · [alcance](docs/product/mvp-scope.md) · [requisitos](docs/product/requirements.md) · [user stories](docs/product/user-stories.md)
- Desarrollo: [puesta en marcha](docs/development/setup.md) · [estrategia de tests](docs/development/testing-strategy.md) · [convenciones](docs/development/conventions.md)
- Milestones: [M0](docs/milestones/milestone-0.md) · [M1](docs/milestones/milestone-1.md) · [M2](docs/milestones/milestone-2.md) · [M3](docs/milestones/milestone-3.md)
