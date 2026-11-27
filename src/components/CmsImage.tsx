import Image from 'next/image'

import { imageSrc } from '@/lib/imageSrc'
import { getEnv } from '@/lib/env'
import type { Media } from '@/payload-types'

type Size = 'thumbnail' | 'card' | 'hero'

type Props = {
  image: Media | null | undefined
  size: Size
  /** `sizes` attribute for responsive loading. */
  sizes: string
  className?: string
  /**
   * Above-the-fold image. `eager` loads it without waiting (logo); `lcp` preloads it
   * from the document head, for the single image that is the Largest Contentful Paint
   * on every viewport (hero). Next.js 16 replaces the deprecated `priority` with these
   * options and advises not to combine `preload` with `loading` or `fetchPriority`.
   */
  loading?: 'eager' | 'lcp'
  /** Decorative images get an empty alt; content images use the CMS alt text. */
  decorative?: boolean
  /** Fills the positioned parent (`object-cover` backgrounds) instead of using intrinsic size. */
  fill?: boolean
}

/** CMS image with the generated WebP size and its localized alt text. */
export function CmsImage({ image, size, sizes, className, loading, decorative, fill }: Props) {
  if (!image) {
    return null
  }
  const variant = image.sizes?.[size]
  const src = imageSrc(variant?.url ?? image.url, getEnv().serverUrl)
  const width = variant?.width ?? image.width
  const height = variant?.height ?? image.height
  if (!src || !width || !height) {
    return null
  }
  return (
    <Image
      src={src}
      {...(fill ? { fill: true } : { width, height })}
      alt={decorative ? '' : (image.alt ?? '')}
      sizes={sizes}
      className={className}
      {...(loading === 'lcp'
        ? { preload: true }
        : loading === 'eager'
          ? { loading: 'eager' as const }
          : {})}
      style={
        image.focalX != null && image.focalY != null
          ? { objectPosition: `${image.focalX}% ${image.focalY}%` }
          : undefined
      }
    />
  )
}
