# Variables de entorno (planificadas)

> Se implementan y validan en M1 (`src/lib/env.ts`, `.env.example`). Ninguna variable secreta puede tener el prefijo `NEXT_PUBLIC_`.

| Variable | Obligatoria | Secreta | Descripción |
|---|---|---|---|
| `DATABASE_URL` | Sí | Sí | Cadena de conexión PostgreSQL (local Docker o pooler de Supabase). |
| `PAYLOAD_SECRET` | Sí | Sí | Secreto de Payload para firmar tokens. Mín. 32 caracteres aleatorios (`openssl rand -hex 32`). |
| `NEXT_PUBLIC_SERVER_URL` | Sí | No | URL pública de la instancia (`http://localhost:3000` en dev). Usada para `serverURL`, CORS/CSRF, canónicas y sitemap. |
| `S3_ENDPOINT` | Producción | No | Endpoint S3 de Supabase Storage (`https://<project-ref>.storage.supabase.co/storage/v1/s3`; formato a verificar en M3). |
| `S3_REGION` | Producción | No | Región del proyecto Supabase. |
| `S3_BUCKET` | Producción | No | Nombre del bucket (`media`). |
| `S3_ACCESS_KEY_ID` | Producción | Sí | Clave de acceso S3 de Supabase Storage. |
| `S3_SECRET_ACCESS_KEY` | Producción | Sí | Secreto S3. |
| `MEDIA_PUBLIC_URL` | Producción | No | URL base pública del bucket para servir imágenes directamente. |
| `DATABASE_URL_TEST` | Tests | Sí | BD de test local (nunca Supabase). |

Reglas:
- En `NODE_ENV=production` las variables S3 son obligatorias (fail fast).
- Los secretos se gestionan en el panel del hosting / gestor de secretos, nunca en el repositorio.
