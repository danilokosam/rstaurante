import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import { APIError, type CollectionConfig, type PayloadRequest, ValidationError } from 'payload'

import { authenticated } from '@/access'
import { adminLanguage } from '@/i18n/adminLanguage'
import { validatePassword } from '@/lib/password'

/** Arbitrary constant key for the advisory lock that serializes user deletions. */
const LAST_USER_LOCK_KEY = 74_201_001

/**
 * Serializes concurrent user deletions until the current transaction ends, so
 * two parallel deletes cannot both see "more than one user" and empty the
 * collection (US-A4 CA2).
 */
async function lockUserDeletions(req: PayloadRequest): Promise<void> {
  // This project always uses the Postgres adapter (see payload.config.ts).
  const adapter = req.payload.db as unknown as PostgresAdapter
  const transactionID = req.transactionID ? await req.transactionID : undefined
  const db = (transactionID && adapter.sessions[transactionID]?.db) || adapter.drizzle
  await db.execute(sql`SELECT pg_advisory_xact_lock(${LAST_USER_LOCK_KEY})`)
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: {
      es: 'Usuario',
      en: 'User',
    },
    plural: {
      es: 'Usuarios',
      en: 'Users',
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  auth: {
    maxLoginAttempts: 5,
    // 10 minutes lockout after 5 consecutive failed attempts (RF-AUTH-03).
    lockTime: 10 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (data?.password !== undefined) {
          const result = validatePassword(data.password, adminLanguage(req))
          if (typeof result === 'string') {
            throw new ValidationError({
              collection: 'users',
              errors: [{ message: result, path: 'password' }],
            })
          }
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ req }) => {
        await lockUserDeletions(req)
        const { totalDocs } = await req.payload.count({
          collection: 'users',
          overrideAccess: true,
          req,
        })
        if (totalDocs <= 1) {
          throw new APIError('Cannot delete the last remaining user.', 400, undefined, true)
        }
      },
    ],
  },
  fields: [
    // Email and password are added by Payload auth.
    {
      name: 'name',
      type: 'text',
      maxLength: 100,
      label: { es: 'Nombre', en: 'Name' },
    },
  ],
}
