# Visión del producto

## Problema

Muchos restaurantes independientes tienen una web desactualizada (carta con precios antiguos, horarios incorrectos, fotos viejas) porque cada cambio depende de un desarrollador o de una agencia. Esto genera coste, retrasos y una mala imagen ante clientes que consultan la web antes de visitar el local.

## Propuesta de valor

Un sitio web moderno para un restaurante, más un panel de administración sencillo (CMS) con el que el propio restaurante puede mantener al día su contenido —carta, precios, disponibilidad, fotos, horarios, contacto y redes— **sin conocimientos técnicos y sin depender de un desarrollador** para los cambios cotidianos.

## Público objetivo

| Perfil                                                        | Descripción                                                                         | Necesidad principal                                                                         |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Propietario / encargado del restaurante** (usuario del CMS) | Persona no técnica, usa el móvil y el ordenador a nivel básico. Poco tiempo.        | Cambiar precios, platos, horarios o fotos en minutos y con seguridad de no "romper" la web. |
| **Cliente final del restaurante** (visitante de la web)       | Busca el restaurante en Google o lo encuentra en redes, normalmente desde el móvil. | Ver carta, horarios, ubicación y contactar (llamar / WhatsApp) rápidamente.                 |
| **Desarrollador / proveedor** (nosotros)                      | Instala, configura y mantiene la instancia de cada restaurante.                     | Base de código limpia, documentada, segura y barata de operar.                              |

## Modelo de producto en esta fase

- **Una instancia independiente por restaurante** (un despliegue, una base de datos, un bucket).
- **Sin multi-tenancy.** Si se consiguen 3–4 clientes, se evaluará si unificar en un SaaS multi-tenant. Hasta entonces, las decisiones evitan abstraer para ese futuro, pero tampoco lo bloquean innecesariamente (ver [ADR-0002](../decisions/ADR/ADR-0002-single-instance-monolith.md)).

## Objetivos del MVP

1. Validar que un restaurante real puede gestionar su web en autonomía.
2. Disponer de una **demo** convincente (restaurante ficticio) para enseñar a clientes potenciales (Milestone 7).
3. Mantener costes operativos bajos (planes gratuitos o de entrada de los proveedores gestionados).

## Indicadores de éxito (cualitativos en MVP)

- El usuario del CMS puede realizar las tareas cotidianas (cambiar un precio, marcar un plato como no disponible, cambiar un horario, subir una foto) sin ayuda, tras una breve explicación.
- Los cambios publicados son visibles en la web pública en pocos segundos.
- La web pública es usable en móvil, carga rápido y es indexable por buscadores.

## Principios de producto

- **Simplicidad sobre flexibilidad**: formularios con campos y opciones controladas; sin editor visual ni constructor de páginas.
- **Contenido estructurado**: el restaurante introduce datos (platos, horarios…), el diseño lo pone el producto.
- **Seguro por defecto**: lo que no es público no se expone.
- **Alcance cerrado**: las ideas nuevas se registran en [future-proposals.md](future-proposals.md), no se implementan sin aprobación.
