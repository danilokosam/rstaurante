// Explicit .js: the `next` package has no "exports" map, so plain Node ESM (used by
// Playwright to load payload.config in E2E) cannot resolve `next/cache`.
import { revalidatePath } from 'next/cache.js'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { revalidateSite } from '@/lib/publishing/revalidateSite'

function revalidateAfterSave(req: PayloadRequest): void {
  revalidateSite(
    {
      // Invalidates every cached page of the public site (Next.js 16.4 docs:
      // "Revalidating all data"). The site has very few pages (ADR-0007).
      revalidate: () => revalidatePath('/', 'layout'),
      logError: (error) =>
        req.payload.logger.error({ err: error, msg: 'Public site revalidation failed' }),
    },
    req.context,
  )
}

/** For collections with public content (`afterChange`). */
export const revalidateSiteAfterChange: CollectionAfterChangeHook = ({ doc, req }) => {
  revalidateAfterSave(req)
  return doc
}

/** For collections with public content (`afterDelete`). */
export const revalidateSiteAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateAfterSave(req)
  return doc
}

/** For globals with public content (`afterChange`). */
export const revalidateSiteAfterGlobalChange: GlobalAfterChangeHook = ({ doc, req }) => {
  revalidateAfterSave(req)
  return doc
}
