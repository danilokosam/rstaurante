import config from '@payload-config'
import { getPayload } from 'payload'

import { defaultLocale, type Locale } from '@/i18n/config'
import type { AllergenCode } from '@/lib/allergens'
import type { Gallery, Homepage, Media, SiteSetting } from '@/payload-types'

/**
 * Content queries of the public site (ADR-0002, data-flows F2). They always
 * read as an anonymous visitor (`overrideAccess: false`), so the collections'
 * access rules hide invisible categories and hidden dishes, and they fall
 * back to Spanish when a text is not translated (ADR-0010).
 */
async function readOptions(locale: Locale) {
  return {
    payload: await getPayload({ config }),
    query: { locale, fallbackLocale: defaultLocale, overrideAccess: false } as const,
  }
}

export type PublicDish = {
  id: number
  name: string
  description: string | null
  price: number
  unavailable: boolean
  isFeatured: boolean
  allergens: AllergenCode[]
  image: Media | null
}

export type MenuSection = {
  id: number
  name: string
  description: string | null
  dishes: PublicDish[]
}

const asMedia = (value: number | Media | null | undefined): Media | null =>
  typeof value === 'object' && value !== null ? value : null

const relationId = (value: number | { id: number } | null | undefined): number | null =>
  typeof value === 'object' && value !== null ? value.id : (value ?? null)

/** Visible categories with their non-hidden dishes, in the panel order; empty categories are left out. */
export async function getMenu(locale: Locale): Promise<MenuSection[]> {
  const { payload, query } = await readOptions(locale)
  const [categories, dishes] = await Promise.all([
    payload.find({ collection: 'menu-categories', ...query, depth: 0, pagination: false }),
    payload.find({ collection: 'dishes', ...query, depth: 1, pagination: false }),
  ])

  return categories.docs
    .map((category) => ({
      id: category.id,
      name: category.name ?? '',
      description: category.description ?? null,
      dishes: dishes.docs
        .filter((dish) => relationId(dish.category) === category.id)
        .map((dish): PublicDish => ({
          id: dish.id,
          name: dish.name ?? '',
          description: dish.description ?? null,
          price: dish.price,
          unavailable: dish.availability === 'unavailable',
          isFeatured: Boolean(dish.isFeatured),
          allergens: dish.allergens ?? [],
          image: asMedia(dish.image),
        })),
    }))
    .filter((section) => section.dishes.length > 0)
}

export const MAX_FEATURED_DISHES = 6

/** Up to 6 featured dishes shown on the menu, in menu order (US-E4). */
export async function getFeaturedDishes(locale: Locale): Promise<PublicDish[]> {
  const menu = await getMenu(locale)
  return menu
    .flatMap((section) => section.dishes)
    .filter((dish) => dish.isFeatured)
    .slice(0, MAX_FEATURED_DISHES)
}

/** Restaurant information with populated images (logo, SEO image). */
export async function getSiteSettings(locale: Locale): Promise<SiteSetting> {
  const { payload, query } = await readOptions(locale)
  return payload.findGlobal({ slug: 'site-settings', ...query, depth: 1 })
}

/** Home page content with populated images. */
export async function getHomepage(locale: Locale): Promise<Homepage> {
  const { payload, query } = await readOptions(locale)
  return payload.findGlobal({ slug: 'homepage', ...query, depth: 1 })
}

/** Gallery images in their order; deleted images are already removed from the list. */
export async function getGalleryImages(locale: Locale): Promise<Media[]> {
  const { payload, query } = await readOptions(locale)
  const gallery: Gallery = await payload.findGlobal({ slug: 'gallery', ...query, depth: 1 })
  return (gallery.images ?? []).map(asMedia).filter((image): image is Media => image !== null)
}
