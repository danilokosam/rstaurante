# Requisitos

Los IDs se referencian desde user stories, tests y documentos de milestone. Las reglas de validación concretas de cada campo están en [data-model.md](../architecture/data-model.md).

## Requisitos funcionales

### Autenticación y acceso (M2)

| ID | Requisito |
|---|---|
| RF-AUTH-01 | Solo usuarios autenticados pueden acceder a `/admin` y a las operaciones de escritura (crear, actualizar, borrar) de cualquier colección o global. |
| RF-AUTH-02 | El inicio de sesión usa email + contraseña gestionados por Payload. La sesión se mantiene en una cookie HTTP-only. |
| RF-AUTH-03 | Tras 5 intentos fallidos consecutivos la cuenta se bloquea 10 minutos. |
| RF-AUTH-04 | El usuario puede cerrar sesión; la sesión deja de ser válida en el servidor. |
| RF-AUTH-05 | Los datos de usuarios (emails, hashes) nunca son legibles sin autenticación. |
| RF-AUTH-06 | El primer usuario se crea mediante el flujo de primer usuario de Payload o un script de seed; no existe registro público. |
| RF-AUTH-07 | Contraseña mínima de 12 caracteres. |

### Información del restaurante (M3)

| ID | Requisito |
|---|---|
| RF-SITE-01 | El administrador edita nombre, eslogan, descripción corta y logo del restaurante. La moneda es EUR fija (no configurable). |
| RF-SITE-02 | El administrador edita teléfono, email, número de WhatsApp (formato internacional) y mensaje predefinido de WhatsApp. |
| RF-SITE-03 | El administrador edita la dirección (calle, código postal, ciudad, provincia/región, país) y, opcionalmente, una URL de Google Maps. Si no hay URL, el enlace se genera a partir de la dirección. |
| RF-SITE-04 | El administrador gestiona una lista ordenada de redes sociales (plataforma de lista cerrada + URL `https`). |
| RF-SITE-05 | El administrador gestiona horarios: franjas (día, apertura, cierre) — varias por día — y una nota libre. Un día sin franjas se muestra como «Cerrado». |
| RF-SITE-06 | El administrador edita los valores SEO por defecto (título, descripción, imagen para compartir). |
| RF-SITE-07 | Se conserva historial de versiones de la información general y la home, con posibilidad de restaurar una versión anterior. |

### Contenido de la home (M3)

| ID | Requisito |
|---|---|
| RF-HOME-01 | Hero: título (obligatorio), subtítulo, imagen, CTA (etiqueta + acción de lista cerrada: `menu`, `whatsapp`, `phone`, `external`; URL solo si `external`). |
| RF-HOME-02 | «Sobre nosotros»: título, texto en párrafos, imagen opcional. |
| RF-HOME-03 | Títulos editables de las secciones (destacados, galería, horarios, contacto). |
| RF-HOME-04 | SEO de la home: título y descripción (si vacíos, se usan los valores por defecto). |

### Imágenes y galería (M3)

| ID | Requisito |
|---|---|
| RF-MEDIA-01 | Subir imágenes JPEG, PNG, WebP o AVIF de hasta 4 MB. El tipo se valida por contenido (magic bytes), no solo por extensión. SVG y cualquier otro tipo se rechazan. |
| RF-MEDIA-02 | Texto alternativo (`alt`) obligatorio en cada imagen. |
| RF-MEDIA-03 | Se generan tamaños redimensionados para web (miniatura, tarjeta, hero). |
| RF-MEDIA-04 | Reemplazar el archivo de una imagen existente y eliminar imágenes. |
| RF-MEDIA-05 | Galería: lista ordenable de imágenes seleccionadas de la biblioteca. |

### Carta (M4)

| ID | Requisito |
|---|---|
| RF-MENU-01 | CRUD de categorías: nombre (obligatorio, único), descripción opcional, visible sí/no. |
| RF-MENU-02 | Orden manual de categorías y de platos (arrastrar en el listado del panel). |
| RF-MENU-03 | CRUD de platos: nombre (obligatorio), descripción, precio (obligatorio, ≥ 0, ≤ 9 999,99, máx. 2 decimales), imagen opcional, categoría (obligatoria). |
| RF-MENU-04 | Disponibilidad del plato: `available` (se muestra), `unavailable` (se muestra con aviso «No disponible»), `hidden` (no se muestra). Valor por defecto: `available`. |
| RF-MENU-05 | Marcar platos como destacados. |
| RF-MENU-06 | No se puede borrar una categoría que contenga platos (el panel muestra un error comprensible). |
| RF-MENU-07 | Los platos `hidden` y las categorías no visibles **no son legibles** por visitantes anónimos (ni en la web ni vía API). |
| RF-MENU-08 | Cada plato puede tener 0..14 alérgenos de la lista cerrada del Reglamento (UE) 1169/2011, Anexo II. Valores fuera de la lista se rechazan. |

### Publicación (M3–M5)

| ID | Requisito |
|---|---|
| RF-PUB-01 | Guardar un cambio en el CMS lo publica: la web pública refleja el cambio en la siguiente petición (objetivo < 10 s). |
| RF-PUB-02 | Si la revalidación falla, el cambio queda guardado y la web se actualiza como máximo en 1 hora (revalidación temporal de respaldo). |

### Web pública (M5)

| ID | Requisito |
|---|---|
| RF-WEB-01 | Home con secciones en orden fijo: hero, sobre nosotros, destacados, galería, horarios, ubicación/contacto. Secciones sin contenido no se renderizan. |
| RF-WEB-02 | `/{locale}/menu` lista categorías visibles con platos no ocultos, en el orden definido; precios en EUR con formato del idioma (`12,50 €` / `€12.50`); alérgenos de cada plato como texto y aviso de alergias. |
| RF-WEB-03 | Cabecera con logo/nombre y navegación; pie con contacto, redes y horario. |
| RF-WEB-04 | Botón de WhatsApp visible solo si hay número configurado. |
| RF-WEB-05 | Metadatos SEO, Open Graph, canónica, `hreflang` (es, en, x-default), `sitemap.xml` con alternativas por idioma, `robots.txt` y JSON-LD `Restaurant` (con dirección, teléfono, horarios). |
| RF-WEB-06 | Páginas 404 y de error con el diseño del sitio. |
| RF-WEB-07 | La web pública no expone ninguna ruta o dato del panel más allá del enlace a `/admin` (que no se enlaza desde la web). |

### Idiomas (M2–M5)

| ID | Requisito |
|---|---|
| RF-I18N-01 | La web pública está disponible en español (`/es`, por defecto) e inglés (`/en`); `/` redirige a `/es`; un locale no soportado devuelve 404. |
| RF-I18N-02 | Los campos de texto editables son localizados: español obligatorio, inglés opcional; si falta el inglés se muestra el español. |
| RF-I18N-03 | Los textos fijos de la web (etiquetas, avisos, días de la semana, alérgenos) están traducidos en ambos idiomas. |
| RF-I18N-04 | Selector de idioma en la cabecera que mantiene la página actual. |
| RF-I18N-05 | El panel está en español por defecto y permite cambiar a inglés. |

### Branding (M6)

| ID | Requisito |
|---|---|
| RF-BRAND-01 | Selección de un tema/paleta entre opciones predefinidas (sin selector libre de colores en el MVP salvo color de acento validado por contraste — a decidir en M6). |
| RF-BRAND-02 | El logo se usa en cabecera, favicon/OG si aplica. |

## Requisitos no funcionales

| ID | Categoría | Requisito | Verificación |
|---|---|---|---|
| RNF-01 | Rendimiento | Lighthouse (móvil) ≥ 90 en Performance, Accessibility, Best Practices y SEO en `/es` y `/es/menu` con contenido demo. LCP < 2,5 s. | M5/M7, Lighthouse |
| RNF-02 | Accesibilidad | WCAG 2.2 nivel AA razonable: HTML semántico, contraste, foco visible, `alt` en imágenes, navegación por teclado. Sin violaciones *serious/critical* de axe. | M5/M7, axe en Playwright |
| RNF-03 | Responsive | Correcto desde 360 px de ancho hasta escritorio. | M5/M7, Playwright con viewports |
| RNF-04 | Seguridad | Ver [security.md](../architecture/security.md). Secretos solo en variables de entorno; mínimo privilegio; validación en los límites. | Todos los milestones |
| RNF-05 | Mantenibilidad | TypeScript `strict`; lint y formato automáticos; sin `any` no justificado; tipos generados por Payload. | CI local: `typecheck`, `lint` |
| RNF-06 | Testabilidad | TDD; tests unitarios, de integración (Payload + Postgres real) y E2E de flujos críticos. | Ver [testing-strategy.md](../development/testing-strategy.md) |
| RNF-07 | Usabilidad CMS | Panel en español (inglés opcional); descripciones de ayuda en los campos; opciones cerradas en lugar de texto libre cuando sea posible. | Revisión manual M3/M4 |
| RNF-08 | Coste | Operable en planes gratuitos o de entrada de los proveedores para un restaurante. | M7 |
| RNF-09 | Disponibilidad | Depende de los proveedores gestionados; sin requisitos de alta disponibilidad propios en el MVP. | — |
| RNF-10 | Privacidad | Sin cookies de seguimiento en la web pública en el MVP; sin datos personales de visitantes almacenados. | M5/M7 |
| RNF-11 | Portabilidad | Sin dependencia de APIs propietarias de Supabase más allá de Postgres estándar y almacenamiento S3-compatible. | Revisión de arquitectura |
