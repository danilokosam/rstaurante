/** Fixed texts of the public site in Spanish (ADR-0010). Shape shared with `en.ts`. */
export const es = {
  site: {
    defaultName: 'Restaurante',
    skipToContent: 'Saltar al contenido',
  },
  nav: {
    label: 'Navegación principal',
    home: 'Inicio',
    menu: 'Carta',
  },
  language: {
    label: 'Idioma',
    es: 'Español',
    en: 'English',
  },
  days: {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
  hours: {
    title: 'Horario',
    closed: 'Cerrado',
  },
  menu: {
    viewAll: 'Ver la carta completa',
    categories: 'Categorías de la carta',
    title: 'Carta',
    unavailable: 'No disponible',
    allergens: 'Alérgenos',
    allergyNotice: 'Si tienes alguna alergia o intolerancia, consulta al personal.',
    empty: 'La carta estará disponible muy pronto.',
  },
  sections: {
    about: 'Sobre nosotros',
    featured: 'Nuestros destacados',
    gallery: 'Galería',
    hours: 'Horario',
    contact: 'Dónde estamos',
  },
  contact: {
    title: 'Contacto',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    directions: 'Cómo llegar',
    whatsapp: 'Escríbenos por WhatsApp',
  },
  social: {
    title: 'Síguenos',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    x: 'X',
    youtube: 'YouTube',
    tripadvisor: 'Tripadvisor',
    google: 'Google',
  },
  notFound: {
    title: 'Página no encontrada',
    body: 'La página que buscas no existe o se ha movido.',
    backHome: 'Volver al inicio',
  },
  error: {
    title: 'Algo ha ido mal',
    body: 'No hemos podido cargar esta página. Inténtalo de nuevo en unos segundos.',
    retry: 'Reintentar',
  },
}

/** Same nested keys as the Spanish dictionary, with any text. */
type Texts<T> = { [K in keyof T]: T[K] extends string ? string : Texts<T[K]> }

export type Dictionary = Texts<typeof es>
