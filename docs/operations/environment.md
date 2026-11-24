# Variables de entorno

Validadas al cargar la configuración de Payload por `src/lib/env.ts` (falla al arrancar con la lista de problemas, sin mostrar valores). Plantilla: [`.env.example`](../../.env.example). Ninguna variable secreta puede tener el prefijo `NEXT_PUBLIC_` (se expondría al navegador).

| Variable                 | Obligatoria                 | Secreta | Validación / descripción                                                                                                            |
| ------------------------ | --------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Sí                          | Sí      | `postgres://` o `postgresql://`. Local: Docker (`127.0.0.1:5433/rstaurante`); producción: pooler de Supabase (M7).                  |
| `PAYLOAD_SECRET`         | Sí                          | Sí      | ≥ 32 caracteres (`openssl rand -hex 32`). Firma los tokens de sesión: cambiarlo invalida las sesiones.                              |
| `NEXT_PUBLIC_SERVER_URL` | Sí                          | No      | URL absoluta `http(s)`; se elimina la barra final. Usada como `serverURL` de Payload (y en M2+ para CORS/CSRF, canónicas, sitemap). |
| `S3_ENDPOINT`            | Todas o ninguna (ver abajo) | No      | Endpoint S3 de Supabase Storage (formato exacto a verificar en M3).                                                                 |
| `S3_REGION`              | Todas o ninguna             | No      | Región del proyecto Supabase.                                                                                                       |
| `S3_BUCKET`              | Todas o ninguna             | No      | Bucket de imágenes (`media`).                                                                                                       |
| `S3_ACCESS_KEY_ID`       | Todas o ninguna             | Sí      | Clave S3 de Supabase Storage.                                                                                                       |
| `S3_SECRET_ACCESS_KEY`   | Todas o ninguna             | Sí      | Secreto S3.                                                                                                                         |
| `DATABASE_URL_TEST`      | Solo tests                  | Sí      | BD de tests; **su nombre debe terminar en `_test`** (los tests borran datos y se niegan a ejecutarse en otra BD).                   |

Reglas:

- **S3 todo-o-nada**: si se define alguna variable `S3_*` deben definirse todas (error si la configuración es parcial). Sin ninguna, Payload guarda las subidas en disco local (solo desarrollo/test, ADR-0004). La configuración del almacenamiento S3 se implementa en M3.
- **Pendiente (M7)**: exigir S3 en el despliegue de producción (p. ej. según `VERCEL_ENV=production`). No se exige por `NODE_ENV=production` porque `next build` también se ejecuta en CI sin almacenamiento real.
- **Pendiente (M3)**: URL pública del bucket para servir imágenes directamente, si el plugin la necesita.
- En CI no se usa ningún secreto real: `PAYLOAD_SECRET` se genera en cada ejecución y las BDs son efímeras.
- Los secretos de producción se gestionan en el panel de Vercel, nunca en el repositorio.
