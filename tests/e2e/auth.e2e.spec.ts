import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'

const E2E_EMAIL = 'e2e-admin@example.com'
const E2E_PASSWORD = 'e2e-correct-horse-battery-staple'
const LOCAL_DATABASE_HOSTS = ['localhost', '127.0.0.1', '::1']

let payload: Payload

/**
 * The E2E suite creates an admin with a password that lives in the repository,
 * so it must never run against a remote (staging/production) database.
 */
function assertLocalDatabase(databaseUrl: string | undefined): void {
  const host = databaseUrl ? new URL(databaseUrl).hostname.replace(/^\[|\]$/g, '') : ''
  if (!LOCAL_DATABASE_HOSTS.includes(host)) {
    throw new Error(
      `Refusing to run E2E auth tests against a non-local database host: "${host || '(unset)'}"`,
    )
  }
}

async function deleteE2EUser(): Promise<void> {
  // Uses the adapter directly: the "last user" hook would otherwise block the
  // cleanup on a database where the E2E admin is the only user.
  await payload.db.deleteMany({
    collection: 'users',
    where: { email: { equals: E2E_EMAIL } },
  })
}

test.use({ locale: 'es-ES' })

test.describe('admin authentication (US-A1, US-A2, RF-I18N-05)', () => {
  test.beforeAll(async () => {
    assertLocalDatabase(process.env.DATABASE_URL)
    payload = await getPayload({ config: await config })

    await deleteE2EUser()
    await payload.create({
      collection: 'users',
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
    })
  })

  test.afterAll(async () => {
    if (payload) {
      await deleteE2EUser()
      await payload.destroy()
    }
  })

  test('redirects unauthenticated visitors from /admin to /admin/login', async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('logs in, shows the Spanish admin UI, and logout invalidates the session server-side', async ({
    page,
    baseURL,
  }) => {
    await page.goto('/admin/login')

    await page.locator('input[name="email"]').fill(E2E_EMAIL)
    await page.locator('input[name="password"]').fill(E2E_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin\/?$/)

    // Spanish is the default admin language (RF-I18N-05).
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    // Keep a copy of the session cookie to replay it after logging out.
    const cookieHeader = (await page.context().cookies())
      .map(({ name, value }) => `${name}=${value}`)
      .join('; ')
    const fetchMe = () =>
      page.request.get('/api/users/me', {
        headers: { Cookie: cookieHeader, Origin: baseURL ?? '' },
      })

    const beforeLogout = await (await fetchMe()).json()
    expect(beforeLogout.user?.email).toBe(E2E_EMAIL)

    await page.goto('/admin/logout')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 })

    // Revisiting /admin must require authentication again (US-A2 CA1).
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)

    // The old cookie is rejected by the API (US-A2 CA2).
    const afterLogout = await (await fetchMe()).json()
    expect(afterLogout.user).toBeNull()
  })
})
