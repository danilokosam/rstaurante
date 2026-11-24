# Estructura de carpetas (planificada)

Basada en la plantilla oficial `with-postgres` de Payload 3 (route groups `(frontend)` y `(payload)`), con las carpetas mínimas añadidas para el MVP. Se crea en M1 y se amplía en cada milestone. **Ninguna carpeta se crea vacía "por si acaso".**

```
.
├── MILESTONE.md                  # Fuente de verdad del estado del proyecto
├── README.md
├── docs/                         # Documentación (ver docs/README.md)
├── docker-compose.yml            # PostgreSQL local para dev y test (M1)
├── .env.example                  # Variables documentadas, sin secretos (M1)
├── next.config.ts                # withPayload(), cabeceras de seguridad, images
├── playwright.config.ts
├── vitest.config.mts
├── tsconfig.json                 # strict: true; alias @/* y @payload-config
├── eslint.config.mjs
├── src/
│   ├── payload.config.ts         # Configuración raíz de Payload
│   ├── payload-types.ts          # GENERADO (pnpm generate:types) — no editar
│   ├── app/
│   │   ├── (frontend)/           # Web pública
│   │   │   ├── page.tsx          # Redirección / → /es
│   │   │   ├── [locale]/         # es | en (otro → 404)
│   │   │   │   ├── layout.tsx    # <html lang>, cabecera con selector de idioma
│   │   │   │   ├── page.tsx      # Home
│   │   │   │   ├── menu/page.tsx # Carta
│   │   │   │   ├── not-found.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── sitemap.ts        # Con alternativas por idioma
│   │   │   └── robots.ts
│   │   └── (payload)/            # Generado por Payload: admin y API — no modificar salvo necesidad
│   │       ├── admin/[[...segments]]/
│   │       └── api/[...slug]/
│   ├── collections/              # Users, Media, MenuCategories, Dishes
│   ├── globals/                  # SiteSettings, Homepage, Gallery
│   ├── access/                   # Funciones de access control reutilizables (authenticated, publicRead…)
│   ├── fields/                   # Campos/validadores reutilizados en varias colecciones (si los hay)
│   ├── hooks/                    # Hooks de Payload (p. ej. revalidateSite)
│   ├── i18n/
│   │   ├── config.ts             # locales soportados, locale por defecto
│   │   └── dictionaries/         # es.ts, en.ts (textos fijos de la web)
│   ├── lib/
│   │   ├── env.ts                # Validación de variables de entorno
│   │   ├── content/              # Consultas de la web pública vía Local API
│   │   └── *.ts                  # Lógica pura: precios (EUR), alérgenos, horarios, enlaces, JSON-LD
│   ├── components/               # Componentes de UI de la web pública
│   │   └── sections/             # Hero, About, Featured, Gallery, Hours, Contact
│   └── styles/                   # globals.css (Tailwind)
├── scripts/
│   └── seed.ts                   # Contenido demo (M7) y primer usuario de desarrollo
└── tests/
    ├── unit/                     # Vitest: lógica pura de src/lib
    ├── int/                      # Vitest: Payload Local API + PostgreSQL real
    ├── e2e/                      # Playwright: flujos críticos
    └── helpers/                  # Utilidades de test (crear usuario, limpiar BD…)
```

## Reglas

- Una colección o global por archivo (`src/collections/Dishes.ts`). Si crece, carpeta con `index.ts` + archivos de campos/hooks.
- Los tests se ubican en `tests/` (no junto al código) para separar claramente las suites y sus configuraciones de entorno.
- Alias de importación: `@/` → `src/`.
- `src/app/(payload)` y `payload-types.ts` son generados/gestionados por Payload.
- Las migraciones de base de datos de Payload viven en `src/migrations/` (generadas con `payload migrate:create`).
