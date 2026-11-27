# Estructura de carpetas (planificada)

Basada en la plantilla oficial `with-postgres` de Payload 3 (route groups `(frontend)` y `(payload)`), con las carpetas mínimas añadidas para el MVP. Creada en M1 (estado real marcado con ✅; lo demás llega en milestones posteriores) y se amplía en cada milestone. **Ninguna carpeta se crea vacía "por si acaso".**

```
.
├── MILESTONE.md                  # Fuente de verdad del estado del proyecto
├── README.md
├── docs/                         # Documentación (ver docs/README.md)
├── .github/workflows/ci.yml      # ✅ CI (ADR-0012)
├── docker-compose.yml            # ✅ PostgreSQL 17 local (dev + test)
├── docker/postgres/init/         # ✅ Crea la BD rstaurante_test
├── pnpm-workspace.yaml           # ✅ Ajustes de pnpm 11 (allowBuilds)
├── postcss.config.mjs            # ✅ Tailwind 4
├── .env.example                  # Variables documentadas, sin secretos (M1)
├── next.config.ts                # ✅ withPayload(), redirección / → /es; cabeceras de seguridad (M7)
├── playwright.config.ts
├── vitest.config.mts
├── tsconfig.json                 # strict: true; alias @/* y @payload-config
├── eslint.config.mjs
├── src/
│   ├── payload.config.ts         # ✅ Configuración raíz de Payload
│   ├── payload-types.ts          # GENERADO (pnpm generate:types) — no editar
│   ├── app/
│   │   ├── (frontend)/           # Web pública
│   │   │   ├── [locale]/         # ✅ es | en (otro → 404 por dynamicParams = false)
│   │   │   │   ├── layout.tsx    # ✅ <html lang>, cabecera, selector de idioma, pie, WhatsApp; revalidate = 3600
│   │   │   │   ├── page.tsx      # ✅ Portada: hero, sobre nosotros, destacados, galería, horario, contacto
│   │   │   │   ├── menu/page.tsx # ✅ Carta: categorías, platos, precios, alérgenos y aviso
│   │   │   │   ├── not-found.tsx # ✅
│   │   │   │   └── error.tsx     # ✅
│   │   ├── sitemap.ts            # ✅ /sitemap.xml con alternativas por idioma
│   │   ├── robots.ts             # ✅ /robots.txt (excluye /admin y /api)
│   │   ├── icon.svg              # ✅ icono neutro (el del logo llega en M6)
│   │   ├── global-not-found.tsx  # ✅ 404 bilingüe para URLs sin ruta (experimental.globalNotFound)
│   │   ├── global-error.tsx      # ✅ error bilingüe si falla un layout raíz
│   │   └── (payload)/            # Generado por Payload: admin y API — no modificar salvo necesidad
│   │       ├── admin/[[...segments]]/
│   │       └── api/[...slug]/
│   ├── collections/              # Users, Media, MenuCategories, Dishes
│   ├── globals/                  # SiteSettings, Homepage, Gallery
│   ├── access/                   # Funciones de access control reutilizables (authenticated, publicRead…)
│   ├── fields/                   # Campos/validadores reutilizados en varias colecciones (si los hay)
│   ├── hooks/                    # Hooks de Payload (p. ej. revalidateSite)
│   ├── i18n/
│   │   ├── config.ts             # ✅ locales soportados, locale por defecto, isLocale
│   │   └── dictionaries/         # ✅ es.ts, en.ts (textos fijos de la web), getDictionary
│   ├── lib/
│   │   ├── env.ts                # ✅ Validación de variables de entorno
│   │   ├── content/              # ✅ Consultas de la web pública vía Local API (anónimas, con fallback)
│   │   └── *.ts                  # ✅ Lógica pura: price, allergens, hours, links, localePath, imageSrc, home, seo, jsonLd
│   ├── components/               # ✅ UI de la web pública (SiteHeader, SiteFooter, MainNav, LanguageSwitcher, WhatsAppButton, CmsImage, OpeningHours)
│   │   └── sections/             # ✅ Hero, About, Featured, Gallery, Hours, Contact (+ DishItem en components/)
│   ├── migrations/               # ✅ Migraciones generadas por Payload (no editar a mano)
│   └── styles/                   # ✅ globals.css (Tailwind, solo web pública)
├── scripts/
│   └── seed.ts                   # Contenido demo (M7) y primer usuario de desarrollo
└── tests/
    ├── unit/                     # Vitest: lógica pura de src/lib
    ├── int/                      # Vitest: Payload Local API + PostgreSQL real
    ├── e2e/                      # Playwright: flujos críticos
    └── helpers/                  # ✅ testDatabase (guarda *_test), resetDatabase
```

## Reglas

- Una colección o global por archivo (`src/collections/Dishes.ts`). Si crece, carpeta con `index.ts` + archivos de campos/hooks.
- Los tests se ubican en `tests/` (no junto al código) para separar claramente las suites y sus configuraciones de entorno.
- Alias de importación: `@/` → `src/`.
- `src/app/(payload)` y `payload-types.ts` son generados/gestionados por Payload.
- Las migraciones de base de datos de Payload viven en `src/migrations/` (generadas con `payload migrate:create`).
