import { describe, expect, it } from 'vitest'

import { imageSrc } from '@/lib/imageSrc'

describe('imageSrc (next/image sources for CMS media)', () => {
  const serverUrl = 'http://localhost:3000'

  it('turns URLs on the site origin into local paths (images.localPatterns)', () => {
    expect(imageSrc('http://localhost:3000/api/media/file/dish.webp', serverUrl)).toBe(
      '/api/media/file/dish.webp',
    )
    expect(imageSrc('/api/media/file/dish.webp', serverUrl)).toBe('/api/media/file/dish.webp')
  })

  it('keeps external storage URLs (images.remotePatterns from S3_PUBLIC_URL)', () => {
    const url = 'https://project.supabase.co/storage/v1/object/public/media/dish.webp'
    expect(imageSrc(url, serverUrl)).toBe(url)
  })

  it('returns null without a URL', () => {
    expect(imageSrc(null, serverUrl)).toBeNull()
    expect(imageSrc(undefined, serverUrl)).toBeNull()
    expect(imageSrc('', serverUrl)).toBeNull()
  })
})
