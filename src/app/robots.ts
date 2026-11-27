import type { MetadataRoute } from 'next'

import { getEnv } from '@/lib/env'
import { robotsRules } from '@/lib/seo'

/** `/robots.txt`: the public site is crawlable; `/admin` and `/api` are not (US-F3 CA2). */
export default function robots(): MetadataRoute.Robots {
  return robotsRules(getEnv().serverUrl)
}
