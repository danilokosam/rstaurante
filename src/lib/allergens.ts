import type { Locale } from '@/i18n/config'

/**
 * Closed list of the 14 mandatory allergens from EU Regulation 1169/2011, Annex II
 * (ADR-0011, RF-MENU-08). Codes are stored language-independently and mapped to
 * localized labels for both the Payload admin select field and the public menu.
 */
export const ALLERGEN_CODES = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const

export type AllergenCode = (typeof ALLERGEN_CODES)[number]

export const ALLERGEN_LABELS: Record<AllergenCode, Record<Locale, string>> = {
  gluten: { es: 'Cereales con gluten', en: 'Cereals containing gluten' },
  crustaceans: { es: 'Crustáceos', en: 'Crustaceans' },
  eggs: { es: 'Huevos', en: 'Eggs' },
  fish: { es: 'Pescado', en: 'Fish' },
  peanuts: { es: 'Cacahuetes', en: 'Peanuts' },
  soybeans: { es: 'Soja', en: 'Soybeans' },
  milk: { es: 'Leche', en: 'Milk' },
  nuts: { es: 'Frutos de cáscara', en: 'Tree nuts' },
  celery: { es: 'Apio', en: 'Celery' },
  mustard: { es: 'Mostaza', en: 'Mustard' },
  sesame: { es: 'Sésamo', en: 'Sesame' },
  sulphites: { es: 'Sulfitos', en: 'Sulphites' },
  lupin: { es: 'Altramuces', en: 'Lupin' },
  molluscs: { es: 'Moluscos', en: 'Molluscs' },
}

export const ALLERGEN_OPTIONS: Array<{ value: AllergenCode; label: Record<Locale, string> }> =
  ALLERGEN_CODES.map((value) => ({
    value,
    label: ALLERGEN_LABELS[value],
  }))

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value)
}

export function getAllergenLabel(code: AllergenCode, locale: Locale): string {
  return ALLERGEN_LABELS[code][locale]
}

/**
 * Labels of a dish's allergens in the page language (US-E5 CA2). An empty list
 * means "not informed", never "allergen-free" (CA4, ADR-0011).
 */
export function getAllergenLabels(
  codes: readonly AllergenCode[] | null | undefined,
  locale: Locale,
): string[] {
  return (codes ?? []).map((code) => getAllergenLabel(code, locale))
}
