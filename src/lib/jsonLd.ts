import type { Locale } from '@/i18n/config'
import { type OpeningSlot, WEEK_DAYS } from '@/lib/hours'
import { phoneHref } from '@/lib/links'
import { localizedPath } from '@/lib/localePath'

type Text = string | null | undefined

export type RestaurantSettings = {
  contact?: { phone?: Text; email?: Text } | null
  location?: {
    street?: Text
    postalCode?: Text
    city?: Text
    region?: Text
    country?: Text
  } | null
  openingHours?: { slots?: readonly OpeningSlot[] | null } | null
  socialLinks?: readonly { url: string; platform?: string }[] | null
}

type Input = {
  baseUrl: string
  locale: Locale
  name: string
  description: Text
  image: Text
  settings: RestaurantSettings
}

const clean = (value: Text): string | undefined => value?.trim() || undefined

/** Removes keys whose value is `undefined` (fields without content are left out). */
function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as Partial<T>
}

const dayName = (day: OpeningSlot['day']) => `${day[0]?.toUpperCase()}${day.slice(1)}`

/**
 * schema.org `Restaurant` for the home page (RF-WEB-05, US-F3 CA3). A closing
 * time earlier than the opening time means the slot ends after midnight, as
 * schema.org interprets it.
 */
export function restaurantJsonLd({ baseUrl, locale, name, description, image, settings }: Input) {
  const url = (path: string) => new URL(path, baseUrl).toString()
  const location = settings.location ?? {}
  const address = compact({
    streetAddress: clean(location.street),
    postalCode: clean(location.postalCode),
    addressLocality: clean(location.city),
    addressRegion: clean(location.region),
    addressCountry: clean(location.country),
  })
  const slots = [...(settings.openingHours?.slots ?? [])].sort(
    (a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day) || a.opens.localeCompare(b.opens),
  )
  const sameAs = (settings.socialLinks ?? []).map((link) => link.url).filter(Boolean)

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    description: clean(description),
    url: url(localizedPath(locale)),
    hasMenu: url(localizedPath(locale, 'menu')),
    image: clean(image),
    telephone: phoneHref(settings.contact?.phone)?.replace(/^tel:/, '') ?? undefined,
    email: clean(settings.contact?.email),
    address: Object.keys(address).length ? { '@type': 'PostalAddress', ...address } : undefined,
    openingHoursSpecification: slots.length
      ? slots.map((slot) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${dayName(slot.day)}`,
          opens: slot.opens,
          closes: slot.closes,
        }))
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  })
}

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so content cannot close the tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
