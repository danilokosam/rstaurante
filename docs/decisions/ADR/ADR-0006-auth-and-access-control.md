# ADR-0006: Autenticación y control de acceso

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0

## Contexto y problema

Solo el personal autorizado del restaurante puede editar contenido. Los visitantes solo leen contenido público.

## Opciones consideradas

1. **Autenticación nativa de Payload** (colección `users` con `auth: true`).
2. Supabase Auth + integración personalizada con Payload.
3. Proveedor externo (Clerk, Auth0…).

## Decisión

- **Opción 1.** Sin Supabase Auth ni otros proveedores.
- Configuración prevista (M2): `maxLoginAttempts: 5`, `lockTime: 10 min`, cookies `HttpOnly`/`Secure` (prod)/`SameSite=Lax`, contraseña mínima de 12 caracteres, `serverURL` + `csrf` + `cors` restringidos al dominio de la instancia, GraphQL deshabilitado.
- **Un único rol en el MVP**: todo usuario autenticado es administrador. No hay registro público; los usuarios los crea otro administrador (o el flujo de primer usuario / seed).
- **Access control explícito en cada colección/global**, con funciones reutilizables en `src/access/`:
  - `authenticated` → create/update/delete en todo; read en `users`.
  - `anyone` → read en `media`, globals.
  - Lectura con constraint (`Where`) para visitantes en `dishes` (no `hidden`, categoría visible) y `menu-categories` (`isVisible`).
- La web pública usa la Local API con `overrideAccess: false` (sin usuario) para que se apliquen las mismas reglas que a la API REST.

## Motivos

- Payload ya resuelve sesión, hash de contraseñas (PBKDF2), bloqueo, recuperación de contraseña y UI de login. Añadir otro sistema duplicaría superficie de ataque y complejidad.
- Un rol basta para 1–3 usuarios de confianza; un rol `editor` es una propuesta futura (FP-03). Añadirlo después implica un campo `role` + ajustar funciones de acceso (cambio acotado).

## Trade-offs y consecuencias

- Cualquier usuario autenticado puede gestionar otros usuarios. Mitigación: impedir borrar el último usuario; documentar que solo deben crearse cuentas para personas de confianza.
- Recuperación de contraseña por email requiere configurar un adaptador de email (no incluido en el MVP); mientras tanto, otro administrador puede restablecer la contraseña o se hace por script. Se documenta en M2 y se reevalúa en M7.

## Impacto

- Seguridad: ver [security.md](../../architecture/security.md). Tests de permisos obligatorios en M2 (y en cada colección nueva).
