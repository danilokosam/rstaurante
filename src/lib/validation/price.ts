import type { Locale } from '@/i18n/config'

import { isEmpty, type LocalizedMessage, type ValidationResult } from './messages'

export const MIN_PRICE = 0
export const MAX_PRICE = 9999.99

const messages = {
  required: {
    es: 'El precio es obligatorio.',
    en: 'Price is required.',
  },
  notNumber: {
    es: 'El precio debe ser un número válido.',
    en: 'Price must be a valid number.',
  },
  range: {
    es: 'El precio debe estar entre 0 y 9999,99 €.',
    en: 'Price must be between €0 and €9999.99.',
  },
  decimals: {
    es: 'El precio puede tener como máximo 2 decimales.',
    en: 'Price can have at most 2 decimal places.',
  },
} satisfies Record<string, LocalizedMessage>

function hasAtMostTwoDecimals(value: number): boolean {
  return Number(value.toFixed(2)) === value
}

/** Mandatory EUR dish price in [0, 9999.99] with at most 2 decimal places (RF-MENU-03). */
export function validatePrice(value: unknown, language: Locale = 'es'): ValidationResult {
  if (isEmpty(value)) {
    return messages.required[language]
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return messages.notNumber[language]
  }
  if (value < MIN_PRICE || value > MAX_PRICE) {
    return messages.range[language]
  }
  if (!hasAtMostTwoDecimals(value)) {
    return messages.decimals[language]
  }
  return true
}
