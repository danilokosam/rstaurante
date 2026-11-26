import type { Locale } from '@/i18n/config'

export const MIN_PASSWORD_LENGTH = 12

const messages: Record<Locale, string> = {
  es: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
}

/**
 * Validates that a user password is a non-blank string with at least
 * `MIN_PASSWORD_LENGTH` characters (RF-AUTH-07). Returns `true` when valid, or
 * an error message in the requested admin language (Spanish by default).
 */
export function validatePassword(value: unknown, language: Locale = 'es'): string | true {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.length < MIN_PASSWORD_LENGTH
  ) {
    return messages[language]
  }

  return true
}
