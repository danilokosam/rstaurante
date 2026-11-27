import type { Page } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../../src/payload.config'

export const E2E_PASSWORD = 'e2e-correct-horse-battery-staple'
const LOCAL_DATABASE_HOSTS = ['localhost', '127.0.0.1', '::1']

/**
 * The E2E suite creates an admin with a password that lives in the repository,
 * so it must never run against a remote (staging/production) database.
 */
export function assertLocalDatabase(databaseUrl: string | undefined): void {
  const host = databaseUrl ? new URL(databaseUrl).hostname.replace(/^\[|\]$/g, '') : ''
  if (!LOCAL_DATABASE_HOSTS.includes(host)) {
    throw new Error(
      `Refusing to run E2E tests against a non-local database host: "${host || '(unset)'}"`,
    )
  }
}

/**
 * Payload instance shared by every E2E file of a worker. `getPayload` caches
 * one instance per process and `payload.destroy()` empties its database
 * adapter without removing it from that cache, so files must not destroy it:
 * the next file of the same worker (CI runs a single worker) would get a broken
 * instance. The connection is closed when the worker process exits.
 */
export async function connectPayload(): Promise<Payload> {
  assertLocalDatabase(process.env.DATABASE_URL)
  return getPayload({ config: await config })
}

/**
 * E2E files run in parallel locally: each one uses its own user so that one
 * file's cleanup never logs out another file's test.
 */
export async function deleteE2EUser(payload: Payload, email: string): Promise<void> {
  // Release the documents this user left open in the admin panel: deleting the
  // user directly would leave locks without a user until they expire (5 min),
  // and the panel cannot render a locked document whose owner is gone.
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    depth: 0,
    pagination: false,
  })
  const ids = docs.map((user) => user.id)
  if (ids.length) {
    await payload.delete({
      collection: 'payload-locked-documents',
      where: { 'user.value': { in: ids } },
    })
  }
  // Uses the adapter directly: the "last user" hook would otherwise block the
  // cleanup on a database where the E2E admin is the only user.
  await payload.db.deleteMany({
    collection: 'users',
    where: { email: { equals: email } },
  })
}

export async function createE2EUser(payload: Payload, email: string): Promise<void> {
  await deleteE2EUser(payload, email)
  await payload.create({
    collection: 'users',
    data: { email, password: E2E_PASSWORD },
  })
}

export async function loginAsE2EUser(page: Page, email: string): Promise<void> {
  await page.goto('/admin/login')
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(E2E_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/admin\/?$/)
}
