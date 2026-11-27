import type { Locale } from '@/i18n/config'

/** Number format of each site language: `12,50 €` / `€12.50` (ADR-0011). */
const NUMBER_LOCALES: Record<Locale, string> = { es: 'es-ES', en: 'en-IE' }

const formatters = Object.fromEntries(
  Object.entries(NUMBER_LOCALES).map(([locale, numberLocale]) => [
    locale,
    new Intl.NumberFormat(numberLocale, { style: 'currency', currency: 'EUR' }),
  ]),
) as Record<Locale, Intl.NumberFormat>

/** Dish price in euros (fixed currency) with the format of the page language. */
export function formatPrice(value: number, locale: Locale): string {
  return formatters[locale].format(value)
}
