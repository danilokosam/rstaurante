# ADR-0004: Almacenamiento de imágenes — Supabase Storage vía API S3

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

El CMS permite subir imágenes (logo, hero, platos, galería). En un hosting serverless el disco no es persistente, por lo que en producción hace falta un almacenamiento de objetos. Se pide **una única solución** inicial.

## Opciones consideradas

| Opción                                                                                               | Pros                                                                                                                                                                                      | Contras                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1. **Supabase Storage** con `@payloadcms/storage-s3` (Supabase ofrece un endpoint compatible con S3) | Mismo proveedor que la BD (una cuenta, una factura, un panel); plugin oficial de Payload; protocolo S3 estándar → portable a S3/R2/etc. cambiando solo variables. Plan gratuito con 1 GB. | Configuración S3 algo menos conocida (`forcePathStyle`, endpoint propio); claves S3 de Supabase con alcance de proyecto. |
| 2. Vercel Blob (`@payloadcms/storage-vercel-blob`)                                                   | Integración sencilla si se despliega en Vercel.                                                                                                                                           | Ata el almacenamiento al proveedor de hosting; segundo proveedor de datos.                                               |
| 3. Disco local de Payload                                                                            | Cero configuración.                                                                                                                                                                       | No persistente en serverless; no válido para producción.                                                                 |
| 4. Supabase Storage vía `supabase-js` (adaptador propio)                                             | —                                                                                                                                                                                         | Código a medida que mantener; el plugin S3 oficial ya resuelve el problema.                                              |

## Decisión

**Opción 1**: Supabase Storage mediante el plugin oficial `@payloadcms/storage-s3`, en un bucket `media` con **lectura pública** (las imágenes de la web son públicas por naturaleza) y escritura solo con las claves S3 del servidor.

- Las imágenes se sirven **directamente desde la URL pública de Supabase Storage** (sin pasar por el servidor de la app), configurando el plugin para no proxificar los archivos (`disablePayloadAccessControl` + generación de URL pública). Detalle exacto a verificar en M3 con la documentación del plugin instalado.
- **Local y test**: si las variables S3 no están definidas, Payload usa su almacenamiento en disco por defecto. La validación de entorno **exige** las variables S3 en producción (no puede desplegarse sin ellas). No es un segundo sistema de almacenamiento en producción, sino el modo por defecto de Payload para desarrollo.

## Motivos

- Un solo proveedor de datos (Supabase) para BD y archivos; plugin oficial; portabilidad por usar S3.

## Trade-offs y consecuencias

- Los tests de integración de subida se ejecutan contra disco local; la integración real con Supabase se verifica con una prueba manual/smoke documentada en M3 y en M7.
- La optimización de imágenes: Payload genera tamaños con sharp (WebP). Si se usa además `next/image` (optimización del hosting) se decide en M5/M7 por coste.

## Impacto

- Seguridad: bucket solo lectura pública; claves de escritura solo en el servidor; validación de tipo por contenido en Payload (ver security.md).
- Coste: 1 GB gratuito; imágenes limitadas a 4 MB y redimensionadas.
