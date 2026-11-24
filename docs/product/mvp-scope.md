# Alcance del MVP

Este documento define qué entra y qué no entra en el MVP. Cualquier ampliación requiere actualizar este documento, `MILESTONE.md` y, si aplica, un ADR.

> **Cambios tras la revisión de M0 (2026-11-24)**: se incluyen **español e inglés** ([ADR-0010](../decisions/ADR/ADR-0010-i18n-spanish-english.md)) y **alérgenos** ([ADR-0011](../decisions/ADR/ADR-0011-allergens-and-currency.md)); la moneda es **EUR** fija.

## 1. Dentro del alcance

### 1.1 Web pública

| ID | Funcionalidad | Notas de alcance | Milestone |
|---|---|---|---|
| WEB-01 | Página de inicio (`/es`, `/en`; `/` redirige a `/es`) | Compuesta por secciones fijas en orden predefinido. Una sección sin contenido no se muestra. | M5 |
| WEB-02 | Hero configurable | Título, subtítulo, imagen y un CTA (acción controlada: ver carta / WhatsApp / llamar / enlace externo). | M3 (datos), M5 (UI) |
| WEB-03 | Sección «Sobre nosotros» | Título, texto (párrafos) e imagen opcional. | M3, M5 |
| WEB-04 | Carta (`/es/menu`, `/en/menu`) | Categorías visibles en el orden definido, con sus platos en orden. | M4, M5 |
| WEB-05 | Platos | Nombre, descripción, precio (EUR), imagen opcional, disponibilidad (`disponible` / `no disponible` mostrado con aviso / `oculto`) y alérgenos. | M4, M5 |
| WEB-06 | Platos destacados | Bloque en la home con los platos marcados como destacados (no ocultos), máx. 6. | M4, M5 |
| WEB-07 | Galería | Imágenes en el orden definido en el CMS. | M3, M5 |
| WEB-08 | Horarios | Franjas por día de la semana (permite turnos partidos) + nota libre (p. ej. festivos). | M3, M5 |
| WEB-09 | Ubicación y dirección | Dirección postal estructurada. | M3, M5 |
| WEB-10 | Google Maps | **Enlace** «Cómo llegar» (URL configurada o generada desde la dirección con la API de URLs de Google Maps, sin clave). El mapa embebido queda como propuesta futura. | M3, M5 |
| WEB-11 | Contacto | Teléfono y email (enlaces `tel:` y `mailto:`). | M3, M5 |
| WEB-12 | WhatsApp | Botón/enlace `https://wa.me/<número>` con mensaje predefinido opcional; solo si se configura. | M3, M5 |
| WEB-13 | Redes sociales | Lista de enlaces con plataforma de una lista controlada. | M3, M5 |
| WEB-14 | Responsive | Mobile-first; verificado en móvil, tablet y escritorio. | M5, M7 |
| WEB-15 | SEO básico | `title`, `description`, Open Graph, URL canónica, `sitemap.xml`, `robots.txt`, datos estructurados `Restaurant` (schema.org JSON-LD). | M5, M7 |
| WEB-16 | Rendimiento y accesibilidad | Objetivos en [requirements.md](requirements.md#requisitos-no-funcionales). | M5, M7 |
| WEB-17 | Páginas de error | 404 y error genérico con diseño del sitio. | M5 |
| WEB-18 | Español e inglés | Todo el sitio en ambos idiomas con selector de idioma; contenido sin traducir cae al español; `hreflang`. | M5 |
| WEB-19 | Alérgenos | Alérgenos de cada plato (14 alérgenos UE) como texto + aviso de alergias en la carta. | M4, M5 |

### 1.2 Panel CMS (`/admin`)

| ID | Funcionalidad | Notas de alcance | Milestone |
|---|---|---|---|
| CMS-01 | Iniciar / cerrar sesión | Autenticación de Payload; bloqueo temporal tras intentos fallidos. | M2 |
| CMS-02 | Gestión de usuarios del panel | Un único rol (administrador) en el MVP. Alta de usuarios solo por usuarios autenticados. | M2 |
| CMS-03 | Información general del restaurante | Nombre, eslogan, descripción, logo, contacto. | M3 |
| CMS-04 | Contenido de la home | Hero, «Sobre nosotros», títulos de secciones. | M3 |
| CMS-05 | Imágenes | Subir, reemplazar y eliminar imágenes (JPEG, PNG, WebP, AVIF; máx. 4 MB; texto alternativo obligatorio). | M3 |
| CMS-06 | Galería | Seleccionar y ordenar imágenes. | M3 |
| CMS-07 | Horarios | Franjas por día + nota. | M3 |
| CMS-08 | Ubicación | Dirección y enlace de mapas. | M3 |
| CMS-09 | Redes sociales | Añadir/quitar/ordenar enlaces. | M3 |
| CMS-10 | Categorías de la carta | CRUD, orden, visibilidad. | M4 |
| CMS-11 | Platos | CRUD: nombre, descripción, precio, imagen, categoría, disponibilidad, destacado, orden, alérgenos (lista cerrada). | M4 |
| CMS-12 | Guardar y publicar | **Guardar = publicar**: al guardar, el cambio se persiste y la web pública se revalida automáticamente. Historial de versiones con restauración para la información general y la home. Ver [ADR-0007](../decisions/ADR/ADR-0007-publishing-and-caching.md). | M3 |
| CMS-13 | Branding controlado | Paleta/tema de una lista predefinida, logo. Sin constructor libre. | M6 |
| CMS-14 | Interfaz del panel en español (e inglés) | Panel en español por defecto (inglés seleccionable), etiquetas y ayudas comprensibles para usuarios no técnicos. | M2–M4 |
| CMS-15 | Contenido en dos idiomas | Los textos editables se introducen en español (obligatorio) e inglés (opcional) con el selector de idioma del formulario. | M3, M4 |

### 1.3 Operación

| ID | Funcionalidad | Milestone |
|---|---|---|
| OPS-01 | Despliegue reproducible con configuración segura de producción | M7 |
| OPS-02 | Contenido demo de un restaurante ficticio (seed) | M7 |
| OPS-03 | Documentación de despliegue y operación | M7 |

## 2. Fuera del alcance

No se implementan en el MVP (ni se diseña específicamente para ellos):

- Multi-tenancy, gestión de varios restaurantes, tenants, subdominios dinámicos o dominios por cliente.
- Sistema de reservas propio.
- Pedidos online, pagos, integración con TPV/POS.
- Chatbot o funcionalidades de IA.
- Programa de fidelización.
- App móvil.
- Analytics avanzados.
- Editor visual drag-and-drop, constructor de páginas, sistema de plantillas complejo.
- Borradores con previsualización (drafts / live preview).
- Idiomas distintos de español e inglés; rutas traducidas por idioma.
- Etiquetas dietéticas, trazas de alérgenos y filtro de carta por alérgenos (ver propuestas futuras).
- Roles adicionales (p. ej. editor con permisos reducidos).
- Mapa embebido (iframe) de Google Maps.
- Cualquier funcionalidad no listada explícitamente en la sección 1.

Las ideas detectadas se registran en [future-proposals.md](future-proposals.md).

## 3. Supuestos

- Un restaurante = una instancia = dos idiomas de contenido público (español por defecto, inglés) = una moneda (EUR).
- El restaurante tiene una única ubicación.
- El volumen de contenido es pequeño (decenas de categorías y cientos de platos como máximo; decenas de imágenes).
- Los usuarios del panel son pocos (1–3 personas de confianza del restaurante).
