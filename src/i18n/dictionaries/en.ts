import type { Dictionary } from './es'

/** Fixed texts of the public site in English (ADR-0010). */
export const en: Dictionary = {
  site: {
    defaultName: 'Restaurant',
    skipToContent: 'Skip to content',
  },
  nav: {
    label: 'Main navigation',
    home: 'Home',
    menu: 'Menu',
  },
  language: {
    label: 'Language',
    es: 'Español',
    en: 'English',
  },
  days: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
  hours: {
    title: 'Opening hours',
    closed: 'Closed',
  },
  menu: {
    viewAll: 'See the full menu',
    categories: 'Menu categories',
    title: 'Menu',
    unavailable: 'Unavailable',
    allergens: 'Allergens',
    allergyNotice: 'If you have any allergy or intolerance, please ask our staff.',
    empty: 'Our menu will be available very soon.',
  },
  sections: {
    about: 'About us',
    featured: 'Our highlights',
    gallery: 'Gallery',
    hours: 'Opening hours',
    contact: 'Find us',
  },
  contact: {
    title: 'Contact',
    phone: 'Phone',
    email: 'Email',
    directions: 'Get directions',
    whatsapp: 'Message us on WhatsApp',
  },
  social: {
    title: 'Follow us',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    x: 'X',
    youtube: 'YouTube',
    tripadvisor: 'Tripadvisor',
    google: 'Google',
  },
  notFound: {
    title: 'Page not found',
    body: 'The page you are looking for does not exist or has been moved.',
    backHome: 'Back to home',
  },
  error: {
    title: 'Something went wrong',
    body: 'We could not load this page. Please try again in a few seconds.',
    retry: 'Try again',
  },
}
