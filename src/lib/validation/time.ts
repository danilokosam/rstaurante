import type { Locale } from '@/i18n/config'

import type { LocalizedMessage, ValidationResult } from './messages'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export type TimeSlot = { opens: string; closes: string }

const timeMessage: LocalizedMessage = {
  es: 'La hora debe tener el formato HH:MM (de 00:00 a 23:59).',
  en: 'The time must use the HH:MM format (00:00 to 23:59).',
}

const sameTimeMessage: LocalizedMessage = {
  es: 'La hora de apertura y la de cierre no pueden ser iguales.',
  en: 'Opening and closing times cannot be the same.',
}

/** Required time in 24-hour `HH:MM` format. */
export function validateTime(value: unknown, language: Locale = 'es'): ValidationResult {
  return typeof value === 'string' && TIME.test(value) ? true : timeMessage[language]
}

/**
 * Opening slot: both times valid and different. A closing time earlier than
 * the opening time means the slot ends after midnight (US-B4 CA3).
 */
export function validateTimeSlot(slot: TimeSlot, language: Locale = 'es'): ValidationResult {
  const invalidTime = [slot.opens, slot.closes]
    .map((time) => validateTime(time, language))
    .find((result) => result !== true)
  if (invalidTime) {
    return invalidTime
  }
  return slot.opens === slot.closes ? sameTimeMessage[language] : true
}

/** Whether a valid slot ends on the following day. */
export function crossesMidnight(slot: TimeSlot): boolean {
  return slot.closes < slot.opens
}
