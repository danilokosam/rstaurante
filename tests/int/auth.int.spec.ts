import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { resetDatabase } from '../helpers/resetDatabase'

let payload: Payload

const VALID_PASSWORD = 'correct-horse-battery-staple'

async function createAdminUser(email = 'admin@example.com') {
  return payload.create({
    collection: 'users',
    data: { email, password: VALID_PASSWORD },
  })
}

describe('authentication & access control', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  beforeEach(async () => {
    await resetDatabase(payload)
  })

  afterAll(async () => {
    await payload?.destroy()
  })

  describe('users access control (RF-AUTH-01, RF-AUTH-05)', () => {
    it('denies anonymous read, create, update, and delete on users', async () => {
      const existing = await createAdminUser()

      await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()

      await expect(
        payload.create({
          collection: 'users',
          data: { email: 'intruder@example.com', password: VALID_PASSWORD },
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      await expect(
        payload.update({
          collection: 'users',
          id: existing.id,
          data: { email: 'hijacked@example.com' },
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      await expect(
        payload.delete({
          collection: 'users',
          id: existing.id,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('allows authenticated users to read, create, and update users', async () => {
      const admin = await createAdminUser()

      const found = await payload.find({
        collection: 'users',
        user: admin,
        overrideAccess: false,
      })
      expect(found.docs).toHaveLength(1)

      const second = await payload.create({
        collection: 'users',
        data: { email: 'second@example.com', password: VALID_PASSWORD },
        user: admin,
        overrideAccess: false,
      })
      expect(second.email).toBe('second@example.com')

      const updated = await payload.update({
        collection: 'users',
        id: second.id,
        data: { email: 'second-updated@example.com' },
        user: admin,
        overrideAccess: false,
      })
      expect(updated.email).toBe('second-updated@example.com')
    })
  })

  describe('media access control', () => {
    it('allows anonymous read and denies anonymous write on media', async () => {
      const found = await payload.find({
        collection: 'media',
        overrideAccess: false,
      })
      expect(found.docs).toEqual([])

      await expect(
        payload.create({
          collection: 'media',
          data: { alt: 'Test' },
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  describe('password policy (RF-AUTH-07)', () => {
    it('rejects creating a user with a password shorter than 12 characters', async () => {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: 'short@example.com', password: 'short-pass!' },
        }),
      ).rejects.toThrow()
    })

    it('rejects updating a password to fewer than 12 characters', async () => {
      const admin = await createAdminUser()

      await expect(
        payload.update({
          collection: 'users',
          id: admin.id,
          data: { password: 'too-short' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('account lockout (RF-AUTH-03)', () => {
    it('locks the account after 5 consecutive failed login attempts', async () => {
      const email = 'lockout@example.com'
      await createAdminUser(email)

      for (let i = 0; i < 5; i += 1) {
        await expect(
          payload.login({
            collection: 'users',
            data: { email, password: 'wrong-password-123' },
          }),
        ).rejects.toThrow()
      }

      // Even the valid password must be rejected while locked.
      await expect(
        payload.login({
          collection: 'users',
          data: { email, password: VALID_PASSWORD },
        }),
      ).rejects.toThrow()
    })
  })

  describe('last user protection (US-A4)', () => {
    it('prevents deleting the last remaining user, but allows deleting when another exists', async () => {
      const first = await createAdminUser('first@example.com')

      await expect(
        payload.delete({
          collection: 'users',
          id: first.id,
          user: first,
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      const second = await createAdminUser('second@example.com')

      await expect(
        payload.delete({
          collection: 'users',
          id: second.id,
          user: first,
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({ id: second.id })

      const remaining = await payload.count({ collection: 'users' })
      expect(remaining.totalDocs).toBe(1)
    })
  })

  describe('security and i18n configuration (ADR-0006, ADR-0010)', () => {
    it('restricts cors and csrf to the configured serverURL', () => {
      expect(payload.config.cors).toEqual([payload.config.serverURL])
      expect(Array.from(new Set(payload.config.csrf))).toEqual([payload.config.serverURL])
    })

    it('configures Spanish and English localization with Spanish as default and fallback', () => {
      expect(payload.config.localization).toMatchObject({
        defaultLocale: 'es',
        fallback: true,
        localeCodes: ['es', 'en'],
      })
    })
  })
})
