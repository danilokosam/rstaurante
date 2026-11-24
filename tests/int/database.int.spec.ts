import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { migrations } from '@/migrations'

import { resetDatabase } from '../helpers/resetDatabase'

let payload: Payload

describe('database foundation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    // Start from an empty schema and apply the versioned migrations, exactly
    // as a fresh production database would.
    await resetDatabase(payload)
  })

  afterAll(async () => {
    await payload?.destroy()
  })

  it('applies every versioned migration to an empty database', async () => {
    const applied = await payload.find({
      collection: 'payload-migrations',
      limit: 100,
      sort: 'createdAt',
    })

    expect(applied.docs.map((doc) => doc.name)).toEqual(migrations.map((m) => m.name))
  })

  it('persists and reads documents through the Local API', async () => {
    const email = 'foundation-check@example.com'

    const created = await payload.create({
      collection: 'users',
      data: { email, password: 'correct-horse-battery-staple' },
    })

    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0]?.id).toBe(created.id)
  })
})
