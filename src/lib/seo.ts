import type { Metadata, MetadataRoute } from 'next'

import { defaultLocale, type Locale, locales } from '@/i18n/config'
import { localizedPath } from '@/lib/localePath'

/** Public pages of the site, as paths after the locale prefix. */
export const PUBLIC_PAGES = ['', 'menu'] as const

export type PublicPage = (typeof PUBLIC_PAGES)[number]

/** Open Graph locale of each site language (`es-ES` / `en-IE` formats, ADR-0011). */
const OG_LOCALES: Record<Locale, string> = { es: 'es_ES', en: 'en_IE' }

type Languages = Record<Locale | 'x-default', string>

function languageUrls(path: PublicPage, toUrl: (path: string) => string): Languages {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, toUrl(localizedPath(locale, path))]),
  ) as Record<Locale, string>
  return { ...languages, 'x-default': languages[defaultLocale] }
}

/** Canonical URL and `hreflang` alternatives (es, en, x-default → es), relative to `metadataBase`. */
export function localeAlternates(locale: Locale, path: PublicPage = '') {
  return {
    canonical: localizedPath(locale, path),
    languages: languageUrls(path, (url) => url),
  }
}

export type OgImage = { url: string; width?: number; height?: number; alt?: string }

type PageMetadataInput = {
  locale: Locale
  path?: PublicPage
  title: string | { absolute: string }
  description: string | null | undefined
  siteName: string
  image: OgImage | null
}

/** Title, description, canonical URL, `hreflang` and Open Graph of a public page (RF-WEB-05). */
export function pageMetadata({
  locale,
  path = '',
  title,
  description,
  siteName,
  image,
}: PageMetadataInput): Metadata {
  const ogTitle = typeof title === 'string' ? title : title.absolute
  return {
    title,
    ...(description ? { description } : {}),
    alternates: localeAlternates(locale, path),
    openGraph: {
      type: 'website',
      siteName,
      title: ogTitle,
      ...(description ? { description } : {}),
      url: localizedPath(locale, path),
      locale: OG_LOCALES[locale],
      alternateLocale: locales
        .filter((other) => other !== locale)
        .map((other) => OG_LOCALES[other]),
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  }
}

const absolute = (baseUrl: string) => (path: string) => new URL(path, baseUrl).toString()

/** Every public page in every language, with its language alternatives (US-F3 CA2). */
export function sitemapEntries(baseUrl: string): MetadataRoute.Sitemap {
  const toUrl = absolute(baseUrl)
  return PUBLIC_PAGES.flatMap((path) =>
    locales.map((locale) => ({
      url: toUrl(localizedPath(locale, path)),
      alternates: { languages: languageUrls(path, toUrl) },
    })),
  )
}

/** Crawl the public site; never the admin panel or the API (US-F3 CA2, RF-WEB-07). */
export function robotsRules(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: absolute(baseUrl)('/sitemap.xml'),
  }
}
