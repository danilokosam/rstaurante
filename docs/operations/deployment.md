# Despliegue (planificación)

> Estado: **planificado**. Se implementa y verifica en M7. Decisión en [ADR-0009](../decisions/ADR/ADR-0009-deployment.md) (aprobada; planes a fijar en M7).

## Topología

- **Aplicación**: Vercel (Next.js 16 + Payload).
- **Base de datos**: Supabase PostgreSQL (misma región que la app), conexión vía pooler.
- **Imágenes**: Supabase Storage, bucket `media` de lectura pública.

## Pasos previstos por instancia (restaurante)

1. Crear proyecto Supabase → **deshabilitar Data API**; crear bucket `media` (público); generar claves S3.
2. Crear proyecto en el hosting conectado al repositorio; configurar variables ([environment.md](environment.md)).
3. Build: `payload migrate && next build` (migraciones antes de publicar la versión).
4. Crear el primer usuario administrador (flujo de primer usuario o script) con contraseña robusta.
5. Configurar dominio y HTTPS; verificar cabeceras de seguridad.
6. Cargar contenido (o seed demo).
7. Checklist post-despliegue: login, edición → publicación, `/es/menu` y `/en/menu`, `sitemap.xml`, `robots.txt`, Lighthouse.

## Operación (a detallar en M7)

- Backups de Supabase y procedimiento de restauración.
- Actualización de dependencias y despliegue de nuevas versiones a cada instancia.
- Rotación de `PAYLOAD_SECRET` y claves S3.
