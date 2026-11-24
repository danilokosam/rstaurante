# Estrategia de testing (TDD)

Decisión de herramientas en [ADR-0008](../decisions/ADR/ADR-0008-testing-strategy.md).

## Ciclo TDD obligatorio

Para cada comportamiento:

1. Leer requisito y criterios de aceptación (IDs de [requirements.md](../product/requirements.md) / [user-stories.md](../product/user-stories.md)).
2. Escribir los casos de prueba (nombres que describen el comportamiento).
3. Escribir los tests **antes** del código.
4. Ejecutarlos y comprobar que **fallan por la razón esperada** (registrar en el documento del milestone).
5. Implementar el mínimo para que pasen.
6. Ejecutar de nuevo.
7. Refactorizar en verde.
8. Ejecutar `typecheck`, `lint`, `build` y la suite completa (regresión).
9. Documentar en el documento del milestone.

Excepciones razonables al "test primero" (configuración generada por herramientas, p. ej. scaffolding de M1) se documentan explícitamente con su verificación alternativa.

## Pirámide

| Nivel | Ubicación | Comando (previsto) | Velocidad | Ejemplos |
|---|---|---|---|---|
| Unit | `tests/unit` | `pnpm test:unit` | ms | `formatPrice(12.5, 'es')` → `12,50 €` y `formatPrice(12.5, 'en')` → `€12.50`; diccionarios `es`/`en` con las mismas claves; 14 alérgenos con etiquetas en ambos idiomas; `buildWhatsAppUrl`; `groupOpeningHours`; validador de horas; `env.ts` rechaza `PAYLOAD_SECRET` corto; serializador JSON-LD escapa `</script>` |
| Integración | `tests/int` | `pnpm test:int` | s | Anónimo no puede crear plato; anónimo no ve plato `hidden`; precio con 3 decimales rechazado; SVG rechazado; no se borra categoría con platos; no se borra el último usuario; guardar dispara revalidación |
| E2E | `tests/e2e` | `pnpm test:e2e` | decenas de s | Login/logout; editar precio y verlo en `/es/menu`; selector de idioma y fallback; home en 360 px sin scroll horizontal; axe sin violaciones serias |

`pnpm test` ejecuta todo. `pnpm verify` (previsto) = `typecheck` + `lint` + `test:unit` + `test:int` + `build`.

## Qué testear (y qué no)

- ✅ Comportamientos, requisitos, límites (0, 9999.99, 9999.999), validaciones, errores, permisos por rol/anónimo, casos vacíos (sin galería, sin WhatsApp).
- ❌ Tests que repiten la implementación (p. ej. comprobar que un campo tiene `type: 'text'`), tests de la librería (Payload ya prueba su UI), snapshots grandes de HTML.

## Datos de test

- Fábricas/helpers en `tests/helpers` para crear usuarios, categorías y platos mínimos.
- BD de test aislada (`DATABASE_URL` de test); limpieza entre suites.
- Almacenamiento de archivos en directorio temporal.

## Matriz de cobertura por milestone

| Milestone | Unit | Integración | E2E |
|---|---|---|---|
| M1 | `env.ts` | Conexión Payload ↔ Postgres (init + consulta) | Smoke: `/` y `/admin` responden |
| M2 | Validador de contraseña | Access control, bloqueo de login, último usuario | Login/logout, redirección de `/admin` |
| M3 | Validadores de URL/teléfono/WhatsApp/horas | Globals, media (tipos, tamaño), revalidación, versiones, español obligatorio / inglés opcional | Editar hero en ambos idiomas |
| M4 | Validador de precio, ordenación, lista de alérgenos | CRUD platos/categorías, visibilidad, borrado protegido, alérgeno inválido rechazado, campos localizados | Crear plato y cambiar disponibilidad |
| M5 | Formateo por idioma, agrupación de carta, horarios, JSON-LD, metadata/hreflang, diccionarios | Consultas `src/lib/content` con locale y fallback | Navegación es/en, `/`→`/es`, locale inválido → 404, alérgenos visibles, responsive, axe, cambio publicado visible |
| M6 | Resolución de tema | Campo de tema | Tema aplicado |
| M7 | — | Seed idempotente | Flujos críticos contra build de producción |

## Cuando un test no se puede ejecutar

Se documenta el motivo en el documento del milestone y en `MILESTONE.md` (bloqueos). **Nunca** se marca como verificado.
