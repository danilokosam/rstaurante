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
  priority?: boolean
  /** Decorative images get an empty alt; content images use the CMS alt text. */
  decorative?: boolean
}

/** CMS image with the generated WebP size and its localized alt text. */
export function CmsImage({ image, size, sizes, className, priority, decorative }: Props) {
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
      width={width}
      height={height}
      alt={decorative ? '' : (image.alt ?? '')}
      sizes={sizes}
      className={className}
      priority={priority}
      style={
        image.focalX != null && image.focalY != null
          ? { objectPosition: `${image.focalX}% ${image.focalY}%` }
          : undefined
      }
    />
  )
}
