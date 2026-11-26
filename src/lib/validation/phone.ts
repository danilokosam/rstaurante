import type { Locale } from '@/i18n/config'

import { isEmpty, type LocalizedMessage, type ValidationResult } from './messages'

const MAX_PHONE_LENGTH = 30
const MIN_PHONE_DIGITS = 6
const PHONE_CHARACTERS = /^[\d\s+\-()]+$/
/** E.164: `+`, a non-zero country digit and 8 to 15 digits in total. */
const E164 = /^\+[1-9]\d{7,14}$/

const phoneMessage: LocalizedMessage = {
  es: 'Teléfono no válido: usa dígitos, espacios, +, - o paréntesis (6 dígitos como mínimo, 30 caracteres como máximo).',
  en: 'Invalid phone number: use digits, spaces, +, - or brackets (at least 6 digits, at most 30 characters).',
}

const whatsappMessage: LocalizedMessage = {
  es: 'El número de WhatsApp debe estar en formato internacional, sin espacios (p. ej. +34600111222).',
  en: 'The WhatsApp number must be in international format, without spaces (e.g. +34600111222).',
}

/** Optional, permissive phone number: digits, spaces, `+`, `-` and brackets. */
export function validatePhone(value: unknown, language: Locale = 'es'): ValidationResult {
  if (isEmpty(value)) {
    return true
  }
  const valid =
    typeof value === 'string' &&
    value.length <= MAX_PHONE_LENGTH &&
    PHONE_CHARACTERS.test(value) &&
    (value.match(/\d/g)?.length ?? 0) >= MIN_PHONE_DIGITS
  return valid ? true : phoneMessage[language]
}

/** Optional WhatsApp number in E.164 format (e.g. `+34600111222`). */
export function validateWhatsAppNumber(value: unknown, language: Locale = 'es'): ValidationResult {
  if (isEmpty(value)) {
    return true
  }
  return typeof value === 'string' && E164.test(value) ? true : whatsappMessage[language]
}
