export type RevalidateSiteDeps = {
  /** Invalidates every cached page of the public site. */
  revalidate: () => void
  logError: (error: unknown) => void
}

export type RevalidateSiteContext = { disableRevalidate?: boolean }

export type RevalidateSiteResult = 'revalidated' | 'skipped' | 'outside-next' | 'failed'

/** Message Next.js throws when revalidation runs outside a request (scripts, tests). */
const OUTSIDE_NEXT_MESSAGE = 'static generation store missing'

/**
 * Saving content publishes it: the whole public site is revalidated
 * (ADR-0007). It never throws, so a revalidation problem cannot undo a save;
 * the hourly fallback revalidation of the public pages covers that case
 * (RF-PUB-02).
 */
export function revalidateSite(
  deps: RevalidateSiteDeps,
  context: RevalidateSiteContext = {},
): RevalidateSiteResult {
  if (context.disableRevalidate) {
    return 'skipped'
  }
  try {
    deps.revalidate()
    return 'revalidated'
  } catch (error) {
    if (error instanceof Error && error.message.includes(OUTSIDE_NEXT_MESSAGE)) {
      return 'outside-next'
    }
    deps.logError(error)
    return 'failed'
  }
}
