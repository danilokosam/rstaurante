# ADR-0005: Modelo de contenido

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0
- **Ampliado por**: [ADR-0010](ADR-0010-i18n-spanish-english.md) (campos localizados es/en) y [ADR-0011](ADR-0011-allergens-and-currency.md) (alérgenos; moneda fija EUR, se elimina el campo `currency` del punto 4) — 2026-11-24, revisión de M0

## Contexto y problema

El contenido debe ser editable por personas no técnicas, sin editor visual, y renderizarse con un diseño fijo. Hay que decidir cómo estructurarlo en Payload. Detalle de campos en [data-model.md](../../architecture/data-model.md).

## Decisiones

1. **Globals para contenido único** (`site-settings`, `homepage`, `gallery`) y **collections para listas** (`users`, `media`, `menu-categories`, `dishes`).
   - Alternativa descartada: colección genérica de "páginas" con bloques (page builder) → es justo lo que el alcance excluye.
2. **Secciones fijas de la home** con campos concretos (hero, about, títulos de sección). Una sección sin contenido no se muestra. La activación/desactivación explícita de secciones se evalúa en M6.
3. **Textarea en lugar de rich text** (Lexical) en el MVP: los textos largos son pocos («Sobre nosotros», descripciones). Párrafos por líneas en blanco.
   - Pros: imposible romper el diseño, sin riesgo de HTML/XSS, renderizado trivial.
   - Contras: sin negritas/enlaces. Si un cliente lo necesita, se añade `richText` a campos concretos con un conjunto mínimo de funciones.
4. **Precio como `number`** (Postgres `numeric`) con validación de rango y máx. 2 decimales; moneda única en `site-settings`.
   - Alternativa: céntimos enteros → más robusto para aritmética, pero peor UX en el panel (el usuario escribiría 1250 para 12,50). No hay aritmética de precios en el MVP (no hay pedidos), por lo que se prioriza la UX. Si en el futuro hay pedidos/pagos, se migra a céntimos.
5. **Disponibilidad como `select` de tres estados** (`available`, `unavailable`, `hidden`) en lugar de dos booleanos: opciones mutuamente excluyentes y claras para el usuario.
6. **Orden manual** con la opción nativa `orderable: true` de Payload (arrastrar y soltar en el listado; verificada su existencia en `payload@3.94.2`), en lugar de un campo numérico "orden" que el usuario tenga que mantener.
7. **Galería como global** con un campo `upload` `hasMany` ordenable (verificado en tipos de `payload@3.94.2`), en vez de una colección aparte: una sola galería, orden explícito.
8. **Horarios como lista de franjas** (`day`, `opens`, `closes`) que permite turnos partidos y cierres después de medianoche; nota libre para excepciones. Se transforman a `OpeningHoursSpecification` de schema.org para SEO.
9. **Sin campos de branding hasta M6**. ~~Sin alérgenos (FP-01)~~ → incluidos por ADR-0011.
10. **Etiquetas del panel en español**, slugs/campos en inglés.

## Consecuencias

- El modelo es pequeño y fácil de entender; cualquier cambio requiere migración (ADR-0003) y actualización de `data-model.md`.
