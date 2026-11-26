# Milestone 2 — Authentication & Admin Foundation

- **Estado**: ✅ Cerrado (2026-11-26). PR [#2](https://github.com/danilokosam/rstaurante/pull/2) con CI en verde, correcciones de la revisión incorporadas y fusionado con squash merge.

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
  - Validador puro de contraseña (mínimo 12 caracteres, mensaje en el idioma del panel: `es` por defecto, `en`) en `src/lib/password.ts` + uso en `Users`.
  - Colección `Users`: `maxLoginAttempts: 5`, `lockTime: 10 * 60 * 1000` (10 min), cookies `HttpOnly`, `Secure` en producción, `SameSite=Lax`, protección contra borrado del último usuario (serializada con un _advisory lock_ de PostgreSQL dentro de la transacción para que dos borrados simultáneos no vacíen la colección).
  - `payload.config.ts`: `cors` y `csrf` restringidos a `env.serverUrl`; `i18n` del panel (`es` por defecto, `en` disponible con `@payloadcms/translations`; el usuario cambia el idioma del panel desde su cuenta); `localization` (`locales` y `defaultLocale` reutilizados de `src/i18n/config.ts`, `fallback: true`). El idioma del panel y el idioma del contenido que se edita son independientes.
  - Migración `20261125_122312`: crea el tipo enumerado `_locales` (`es`, `en`) que necesita la localización. Los campos `login_attempts` y `lock_until` ya existían desde la migración inicial.
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
- [x] Correcciones de la revisión de la PR #2 (ver abajo)

## Verificación ejecutada (2026-11-26, tras las correcciones de la revisión)

| Comprobación                       | Resultado                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `eslint . --max-warnings=0`        | ✅ 0 errores, 0 warnings                                                                                                   |
| `tsc --noEmit --incremental false` | ✅ 0 errores                                                                                                               |
| `vitest run --project unit`        | ✅ 5 archivos, 40 tests en verde (`env`, `testDatabase`, `i18n-config`, `password`, `access`)                              |
| `vitest run --project int`         | ✅ 2 archivos, 16 tests en verde (`database`, `auth`, aplicando migraciones `20261124_205719_initial` y `20261125_122312`) |
| `next build`                       | ✅ Compilación y build de producción correctos                                                                             |
| `playwright test`                  | ✅ 2 archivos, 6 tests E2E en verde (`smoke`, `auth`)                                                                      |

## Correcciones de la revisión (2026-11-26)

| Problema detectado                                                                                                                                                | Corrección                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `LocaleSync` cambiaba el idioma del panel al cambiar el idioma del contenido: impedía traducir contenido al inglés con el panel en español; fuera de alcance/ADR. | Eliminado. El idioma del panel se cambia desde la cuenta del usuario (funcionalidad nativa de Payload). |
| El E2E dejaba en la base de datos un administrador con contraseña conocida y podía ejecutarse contra una base de datos remota.                                    | El E2E solo se ejecuta contra una base de datos local y borra el usuario de prueba antes y después.     |
| Dos borrados simultáneos podían eliminar a los dos últimos usuarios (reproducido en 5 de 6 ejecuciones).                                                          | _Advisory lock_ de transacción en `beforeDelete` + test de integración de concurrencia.                 |
| Faltaban tests de CSRF real, de error genérico de login y de cookie rechazada tras el logout.                                                                     | Añadidos (integración y E2E).                                                                           |
| Mensaje de contraseña corta solo en inglés.                                                                                                                       | Mensaje según el idioma del panel (español por defecto).                                                |
| Locales `es`/`en` duplicados en `payload.config.ts`.                                                                                                              | Reutiliza `locales` y `defaultLocale` de `src/i18n/config.ts`.                                          |
| Documentación de la migración incorrecta y `MILESTONE.md` desactualizado.                                                                                         | Corregidos.                                                                                             |

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
   - Cookie de sesión enviada desde un `Origin` no permitido: se ignora (CSRF); desde `serverURL`: se acepta.
   - Mismo error genérico para email inexistente y contraseña incorrecta (US-A1 CA2).
   - Dos borrados simultáneos de los dos únicos usuarios: solo uno tiene éxito y queda un usuario.
   - Panel en español por defecto con inglés disponible (RF-I18N-05).
3. **E2E (`tests/e2e/auth.e2e.spec.ts`)**:
   - Visitar `/admin` sin sesión redirige a `/admin/login` (o `/admin/create-first-user` si la BD está vacía).
   - Login con credenciales válidas da acceso al panel y muestra la interfaz en español por defecto.
   - Logout invalida la sesión: volver a `/admin` exige login y la cookie anterior es rechazada por la API (US-A2 CA1 y CA2).
   - Solo se ejecuta contra una base de datos local y borra el usuario de prueba al terminar.
