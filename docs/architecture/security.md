# Modelo de seguridad (planificación)

Medidas previstas por amenaza. Cada medida se implementa y **verifica con tests** en el milestone indicado. La revisión de seguridad forma parte de la Definition of Done de cada milestone.

## Activos

1. Integridad del contenido público (que nadie ajeno altere la web).
2. Credenciales y sesiones de los administradores.
3. Secretos de infraestructura (`PAYLOAD_SECRET`, `DATABASE_URL`, claves S3).
4. Disponibilidad razonable del sitio.

## Amenazas y medidas

| Amenaza | Medida | Milestone | Verificación |
|---|---|---|---|
| Acceso no autorizado a escritura | Access control por defecto denegado; función `authenticated` para create/update/delete en todas las colecciones/globals. | M2 | Tests de integración: operaciones anónimas → rechazadas |
| Lectura de datos privados | `users` sin lectura pública; constraint de lectura en platos ocultos/categorías ocultas; GraphQL deshabilitado. | M2/M4 | Tests de integración + REST anónimo |
| Fuerza bruta en login | `maxLoginAttempts: 5`, `lockTime: 10 min`; mensajes de error genéricos. Rate limiting a nivel de plataforma (firewall del hosting) en M7. | M2/M7 | Test de integración del bloqueo |
| Contraseñas débiles | Mínimo 12 caracteres. | M2 | Test |
| Robo de sesión / XSS | Cookies HttpOnly + Secure + SameSite=Lax; sin HTML de usuario renderizado (React escapa); sin `dangerouslySetInnerHTML` salvo JSON-LD serializado escapando `<`; CSP en M7. | M2/M5/M7 | Tests unitarios del serializador JSON-LD; revisión de cabeceras |
| CSRF | Cookies SameSite=Lax + lista `csrf` de Payload con `serverURL` permitido; `cors` restringido a `serverURL`. | M2 | Test: petición con Origin no permitido rechazada |
| SQL injection | Solo Payload/Drizzle (consultas parametrizadas); sin SQL crudo con datos de usuario. | Todos | Revisión de código |
| Subida de archivos maliciosos | Lista blanca de MIME de imagen verificada por contenido; SVG prohibido; 4 MB máx.; nombres saneados; reprocesado con sharp; bucket solo con lectura pública (escritura únicamente con claves del servidor). | M3 | Tests de integración: archivo no imagen con extensión `.jpg`, SVG, > 4 MB → rechazados |
| URLs maliciosas en contenido (`javascript:`) | Validación de URLs: solo `https:`; lista de hosts para Maps; `wa.me`/`tel:`/`mailto:` construidos por código, no introducidos por el usuario. | M3 | Tests unitarios de validadores |
| Exposición de secretos | Solo variables de entorno; `.env*` en `.gitignore`; ninguna variable secreta con prefijo `NEXT_PUBLIC_`; validación de entorno al arrancar. | M1 | Test unitario de `env.ts`; revisión |
| Exposición de tablas vía Supabase Data API (PostgREST) | Deshabilitar la Data API del proyecto Supabase **y/o** usar esquema dedicado `payload` no expuesto; RLS habilitado en tablas como defensa en profundidad si se mantiene la Data API. | M1/M7 | Comprobación manual documentada: `GET https://<project>.supabase.co/rest/v1/...` con anon key → sin datos |
| Abuso de endpoints / DoS | Páginas públicas cacheadas; API pública solo lectura de datos públicos; límites de paginación de Payload; firewall/rate limiting del hosting. | M5/M7 | Revisión de configuración |
| Cabeceras inseguras | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`, HSTS (en el hosting), CSP. | M7 | Test E2E/HTTP de cabeceras |
| Dependencias vulnerables | Versiones fijadas; `pnpm audit` en cada milestone; lockfile versionado. | Todos | Salida de `pnpm audit` registrada |
| Pérdida de datos | Backups automáticos de Supabase (según plan); versiones de globals; procedimiento documentado. | M7 | Documentación de operación |

## Principio de mínimo privilegio

- La aplicación usa una cadena de conexión con un rol de base de datos para Payload (en Supabase, el rol `postgres` es el habitual; evaluar en M7 un rol dedicado con permisos solo sobre su esquema).
- Claves S3 de Supabase Storage solo en el servidor. Se evalúa en M3 si Supabase permite limitar las claves a un bucket; si no, se documenta la limitación.
- No se usan las claves `anon`/`service_role` de Supabase en la aplicación (no hay cliente Supabase JS).
