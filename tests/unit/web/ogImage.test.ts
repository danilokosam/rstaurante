import { describe, expect, it } from 'vitest'

import { ogImage } from '@/lib/content/seo'
import type { Media } from '@/payload-types'

const base = {
  id: 1,
  alt: 'Comedor',
  url: 'https://site.example/api/media/file/room.jpg',
  width: 3000,
  height: 2000,
  updatedAt: '',
  createdAt: '',
} satisfies Media

describe('ogImage (Open Graph image from a CMS image)', () => {
  it('uses the 1920 px size with its own dimensions and the alt text', () => {
    const image: Media = {
      ...base,
      sizes: {
        hero: {
          url: 'https://site.example/api/media/file/room-1920x1280.webp',
          width: 1920,
          height: 1280,
        },
      },
    }
    expect(ogImage(image)).toEqual({
      url: 'https://site.example/api/media/file/room-1920x1280.webp',
      width: 1920,
      height: 1280,
      alt: 'Comedor',
    })
  })

  it('falls back to the original file when the size is missing', () => {
    expect(ogImage({ ...base, alt: null })).toEqual({
      url: 'https://site.example/api/media/file/room.jpg',
      width: 3000,
      height: 2000,
    })
  })

  it('returns null for an unpopulated relation or an image without URL', () => {
    expect(ogImage(null)).toBeNull()
    expect(ogImage(7)).toBeNull()
    expect(ogImage({ ...base, url: null })).toBeNull()
  })
})
