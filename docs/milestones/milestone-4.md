# Milestone 4 — Restaurant Menu Management

- **Estado**: ✅ Cerrado (2026-11-27). PR [#7](https://github.com/danilokosam/rstaurante/pull/7) (de un colaborador) con CI en verde, revisada por el propietario, correcciones menores incorporadas en la misma PR y fusionada con squash merge.
- **Inicio**: 2026-11-26.

## Revisión del propietario (2026-11-27)

- El plan no se presentó para aprobación antes de implementar (como pedía `MILESTONE.md`); se validó directamente en la revisión de la PR. Para M5 se presentará el plan antes de empezar.
- La revisión confirmó que la PR cubre RF-MENU-01 a 08, los pendientes de M3 y los tests de la matriz de M4. Correcciones menores incorporadas en la misma PR:
  1. **Nombre de categoría** (RF-MENU-01): se recortan los espacios al guardar y la unicidad por idioma no distingue mayúsculas («Postres» y «postres » eran nombres distintos). Hook `beforeValidate` en `menu-categories` con test de integración.
  2. **US-E3 CA3** (disponibilidad desde el listado): verificado con un paso E2E que usa la edición masiva de Payload (seleccionar → «Editar» → Disponibilidad).
  3. **Ayuda del listado de platos**: el orden de los platos es único para toda la carta; la descripción del listado indica filtrar por categoría antes de arrastrar y cómo cambiar la disponibilidad de varios platos.
  4. **Documentación**: criterios de aceptación, pendientes trasladados a M5 y estado de cierre en este documento y en `MILESTONE.md`.
  5. Formato de `src/migrations/index.ts` igual al generado por Payload.

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
   - `name` 🌐 (`requiredInDefaultLocale`, `unique: true`, sin espacios al inicio/final y único por idioma sin distinguir mayúsculas, máx. 80), `description` 🌐 (`textarea`, máx. 300), `isVisible` (`checkbox`, por defecto `true`), `orderable: true` (`defaultSort: '_order'`).
   - Access control: lectura pública solo `isVisible = true`; autenticados ven todo; escritura solo autenticados.
   - `beforeDelete`: impide borrar si existen platos asociados (`APIError` 400 con mensaje claro en el idioma del panel).
   - Hooks `afterChange` y `afterDelete`: `revalidateSiteAfterChange` / `revalidateSiteAfterDelete`.
4. **Colección `dishes`** (`src/collections/Dishes.ts`):
   - `name` 🌐 (`requiredInDefaultLocale`, máx. 120), `description` 🌐 (`textarea`, máx. 500), `price` (`number`, obligatorio, `0..9999.99`, máx. 2 decimales, almacenado como `numeric` en Postgres), `image` (`upload → media`, opcional), `category` (`relationship → menu-categories`, obligatorio), `availability` (`select`: `available` | `unavailable` | `hidden`, por defecto `available`), `isFeatured` (`checkbox`, por defecto `false`), `allergens` (`select` con `hasMany: true` sobre los 14 alérgenos UE, no localizado), `orderable: true` (`defaultSort: '_order'`).
   - Access control: lectura pública solo cuando `availability != 'hidden'` **y** `category.isVisible = true`; autenticados ven todo; escritura solo autenticados.
   - Hooks `afterChange` y `afterDelete`: `revalidateSiteAfterChange` / `revalidateSiteAfterDelete`.
   - Usabilidad del panel (RNF-07): columnas visibles por defecto (`name`, `category`, `price`, `availability`, `isFeatured`), cambio de disponibilidad desde el formulario y edición masiva en el listado (US-E3 CA3), descripciones de ayuda en español e inglés (también en el listado: filtrar por categoría antes de reordenar).
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
   - Desde `/admin`: crear una categoría, crear un plato con precio, categoría y alérgenos seleccionados en el `select` múltiple, cambiar su disponibilidad desde el formulario (`available` → `unavailable`) y desde el listado con edición masiva (`unavailable` → `hidden`), verificando que los cambios se persisten en Payload.

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
- [x] Revisión del propietario y correcciones menores (unicidad sin mayúsculas, E2E de edición masiva, ayuda del listado, documentación); verificación tras las correcciones: `typecheck`, `lint`, `test:unit` (178), `test:int` (92), `test:e2e` (8) en verde
- [x] PR #7 con CI en verde y fusionada → M4 cerrado

## Criterios de aceptación

| Criterio                                                                                                    | Verificado | Evidencia                                                     |
| ----------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| RF-MENU-01 / US-E1 CA1: categoría con nombre obligatorio (es) y único por idioma, sin distinguir mayúsculas | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-02: orden manual de categorías y platos (`orderable` + `defaultSort: '_order'`)                     | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-03 / US-E2 CA1–CA2: nombre, precio y categoría obligatorios; precio 0..9999,99 con máx. 2 decimales | ✅         | `price.test.ts`, `menu.int.spec.ts`                           |
| RF-MENU-04: disponibilidad de 3 estados, `available` por defecto                                            | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-05: platos destacados                                                                               | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-06 / US-E1 CA4: no se borra una categoría con platos; mensaje comprensible                          | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-07 / US-E1 CA3 / US-E3 CA2: lo oculto no es legible por anónimos (API)                              | ✅         | `menu.int.spec.ts`                                            |
| RF-MENU-08 / US-E5 CA1: 0..14 alérgenos de la lista cerrada; inválidos y duplicados rechazados              | ✅         | `allergens.test.ts`, `menu.int.spec.ts`                       |
| US-E3 CA3: disponibilidad editable desde el formulario y desde el listado                                   | ✅         | `menu.e2e.spec.ts`                                            |
| RF-PUB-01: guardar o borrar categorías y platos revalida la web                                             | ✅         | `revalidation.int.spec.ts`                                    |
| RF-I18N-02: textos es obligatorios, en opcional con _fallback_                                              | ✅         | `menu.int.spec.ts`                                            |
| RNF-07: panel con etiquetas y ayudas es/en, columnas útiles en el listado                                   | ✅         | Revisión manual del propietario                               |
| Esquema con migración versionada y sin cambios pendientes                                                   | ✅         | CI (`App`: migraciones sobre BD vacía y detección de cambios) |

## Pendientes trasladados

- **M5**:
  - `/{locale}/menu`: categorías visibles con platos no ocultos en el orden del panel (US-E1 CA2, US-E2 CA3); platos `unavailable` con aviso «No disponible» y estilo atenuado (US-E3 CA1).
  - Alérgenos como texto en el idioma de la página con `getAllergenLabel`, aviso fijo de alergias y sin lista si el plato no tiene alérgenos (US-E5 CA2–CA4).
  - Formato de precios con `Intl.NumberFormat` y EUR fijo (`es-ES` / `en-IE`) en `src/lib/price.ts` (ADR-0011).
  - Destacados en la portada: hasta 6 platos no ocultos, en el orden de la carta; sin sección si no hay (US-E4).

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
