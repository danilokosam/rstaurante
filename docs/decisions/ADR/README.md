# Architecture Decision Records (ADR)

Registro de decisiones técnicas importantes. Las decisiones triviales no llevan ADR.

## Convenciones

- Archivo: `ADR-NNNN-titulo-en-kebab-case.md`, numeración correlativa, nunca se reutiliza un número.
- Estados: `Proposed` → `Accepted` | `Rejected`; más tarde `Deprecated` o `Superseded by ADR-XXXX`.
- Un ADR aceptado **no se reescribe**: si la decisión cambia, se crea uno nuevo que lo sustituye y se actualiza el estado del anterior (se permiten correcciones menores y notas de verificación con fecha).
- Plantilla: [ADR-template.md](ADR-template.md).

## Índice

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [0001](ADR-0001-tech-stack-and-versions.md) | Stack tecnológico y versiones | Accepted | 2026-11-24 |
| [0002](ADR-0002-single-instance-monolith.md) | Monolito Next.js + Payload, una instancia por restaurante | Accepted | 2026-11-24 |
| [0003](ADR-0003-database-supabase-postgres.md) | Base de datos: Supabase PostgreSQL con el adaptador de Payload | Accepted | 2026-11-24 |
| [0004](ADR-0004-media-storage.md) | Almacenamiento de imágenes: Supabase Storage vía API S3 | Accepted | 2026-11-24 |
| [0005](ADR-0005-content-model.md) | Modelo de contenido (ampliado por 0010 y 0011) | Accepted | 2026-11-24 |
| [0006](ADR-0006-auth-and-access-control.md) | Autenticación y control de acceso | Accepted | 2026-11-24 |
| [0007](ADR-0007-publishing-and-caching.md) | Publicación y caché: guardar = publicar + revalidación | Accepted | 2026-11-24 |
| [0008](ADR-0008-testing-strategy.md) | Estrategia de testing | Accepted | 2026-11-24 |
| [0009](ADR-0009-deployment.md) | Despliegue: Vercel + Supabase | Accepted | 2026-11-24 |
| [0010](ADR-0010-i18n-spanish-english.md) | Internacionalización: español e inglés | Accepted | 2026-11-24 |
| [0011](ADR-0011-allergens-and-currency.md) | Alérgenos y moneda fija EUR | Accepted | 2026-11-24 |
| [0012](ADR-0012-branching-and-ci-cd.md) | Flujo de ramas (GitHub Flow) y CI/CD | Accepted | 2026-11-24 |
