import type { Locale } from '@/i18n/config'

import { isEmpty, type LocalizedMessage, type ValidationResult } from './messages'

const MAX_URL_LENGTH = 2048

/** Hosts accepted for the Google Maps link of the restaurant (data-model.md). */
export const GOOGLE_MAPS_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
] as const

const httpsMessage: LocalizedMessage = {
  es: 'La URL debe empezar por https:// y ser válida.',
  en: 'The URL must start with https:// and be valid.',
}

const mapsMessage: LocalizedMessage = {
  es: 'Debe ser un enlace https de Google Maps (google.com, maps.google.com, maps.app.goo.gl o goo.gl).',
  en: 'It must be an https Google Maps link (google.com, maps.google.com, maps.app.goo.gl or goo.gl).',
}

function parseHttpsUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) {
    return null
  }
  try {
    const url = new URL(value)
    const valid = url.protocol === 'https:' && url.hostname !== '' && !url.username && !url.password
    return valid ? url : null
  } catch {
    return null
  }
}

/** Optional absolute `https` URL without embedded credentials. */
export function validateHttpsUrl(value: unknown, language: Locale = 'es'): ValidationResult {
  if (isEmpty(value)) {
    return true
  }
  return parseHttpsUrl(value) ? true : httpsMessage[language]
}

/** Optional `https` URL whose host is an allowed Google Maps host. */
export function validateMapsUrl(value: unknown, language: Locale = 'es'): ValidationResult {
  if (isEmpty(value)) {
    return true
  }
  const url = parseHttpsUrl(value)
  const allowed = url && (GOOGLE_MAPS_HOSTS as readonly string[]).includes(url.hostname)
  return allowed ? true : mapsMessage[language]
}
