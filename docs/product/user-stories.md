# User stories y criterios de aceptación

Formato: *Como <rol>, quiero <acción>, para <beneficio>.* Los criterios de aceptación (CA) usan Given/When/Then cuando aporta claridad y se convierten en tests en el milestone indicado.

Roles:
- **Administrador**: usuario autenticado del CMS (propietario/encargado del restaurante). Único rol en el MVP.
- **Visitante**: cualquier persona que visita la web pública (anónimo).

---

## Épica A — Acceso al panel (M2)

### US-A1 Iniciar sesión
Como administrador, quiero iniciar sesión con email y contraseña, para gestionar el contenido de la web.
- CA1: Con credenciales válidas accedo al panel `/admin`.
- CA2: Con credenciales inválidas veo un error genérico (no revela si el email existe).
- CA3: Tras 5 intentos fallidos la cuenta queda bloqueada 10 minutos.
- CA4: Un visitante no autenticado que abre `/admin` es redirigido al login.

### US-A2 Cerrar sesión
Como administrador, quiero cerrar sesión, para que nadie use mi sesión en un dispositivo compartido.
- CA1: Tras cerrar sesión, volver a `/admin` exige login.
- CA2: Las peticiones a la API con la cookie anterior son rechazadas.

### US-A3 Protección de operaciones
Como propietario, quiero que solo usuarios autenticados puedan modificar contenido, para que la web no pueda ser alterada por terceros.
- CA1: Crear/actualizar/borrar cualquier documento vía API sin autenticación devuelve 403 (o 401).
- CA2: La colección de usuarios no es legible sin autenticación.
- CA3: No existe endpoint de registro público.

### US-A4 Gestionar usuarios del panel
Como administrador, quiero dar de alta a otra persona de confianza, para compartir la gestión.
- CA1: Un administrador puede crear, editar y borrar usuarios.
- CA2: Un administrador no puede borrarse a sí mismo si es el último usuario (evita quedarse sin acceso).
- CA3: Contraseñas de menos de 12 caracteres se rechazan.

---

## Épica B — Información del restaurante (M3)

### US-B1 Datos generales
Como administrador, quiero editar nombre, eslogan, descripción y logo, para que la web refleje la identidad del restaurante.
- CA1: El nombre es obligatorio; el resto opcional.
- CA2: Al guardar, la cabecera y los metadatos de la web muestran el nuevo nombre.

### US-B2 Contacto y WhatsApp
Como administrador, quiero configurar teléfono, email y WhatsApp, para que los clientes me contacten fácilmente.
- CA1: El número de WhatsApp debe estar en formato internacional (p. ej. `+34600111222`); otro formato muestra un error claro.
- CA2: Si el WhatsApp está vacío, la web no muestra el botón de WhatsApp.
- CA3: Un email inválido se rechaza.

### US-B3 Ubicación
Como administrador, quiero indicar la dirección y el enlace a Google Maps, para que los clientes sepan llegar.
- CA1: Si configuro una URL de Maps, la web enlaza a ella; debe ser `https` y de un dominio de Google Maps permitido.
- CA2: Si no la configuro, la web genera un enlace de búsqueda de Google Maps con la dirección.

### US-B4 Horarios
Como administrador, quiero definir las franjas de apertura de cada día, para que los clientes sepan cuándo abrimos.
- CA1: Puedo añadir varias franjas para el mismo día (comida y cena).
- CA2: Las horas tienen formato `HH:MM`; la apertura y el cierre no pueden ser iguales.
- CA3: Un cierre anterior a la apertura se interpreta como cierre después de medianoche (p. ej. 20:00–01:00).
- CA4: Los días sin franjas aparecen como «Cerrado» en la web.
- CA5: Puedo añadir una nota libre (p. ej. «Cerrado los festivos»).

### US-B5 Redes sociales
Como administrador, quiero añadir mis redes sociales, para que los clientes me sigan.
- CA1: Elijo la plataforma de una lista cerrada e introduzco una URL `https`.
- CA2: Puedo reordenar y eliminar enlaces.

### US-B6 Restaurar una versión anterior
Como administrador, quiero recuperar la versión anterior de la información general o de la home, para deshacer un error.
- CA1: Puedo ver el historial de versiones y restaurar una; la web se actualiza.

---

## Épica C — Contenido de la home (M3)

### US-C1 Hero
Como administrador, quiero editar el título, subtítulo, imagen y botón principal de la portada, para destacar lo que quiera en cada momento.
- CA1: El título es obligatorio.
- CA2: El CTA tiene una acción de lista cerrada; solo «enlace externo» pide URL (`https`).
- CA3: Si el CTA es «WhatsApp» y no hay WhatsApp configurado, el panel muestra un aviso de validación.

### US-C2 Sobre nosotros
Como administrador, quiero escribir la historia del restaurante, para conectar con los clientes.
- CA1: El texto admite párrafos (líneas en blanco); no admite HTML (se muestra como texto).

### US-C3 Traducir contenido
Como administrador, quiero escribir mis textos en español y, si quiero, en inglés, para atender a clientes extranjeros.
- CA1: En cada formulario puedo cambiar de idioma y editar los textos traducibles.
- CA2: Solo el español es obligatorio.
- CA3: Los campos no traducibles (precio, imagen, teléfono…) son comunes a ambos idiomas.

---

## Épica D — Imágenes y galería (M3)

### US-D1 Subir imágenes
Como administrador, quiero subir fotos desde el ordenador o el móvil, para mostrar mis platos y mi local.
- CA1: Se aceptan JPEG, PNG, WebP y AVIF de hasta 4 MB.
- CA2: Un archivo que no es una imagen permitida (aunque tenga extensión `.jpg`) se rechaza con un mensaje claro.
- CA3: Un SVG se rechaza.
- CA4: El texto alternativo es obligatorio.

### US-D2 Reemplazar y eliminar imágenes
- CA1: Puedo reemplazar el archivo de una imagen; los lugares que la usan muestran la nueva.
- CA2: Puedo eliminar una imagen; si estaba en uso, el campo correspondiente queda vacío y la web no falla.

### US-D3 Galería
Como administrador, quiero elegir y ordenar las fotos de la galería, para controlar qué se ve.
- CA1: La web muestra las imágenes en el orden del panel.
- CA2: Si la galería está vacía, la sección no aparece.

---

## Épica E — Carta (M4)

### US-E1 Categorías
Como administrador, quiero crear, renombrar, ordenar, ocultar y borrar categorías.
- CA1: El nombre es obligatorio y único.
- CA2: El orden del panel es el orden de la web.
- CA3: Una categoría oculta y sus platos no aparecen en la web ni en la API pública.
- CA4: No puedo borrar una categoría con platos; veo un mensaje que me indica moverlos o borrarlos antes.

### US-E2 Platos
Como administrador, quiero crear, editar y borrar platos con nombre, descripción, precio, imagen y categoría.
- CA1: Nombre, precio y categoría son obligatorios.
- CA2: El precio debe estar entre 0 y 9 999,99 con como máximo 2 decimales.
- CA3: Los platos se muestran en la web dentro de su categoría y en el orden del panel.

### US-E3 Disponibilidad
Como administrador, quiero marcar rápidamente un plato como no disponible u oculto, para no decepcionar a los clientes.
- CA1: `No disponible`: el plato se ve en la carta con un aviso y estilo atenuado.
- CA2: `Oculto`: el plato no aparece en la web ni en la API pública.
- CA3: La disponibilidad puede cambiarse desde el listado o el formulario del plato.

### US-E5 Alérgenos
Como administrador, quiero indicar los alérgenos de cada plato, para cumplir con la normativa e informar a mis clientes.
- CA1: Selecciono alérgenos de una lista cerrada de 14 (Reglamento UE 1169/2011) con nombres comprensibles.
- CA2: La carta muestra los alérgenos de cada plato como texto, en el idioma de la página.
- CA3: La carta muestra un aviso: «Si tienes alguna alergia o intolerancia, consulta al personal».
- CA4: Un plato sin alérgenos marcados no muestra la lista (no se afirma "sin alérgenos").

### US-E4 Destacados
Como administrador, quiero marcar platos como destacados, para promocionarlos en la portada.
- CA1: La home muestra hasta 6 platos destacados no ocultos, en el orden de la carta.
- CA2: Si no hay destacados, la sección no aparece.

---

## Épica F — Web pública (M5)

### US-F1 Consultar la carta desde el móvil
Como visitante, quiero ver la carta en mi móvil, para decidir qué pedir o si ir al restaurante.
- CA1: `/{locale}/menu` es legible a 360 px sin scroll horizontal.
- CA2: Los precios se muestran en euros con el formato del idioma (`12,50 €` / `€12.50`).

### US-F2 Contactar y llegar
Como visitante, quiero llamar, escribir por WhatsApp o abrir el mapa con un toque.
- CA1: El teléfono es un enlace `tel:`; WhatsApp abre `wa.me`; «Cómo llegar» abre Google Maps.

### US-F3 Encontrar el restaurante en buscadores
Como propietario, quiero que la web aparezca bien en Google y al compartirse en redes.
- CA1: Cada página tiene `title`, `description`, Open Graph y canónica.
- CA2: Existen `sitemap.xml` y `robots.txt`; `/admin` y `/api` están excluidos.
- CA3: La home incluye JSON-LD `Restaurant` válido.

### US-F4 Ver cambios publicados
Como administrador, quiero ver mis cambios en la web nada más guardarlos.
- CA1: Tras guardar un plato, la carta muestra el cambio en la siguiente carga (< 10 s).

### US-F5 Ver la web en mi idioma
Como visitante extranjero, quiero ver la web en inglés, para entender la carta.
- CA1: Puedo cambiar entre español e inglés desde la cabecera y sigo en la misma página.
- CA2: Los textos fijos (horario, avisos, alérgenos) aparecen en inglés.
- CA3: Si un plato no tiene traducción, veo el texto en español en lugar de un hueco.
- CA4: Cada página declara sus alternativas de idioma (`hreflang`).

---

## Épica G — Branding (M6)

### US-G1 Elegir el estilo
Como administrador, quiero elegir entre varios estilos predefinidos, para adaptar la web a mi marca sin romper el diseño.
- CA1: Elijo un tema de una lista; la web aplica sus colores y tipografías.
- CA2: Las combinaciones disponibles cumplen contraste AA.

(Detalle a refinar al iniciar M6.)

---

## Épica H — Demo y despliegue (M7)

### US-H1 Demo comercial
Como proveedor, quiero una instancia demo con un restaurante ficticio, para enseñarla a clientes potenciales.
- CA1: Un script de seed crea contenido demo completo y reproducible.
- CA2: La demo está desplegada con configuración de producción segura.
