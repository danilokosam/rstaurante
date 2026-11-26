import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { connectPayload, createE2EUser, deleteE2EUser, E2E_PASSWORD } from './helpers/adminUser'

const E2E_EMAIL = 'e2e-auth@example.com'

let payload: Payload

test.use({ locale: 'es-ES' })

test.describe('admin authentication (US-A1, US-A2, RF-I18N-05)', () => {
  test.beforeAll(async () => {
    payload = await connectPayload()
    await createE2EUser(payload, E2E_EMAIL)
  })

  test.afterAll(async () => {
    if (payload) {
      await deleteE2EUser(payload, E2E_EMAIL)
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
