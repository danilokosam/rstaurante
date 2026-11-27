import type { OgImage } from '@/lib/seo'
import type { Media } from '@/payload-types'

/** Open Graph image from a CMS image: the 1920 px WebP size when available (absolute URL). */
export function ogImage(value: number | Media | null | undefined): OgImage | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  // URL and dimensions always come from the same variant.
  const source = value.sizes?.hero?.url ? value.sizes.hero : value
  if (!source.url) {
    return null
  }
  return {
    url: source.url,
    ...(source.width ? { width: source.width } : {}),
    ...(source.height ? { height: source.height } : {}),
    ...(value.alt ? { alt: value.alt } : {}),
  }
}
