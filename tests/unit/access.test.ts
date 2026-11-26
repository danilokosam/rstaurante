import type { AccessArgs } from 'payload'
import { describe, expect, it } from 'vitest'

import { anyone, authenticated } from '@/access'

function makeArgs(user: AccessArgs['req']['user']): AccessArgs {
  return { req: { user } } as AccessArgs
}

describe('access helpers', () => {
  describe('authenticated', () => {
    it('returns true when req.user is present', () => {
      expect(
        authenticated(makeArgs({ id: 1, collection: 'users' } as AccessArgs['req']['user'])),
      ).toBe(true)
    })

    it('returns false when req.user is null or undefined', () => {
      expect(authenticated(makeArgs(null))).toBe(false)
      expect(authenticated(makeArgs(undefined as unknown as AccessArgs['req']['user']))).toBe(false)
    })
  })

  describe('anyone', () => {
    it('always returns true regardless of authentication', () => {
      expect(anyone(makeArgs(null))).toBe(true)
      expect(anyone(makeArgs({ id: 1, collection: 'users' } as AccessArgs['req']['user']))).toBe(
        true,
      )
    })
  })
})
