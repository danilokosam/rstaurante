# ADR-0011: Alérgenos y moneda fija EUR

- **Estado**: Accepted
- **Fecha**: 2026-11-24
- **Milestone**: M0 (revisión), implementación en M4–M5
- **Modifica**: amplía [ADR-0005](ADR-0005-content-model.md); FP-01 pasa a alcance del MVP

## Contexto y problema

En la revisión de M0 el propietario decidió: (1) incluir **alérgenos** en la carta; (2) usar **euros** como moneda. En la UE, el Reglamento (UE) 1169/2011 (Anexo II) define **14 alérgenos** de declaración obligatoria; el restaurante es responsable de informar de ellos.

## Decisión — Alérgenos

- Campo `allergens` en `dishes`: `select` con `hasMany: true` y **lista cerrada de los 14 alérgenos** del Anexo II:

  | Valor         | Español             | English                   |
  | ------------- | ------------------- | ------------------------- |
  | `gluten`      | Cereales con gluten | Cereals containing gluten |
  | `crustaceans` | Crustáceos          | Crustaceans               |
  | `eggs`        | Huevos              | Eggs                      |
  | `fish`        | Pescado             | Fish                      |
  | `peanuts`     | Cacahuetes          | Peanuts                   |
  | `soybeans`    | Soja                | Soybeans                  |
  | `milk`        | Leche               | Milk                      |
  | `nuts`        | Frutos de cáscara   | Tree nuts                 |
  | `celery`      | Apio                | Celery                    |
  | `mustard`     | Mostaza             | Mustard                   |
  | `sesame`      | Sésamo              | Sesame                    |
  | `sulphites`   | Sulfitos            | Sulphites                 |
  | `lupin`       | Altramuces          | Lupin                     |
  | `molluscs`    | Moluscos            | Molluscs                  |

- Los valores no se localizan (son códigos); las etiquetas se traducen en el panel (etiquetas por idioma de Payload) y en la web (diccionarios, ADR-0010). Mantener una única fuente de la lista en código (`src/lib/allergens.ts`) usada por ambos.
- Web pública: cada plato muestra sus alérgenos **como texto** (accesible; los iconos son opcionales y siempre acompañados de texto, a decidir en M5/M6) y la carta incluye un aviso fijo y traducido: «Si tienes alguna alergia o intolerancia, consulta al personal».
- Un plato sin alérgenos marcados **no** se presenta como "sin alérgenos" (no se puede distinguir de "no informado"): simplemente no muestra la lista.

### Fuera del alcance (propuestas futuras)

- Trazas («puede contener»), etiquetas dietéticas (vegano, vegetariano…), filtro de carta por alérgenos (FP-12, FP-13).

### Responsabilidad

El sistema muestra la información que introduce el restaurante; la exactitud es responsabilidad del restaurante. Se documentará en la guía de uso (M7).

## Decisión — Moneda

- Moneda **fija EUR** en el código (`src/lib/price.ts`), **sin campo `currency`** en el CMS (se elimina del modelo inicial): una moneda por instancia y sin necesidad de cambiarla.
- Formato con `Intl.NumberFormat`: `es` → `es-ES` (`12,50 €`); `en` → `en-IE` (`€12.50`).
- Si en el futuro un cliente usa otra moneda, se convierte en variable de configuración de la instancia o campo del CMS (cambio acotado).

## Consecuencias

- Pequeño aumento de alcance en M4 (campo + validación) y M5 (presentación + aviso).
- Tests: unit (lista de 14 alérgenos con etiquetas completas en ambos idiomas; formato de precios por idioma), integración (valor fuera de la lista rechazado), E2E (alérgenos visibles en la carta en ambos idiomas).
