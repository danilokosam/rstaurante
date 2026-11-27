import { describe, expect, it } from 'vitest'

import { localeAlternates, pageMetadata, robotsRules, sitemapEntries } from '@/lib/seo'

const BASE = 'https://casapepe.example'

describe('localeAlternates (RF-WEB-05, US-F5 CA4)', () => {
  it('declares the canonical URL and the es, en and x-default alternatives', () => {
    expect(localeAlternates('en', 'menu')).toEqual({
      canonical: '/en/menu',
      languages: { es: '/es/menu', en: '/en/menu', 'x-default': '/es/menu' },
    })
    expect(localeAlternates('es')).toEqual({
      canonical: '/es',
      languages: { es: '/es', en: '/en', 'x-default': '/es' },
    })
  })
})

describe('pageMetadata (US-F3 CA1)', () => {
  const image = {
    url: `${BASE}/api/media/file/hero-1920.webp`,
    width: 1920,
    height: 1080,
    alt: 'Comedor',
  }

  it('builds title, description, canonical, hreflang and Open Graph', () => {
    const metadata = pageMetadata({
      locale: 'en',
      path: 'menu',
      title: 'Menu',
      description: 'Dishes, prices and allergens.',
      siteName: 'Casa Pepe',
      image,
    })

    expect(metadata.title).toBe('Menu')
    expect(metadata.description).toBe('Dishes, prices and allergens.')
    expect(metadata.alternates).toEqual(localeAlternates('en', 'menu'))
    expect(metadata.openGraph).toEqual({
      type: 'website',
      siteName: 'Casa Pepe',
      title: 'Menu',
      description: 'Dishes, prices and allergens.',
      url: '/en/menu',
      locale: 'en_IE',
      alternateLocale: ['es_ES'],
      images: [image],
    })
    expect(metadata.twitter).toEqual({ card: 'summary_large_image' })
  })

  it('uses an absolute title on the home page and omits empty fields', () => {
    const metadata = pageMetadata({
      locale: 'es',
      title: { absolute: 'Casa Pepe' },
      description: null,
      siteName: 'Casa Pepe',
      image: null,
    })

    expect(metadata.title).toEqual({ absolute: 'Casa Pepe' })
    expect(metadata).not.toHaveProperty('description')
    expect(metadata.openGraph).toMatchObject({ title: 'Casa Pepe', locale: 'es_ES', url: '/es' })
    expect(metadata.openGraph).not.toHaveProperty('images')
    expect(metadata.twitter).toEqual({ card: 'summary' })
  })
})

describe('sitemapEntries (RF-WEB-05, US-F3 CA2)', () => {
  it('lists every page in every language with its alternatives', () => {
    const entries = sitemapEntries(`${BASE}/`)

    expect(entries.map((entry) => entry.url)).toEqual([
      `${BASE}/es`,
      `${BASE}/en`,
      `${BASE}/es/menu`,
      `${BASE}/en/menu`,
    ])
    expect(entries[3]?.alternates).toEqual({
      languages: { es: `${BASE}/es/menu`, en: `${BASE}/en/menu`, 'x-default': `${BASE}/es/menu` },
    })
  })
})

describe('robotsRules (US-F3 CA2)', () => {
  it('allows the public site, excludes the admin panel and the API, and links the sitemap', () => {
    expect(robotsRules(BASE)).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      sitemap: `${BASE}/sitemap.xml`,
    })
  })
})
