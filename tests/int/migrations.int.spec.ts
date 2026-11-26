import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { migrations } from '@/migrations'
import config from '@/payload.config'

import { resetDatabase } from '../helpers/resetDatabase'

let payload: Payload

type GenericMigrations = NonNullable<Parameters<Payload['db']['migrate']>[0]>['migrations']

function migrateUpTo(name: string) {
  const index = migrations.findIndex((migration) => migration.name === name)
  if (index === -1) {
    throw new Error(`Unknown migration ${name}`)
  }
  return payload.db.migrate({
    migrations: migrations.slice(0, index + 1) as unknown as GenericMigrations,
  })
}

describe('data-preserving migrations', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    // Leave the test database fully migrated for the following test files.
    await resetDatabase(payload)
    await payload?.destroy()
  })

  it('20261126_185820_media_and_user_name keeps alt texts as Spanish (up) and restores them (down)', async () => {
    const db = (payload.db as unknown as PostgresAdapter).drizzle
    await db.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)
    await migrateUpTo('20261125_122312')

    await db.execute(sql`
      INSERT INTO "media" ("alt", "filename", "updated_at", "created_at")
      VALUES ('Paella de marisco', 'paella.jpg', now(), now())
    `)

    await migrateUpTo('20261126_185820_media_and_user_name')

    const { rows } = await db.execute(sql`
      SELECT "alt", "_locale" FROM "media_locales"
    `)
    expect(rows).toEqual([{ alt: 'Paella de marisco', _locale: 'es' }])

    const migration = migrations.find(({ name }) => name === '20261126_185820_media_and_user_name')
    await migration!.down({ db, payload, req: {} } as unknown as Parameters<
      NonNullable<typeof migration>['down']
    >[0])

    const restored = await db.execute(sql`SELECT "alt" FROM "media"`)
    expect(restored.rows).toEqual([{ alt: 'Paella de marisco' }])
  })
})
