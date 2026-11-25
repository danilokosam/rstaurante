import { expect, test } from '@playwright/test'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'

const E2E_EMAIL = 'e2e-admin@example.com'
const E2E_PASSWORD = 'e2e-correct-horse-battery-staple'

let payload: Payload

test.use({ locale: 'es-ES' })

test.describe('admin authentication (US-A1, US-A2, RF-I18N-05)', () => {
  test.beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: E2E_EMAIL } },
      limit: 1,
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: E2E_EMAIL,
          password: E2E_PASSWORD,
        },
      })
    }
  })

  test.afterAll(async () => {
    await payload?.destroy()
  })

  test('redirects unauthenticated visitors from /admin to /admin/login', async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('logs in with valid credentials, shows Spanish admin UI, and logs out cleanly', async ({
    page,
  }) => {
    await page.goto('/admin/login')

    await page.locator('input[name="email"]').fill(E2E_EMAIL)
    await page.locator('input[name="password"]').fill(E2E_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin\/?$/)

    // Spanish is the default admin language (RF-I18N-05).
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    // Switching locale via .localizer-button also switches the admin UI language.
    const localizerButton = page.locator('.localizer-button:not([aria-label="invisible"])')
    await localizerButton.click()
    await page.locator('.localizer__locale-code[data-locale="en"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10_000 })
    await expect(localizerButton).toHaveAttribute('data-locale', 'en')

    await localizerButton.click()
    await page.locator('.localizer__locale-code[data-locale="es"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es', { timeout: 10_000 })

    await page.goto('/admin/logout')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 })

    // Revisiting /admin must require authentication again.
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
