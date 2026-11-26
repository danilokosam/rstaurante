import type { Locale } from '@/i18n/config'

/** Result of a field validator: `true` when valid, otherwise an error message. */
export type ValidationResult = string | true

/** An error message available in every admin language. */
export type LocalizedMessage = Record<Locale, string>

export const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === ''
