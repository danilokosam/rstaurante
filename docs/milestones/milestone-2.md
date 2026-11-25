# Milestone 2 — Authentication & Admin Foundation

- **Estado**: 🚧 En progreso (rama `feat/m2-auth-admin`, iniciado 2026-11-25).

## Objetivo

Asegurar la autenticación y el control de acceso del CMS desde la base: colección `users` endurecida (bloqueo por fuerza bruta, contraseña ≥ 12 caracteres, protección del último usuario), funciones de acceso reutilizables en `src/access/`, protección CSRF/CORS en `payload.config.ts`, panel de administración en español (+ inglés) y localización de contenido `es`/`en` configurada.

## Requisitos y user stories cubiertos

- **Requisitos**: `RF-AUTH-01` a `RF-AUTH-07`, `RF-I18N-02`, `RF-I18N-05`.
- **User stories**: `US-A1`, `US-A2`, `US-A3`, `US-A4`.
- **ADRs**: [ADR-0006](../decisions/ADR/ADR-0006-auth-and-access-control.md), [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md).

## Alcance

- **Incluido**:
  - Funciones de acceso en `src/access/` (`authenticated`, `anyone`).
  - Reglas de acceso explícitas en `Users` y `Media` (lectura pública para `Media`, escritura solo `authenticated`; `Users` solo `authenticated`).
  - Validador puro de contraseña (mínimo 12 caracteres) en `src/lib/password.ts` + uso en `Users`.
  - Colección `Users`: `maxLoginAttempts: 5`, `lockTime: 10 * 60 * 1000` (10 min), cookies `HttpOnly`, `Secure` en producción, `SameSite=Lax`, protección contra borrado del último usuario.
  - `payload.config.ts`: `cors` y `csrf` restringidos a `env.serverUrl`; `i18n` del panel (`es` por defecto, `en` disponible con `@payloadcms/translations`); `localization` (`locales: ['es', 'en']`, `defaultLocale: 'es'`, `fallback: true`).
  - Migración de base de datos para los cambios de esquema de `users` (`login_attempts`, `lock_until`).
  - Tests unitarios, de integración y E2E (TDD).
- **Excluido**:
  - Colecciones y globals de contenido de M3 (`media` completo con magic bytes/tamaños, `site-settings`, `homepage`, `gallery`) y M4 (`menu-categories`, `dishes`).
  - Recuperación de contraseña por email (sin adaptador de email en el MVP, ver riesgo R-06).

## Checklist

- [x] TDD: tests unitarios de validación de contraseña (`tests/unit/password.test.ts`)
- [x] TDD: tests unitarios de funciones de acceso (`tests/unit/access.test.ts`)
- [x] Implementar `src/lib/password.ts` y `src/access/index.ts`
- [x] TDD: tests de integración de `Users` (access control, bloqueo tras 5 intentos, contraseña < 12, último usuario protegido, CORS/CSRF)
- [x] Configurar `Users` (`auth`, `access`, validación de contraseña, hook `beforeDelete`) y `Media` (`access`)
- [x] Configurar `payload.config.ts` (`cors`, `csrf`, `i18n`, `localization`)
- [x] Generar migración de base de datos (`src/migrations/20261125_122312.ts`) y regenerar `payload-types.ts`
- [x] Escribir tests E2E de `/admin` (`tests/e2e/auth.e2e.spec.ts`)
- [x] Ejecutar `pnpm test:e2e` en local (6/6 tests E2E en verde)
- [x] Typecheck, lint, unit, integración y build en verde
- [x] Revisión de seguridad y actualización de documentación (`MILESTONE.md`, `milestone-2.md`)

## Verificación ejecutada (2026-11-25)

| Comprobación                       | Resultado                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `eslint . --max-warnings=0`        | ✅ 0 errores, 0 warnings                                                                                                   |
| `tsc --noEmit --incremental false` | ✅ 0 errores                                                                                                               |
| `vitest run --project unit`        | ✅ 5 archivos, 38 tests en verde (`env`, `testDatabase`, `i18n-config`, `password`, `access`)                              |
| `vitest run --project int`         | ✅ 2 archivos, 11 tests en verde (`database`, `auth`, aplicando migraciones `20261124_205719_initial` y `20261125_122312`) |
| `next build`                       | ✅ Compilación y build de producción correctos                                                                             |
| `playwright test`                  | ✅ 2 archivos, 6 tests E2E en verde (`smoke`, `auth`)                                                                      |

## Commit propuesto (no ejecutado)

```text
feat(auth): harden users collection, access control, and admin i18n
```

## Plan de tests (TDD)

1. **Unit (`tests/unit/password.test.ts`, `tests/unit/access.test.ts`)**:
   - Contraseña: `< 12` caracteres rechazada, `12` aceptada, vacía/espacios rechazada, mensaje claro.
   - `authenticated`: `true` si `req.user` existe, `false` si `null`/`undefined`.
   - `anyone`: siempre `true`.
2. **Integración (`tests/int/auth.int.spec.ts`)**:
   - Anónimo no puede leer ni crear/actualizar/borrar en `users` (Local API con `overrideAccess: false` y REST).
   - Autenticado puede crear/leer/actualizar usuarios.
   - Contraseña de menos de 12 caracteres rechazada al crear/actualizar usuario.
   - Bloqueo tras 5 intentos de login fallidos (`maxLoginAttempts: 5`, `lockTime: 10 min`).
   - Imposibilidad de borrar el último usuario existente.
   - Petición con `Origin` no permitido rechazada por CSRF/CORS.
3. **E2E (`tests/e2e/auth.e2e.spec.ts`)**:
   - Visitar `/admin` sin sesión redirige a `/admin/login` (o `/admin/create-first-user` si la BD está vacía).
   - Login con credenciales válidas da acceso al panel y muestra la interfaz en español por defecto.
   - Logout invalida la sesión y volver a `/admin` exige login de nuevo.
