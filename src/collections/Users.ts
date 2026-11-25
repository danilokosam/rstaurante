import { APIError, type CollectionConfig, ValidationError } from 'payload'

import { authenticated } from '@/access'
import { validatePassword } from '@/lib/password'

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
      ({ data }) => {
        if (data?.password !== undefined) {
          const result = validatePassword(data.password)
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
    // Email added by default by Payload auth.
  ],
}
