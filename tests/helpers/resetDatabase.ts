import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { migrations } from '@/migrations'

import { resolveTestDatabaseUrl } from './testDatabase'

/**
 * Drops every table of the test database and re-applies the versioned
 * migrations, as on a fresh production database.
 *
 * Migrations are passed explicitly (already transpiled by Vitest) instead of
 * letting Payload import the .ts files itself, which bypasses the test runner.
 */
export async function resetDatabase(payload: Payload): Promise<void> {
  // Re-check the guard right before destroying data.
  resolveTestDatabaseUrl(process.env)
  if (process.env.DATABASE_URL !== process.env.DATABASE_URL_TEST) {
    throw new Error('Refusing to reset a database that is not DATABASE_URL_TEST')
  }

  // `payload.db` is typed as the generic adapter; this project always uses the
  // Postgres adapter (see payload.config.ts), so the narrowing is safe.
  const db = payload.db as unknown as PostgresAdapter
  await db.drizzle.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`)

  // The generic `migrate` signature types migration args as `unknown`, while
  // generated Postgres migrations declare `MigrateUpArgs`; the runtime shape is identical.
  type GenericMigrations = NonNullable<Parameters<Payload['db']['migrate']>[0]>['migrations']
  await payload.db.migrate({ migrations: migrations as unknown as GenericMigrations })
}
