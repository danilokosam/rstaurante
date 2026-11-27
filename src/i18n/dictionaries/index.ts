import type { Locale } from '@/i18n/config'

import { en } from './en'
import { es, type Dictionary } from './es'

export type { Dictionary }

const dictionaries: Record<Locale, Dictionary> = { es, en }

/** Fixed texts of the public site for a locale (ADR-0010, RF-I18N-03). */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
