import type { MetadataRoute } from 'next'

import { getEnv } from '@/lib/env'
import { sitemapEntries } from '@/lib/seo'

/** `/sitemap.xml`: every public page in es and en with its alternatives (RF-WEB-05). */
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(getEnv().serverUrl)
}
