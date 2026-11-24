# ADR-0002: Monolito Next.js + Payload, una instancia por restaurante

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

El producto tiene una web pública y un CMS. Se quiere validar con restaurantes individuales antes de invertir en un SaaS. Hay que decidir la forma del sistema y cómo se relaciona con un posible futuro multi-tenant.

## Opciones consideradas

1. **Una aplicación Next.js con Payload embebido** (web + admin + API en un proyecto y un despliegue).
2. Dos aplicaciones (CMS headless separado + frontend que consume su API).
3. SaaS multi-tenant desde el inicio (p. ej. `@payloadcms/plugin-multi-tenant`).

## Decisión

Opción 1. **Un repositorio, una aplicación, un despliegue por restaurante**, con su propia base de datos y su propio bucket. Sin tenants ni campos `tenantId`.

## Motivos

- Payload 3 está diseñado para ejecutarse dentro de Next.js: la web pública puede leer con la **Local API** (sin HTTP, tipada), lo que simplifica y acelera.
- Un solo despliegue reduce coste y operación.
- El multi-tenant añade aislamiento de datos, control de acceso por tenant y dominios dinámicos: complejidad no justificada sin clientes.

## Trade-offs y consecuencias

- Cada nuevo cliente = nuevo despliegue + nuevo proyecto Supabase (operación manual, documentada en M7). Aceptable para 1–4 clientes.
- Las actualizaciones de código se aplican a cada instancia por separado.
- **Lo que facilita una evolución futura sin coste hoy**: todo el contenido del restaurante sale del CMS (nada codificado a mano); configuración por variables de entorno; modelo de datos limpio y documentado. Con 3–4 clientes se evaluará `plugin-multi-tenant` u otra opción (FP-10).

## Impacto

- Seguridad: aislamiento total entre clientes (instancias separadas).
- Costes: un proyecto de hosting + uno de Supabase por cliente (en planes gratuitos/entrada hay límites de número de proyectos; revisar en M7).
