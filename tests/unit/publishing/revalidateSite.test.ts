import { describe, expect, it, vi } from 'vitest'

import { revalidateSite } from '@/lib/publishing/revalidateSite'

const outsideNextError = new Error(
  'Invariant: static generation store missing in revalidatePath("/")',
)

function deps(revalidate: () => void = () => {}) {
  return { revalidate: vi.fn(revalidate), logError: vi.fn() }
}

describe('revalidateSite (ADR-0007)', () => {
  it('revalidates the whole site', () => {
    const d = deps()

    expect(revalidateSite(d)).toBe('revalidated')
    expect(d.revalidate).toHaveBeenCalledOnce()
    expect(d.logError).not.toHaveBeenCalled()
  })

  it('does nothing when the caller disables revalidation (seed scripts)', () => {
    const d = deps()

    expect(revalidateSite(d, { disableRevalidate: true })).toBe('skipped')
    expect(d.revalidate).not.toHaveBeenCalled()
  })

  it('ignores silently the call outside a Next.js request (scripts, tests)', () => {
    const d = deps(() => {
      throw outsideNextError
    })

    expect(revalidateSite(d)).toBe('outside-next')
    expect(d.logError).not.toHaveBeenCalled()
  })

  it('logs any other failure without throwing, so the save is never undone (RF-PUB-02)', () => {
    const failure = new Error('cache backend unavailable')
    const d = deps(() => {
      throw failure
    })

    expect(revalidateSite(d)).toBe('failed')
    expect(d.logError).toHaveBeenCalledWith(failure)
  })
})
