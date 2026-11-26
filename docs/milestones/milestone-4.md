# Milestone 4 — Restaurant Menu Management

- **Estado**: 🚧 Implementado y verificado en local (rama `feat/m4-menu-management`), pendiente de revisión/PR.
- **Inicio**: 2026-11-26.

## Objetivo

Que el administrador gestione desde el panel de Payload CMS la carta completa del restaurante: categorías (`menu-categories`) y platos (`dishes`), con orden manual (`orderable`), precios en EUR validados, disponibilidad de tres estados, platos destacados, los 14 alérgenos UE en un campo `select` múltiple (`hasMany: true`), textos en español (obligatorio) e inglés (opcional con _fallback_), acceso público restringido a categorías visibles y platos no ocultos, borrado protegido de categorías con platos y revalidación del sitio al guardar o borrar.

## Requisitos y user stories cubiertos

- **Requisitos**: `RF-MENU-01` a `RF-MENU-08`, `RF-PUB-01` (hooks de revalidación en las colecciones de carta), `RF-I18N-02`, `RNF-07`.
- **User stories**: `US-E1` a `US-E5` (la parte de gestión y API del CMS; la presentación en la web pública `/{locale}/menu` y el aviso fijo de alergias corresponden a M5).
- **ADRs**: [ADR-0005](../decisions/ADR/ADR-0005-content-model.md), [ADR-0006](../decisions/ADR/ADR-0006-auth-and-access-control.md), [ADR-0007](../decisions/ADR/ADR-0007-publishing-and-caching.md), [ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md), [ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md).
- **Pendientes heredados de M3**: hooks de revalidación (`revalidateSiteAfterChange`, `revalidateSiteAfterDelete`) y `requiredInDefaultLocale` en `menu-categories` y `dishes`.

## Alcance

### Incluido

1. **Lista única de los 14 alérgenos UE** en `src/lib/allergens.ts`:
   - Códigos cerrados del Reglamento (UE) 1169/2011 (Anexo II) con etiquetas en español e inglés (ADR-0011).
   - Fuente única compartida entre el campo `select` múltiple (`hasMany: true`) de `dishes` en Payload y la futura web pública (M5).
2. **Validador puro de precio** en `src/lib/validation/price.ts` (TDD unitario):
   - Obligatorio, número finito, `0 ≤ price ≤ 9999.99`, máximo 2 decimales (EUR).
   - Mensajes de error claros en español e inglés según el idioma del panel.
   - Adaptador `numberValidator` en `src/fields/validate.ts`.
3. **Colección `menu-categories`** (`src/collections/MenuCategories.ts`):
   - `name` 🌐 (`requiredInDefaultLocale`, `unique: true`, máx. 80), `description` 🌐 (`textarea`, máx. 300), `isVisible` (`checkbox`, por defecto `true`), `orderable: true` (`defaultSort: '_order'`).
   - Access control: lectura pública solo `isVisible = true`; autenticados ven todo; escritura solo autenticados.
   - `beforeDelete`: impide borrar si existen platos asociados (`APIError` 400 con mensaje claro en el idioma del panel).
   - Hooks `afterChange` y `afterDelete`: `revalidateSiteAfterChange` / `revalidateSiteAfterDelete`.
4. **Colección `dishes`** (`src/collections/Dishes.ts`):
   - `name` 🌐 (`requiredInDefaultLocale`, máx. 120), `description` 🌐 (`textarea`, máx. 500), `price` (`number`, obligatorio, `0..9999.99`, máx. 2 decimales, almacenado como `numeric` en Postgres), `image` (`upload → media`, opcional), `category` (`relationship → menu-categories`, obligatorio), `availability` (`select`: `available` | `unavailable` | `hidden`, por defecto `available`), `isFeatured` (`checkbox`, por defecto `false`), `allergens` (`select` con `hasMany: true` sobre los 14 alérgenos UE, no localizado), `orderable: true` (`defaultSort: '_order'`).
   - Access control: lectura pública solo cuando `availability != 'hidden'` **y** `category.isVisible = true`; autenticados ven todo; escritura solo autenticados.
   - Hooks `afterChange` y `afterDelete`: `revalidateSiteAfterChange` / `revalidateSiteAfterDelete`.
   - Usabilidad del panel (RNF-07): columnas visibles por defecto (`name`, `category`, `price`, `availability`, `isFeatured`), cambio de disponibilidad desde el formulario y edición masiva en el listado (US-E3 CA3), descripciones de ayuda en español e inglés.
5. **Migración de base de datos y tipos regenerados** (`src/migrations/`, `src/payload-types.ts`).

### Excluido

- Páginas públicas (`/{locale}/menu`, destacados en home, aviso de alergias y formato de precios en UI) → **M5**.
- Campos de branding → **M6**.
- Trazas, etiquetas dietéticas o filtro por alérgenos (fuera del MVP, FP-12/FP-13).

## Plan de tests (TDD)

1. **Unit**:
   - `src/lib/allergens.ts`: exactamente 14 códigos UE sin duplicados, todos con etiquetas `es` e `en` no vacías, helper de validación/etiqueta.
   - `src/lib/validation/price.ts`: casos válidos (`0`, `12`, `12.5`, `12.50`, `19.99`, `9999.99`), inválidos (negativos, `10000`, `9999.999`, `1.005`, `NaN`, `Infinity`, `null`, `undefined`, cadenas), mensajes en `es` y `en`.
2. **Integración** (Payload + PostgreSQL real):
   - Access control: anónimo no puede crear/actualizar/borrar categorías ni platos; anónimo solo lee categorías `isVisible: true` y platos con `availability != 'hidden'` cuya categoría sea visible (también verificado tras ocultar categoría); autenticado lee y escribe todo.
   - Categorías: `name` obligatorio en español y opcional en inglés (fallback), unicidad por idioma, `isVisible` por defecto `true`, orden manual (`orderable`), borrado bloqueado cuando tiene platos y permitido tras mover/borrar platos.
   - Platos: `name` obligatorio en español y opcional en inglés (fallback), `price` validado (límites y 2 decimales, rechazado con 3 decimales o fuera de rango), `category` obligatoria, `image` opcional (al borrar imagen usada queda en `null`), `availability` por defecto `available`, `isFeatured` por defecto `false`, `allergens` (`select` múltiple `hasMany: true`) acepta 0..14 códigos válidos, rechaza valores fuera de la lista y duplicados, orden manual (`orderable`).
   - Revalidación: crear/actualizar/borrar categorías y platos dispara `revalidateSite`.
3. **E2E** (`tests/e2e/`):
   - Desde `/admin`: crear una categoría, crear un plato con precio, categoría y alérgenos seleccionados en el `select` múltiple, y cambiar su disponibilidad (`available` → `unavailable`), verificando que los cambios se persisten en Payload.

## Checklist

- [x] Rama `feat/m4-menu-management` creada desde `main` y plan documentado
- [x] TDD unit: lista de 14 alérgenos (`src/lib/allergens.ts`)
- [x] TDD unit: validador de precio (`src/lib/validation/price.ts`) y adaptador `numberValidator`
- [x] TDD integración: `menu-categories` y `dishes` (CRUD, validaciones, visibilidad, borrado protegido, alérgenos, localización, orden, revalidación)
- [x] Implementación de `MenuCategories`, `Dishes` y registro en `payload.config.ts`
- [x] Migración generada (`20261126_203258_menu_categories_and_dishes`) + `payload-types.ts` regenerados + `schema-drift-check` sin cambios pendientes
- [x] E2E: crear categoría/plato con alérgenos (`select` múltiple) y cambiar disponibilidad desde `/admin` (`tests/e2e/menu.e2e.spec.ts`)
- [x] Verificación técnica: `typecheck`, `lint`, `test:unit` (14 archivos, 178 tests), `test:int` (8 archivos, 91 tests), `build`, `schema-drift-check` y `test:e2e` (8 tests en 4 archivos) en verde
- [x] Documentación (`data-model.md`, `milestone-4.md`, `MILESTONE.md`) actualizada

## Hallazgos de la implementación

- **`orderable: true` no fija `defaultSort`**: en Payload 3.94.1, `orderable: true` añade el campo `_order` y el endpoint de reordenación, pero `payload.find()` sigue ordenando por `-createdAt` salvo que se añada explícitamente `defaultSort: '_order'` en la colección.
- **Alérgenos como `select` múltiple (`hasMany: true`)**: Drizzle genera el enum `enum_dishes_allergens` y la tabla auxiliar `dishes_allergens`; Payload valida automáticamente que todos los valores pertenezcan a las 14 opciones cerradas y rechaza duplicados.
- **Lectura pública de platos con relación**: `{ and: [{ availability: { not_equals: 'hidden' } }, { 'category.isVisible': { equals: true } }] }` tipado como `Where` oculta de forma inmediata los platos cuya categoría pasa a `isVisible: false` (verificado en test de integración).
- **Observación sobre entorno local (`format:check` y BD dev)**:
  - Con el servidor previo detenido, los 8 tests E2E (`smoke`, `auth`, `homepage` y `menu`) pasan en verde.
  - En Windows con `core.autocrlf`, `prettier --check` reporta CRLF en los archivos del working tree; los archivos de M4 pasan `prettier --end-of-line auto --check`.
  - La BD local de desarrollo (`rstaurante`) tenía el esquema inicial en modo `push`, por lo que `pnpm migrate` pidió confirmación (cancelada para no alterar datos locales); los tests de integración verificaron la migración completa desde BD vacía en `rstaurante_test`.

## Commit propuesto (no ejecutado)

```text
feat(menu): add menu categories, dishes, EU allergens and price validation
```
