import { expect, test } from '@playwright/test'

test.describe('public site routing', () => {
  test('redirects the root URL to the default locale (Spanish)', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/es$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })

  test('serves the English version', async ({ page }) => {
    const response = await page.goto('/en')

    expect(response?.status()).toBe(200)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('returns 404 for an unsupported locale', async ({ page }) => {
    const response = await page.goto('/fr')

    expect(response?.status()).toBe(404)
  })
})

test.describe('admin panel', () => {
  test('is reachable and asks for authentication', async ({ page }) => {
    const response = await page.goto('/admin')

    expect(response?.status()).toBeLessThan(400)
    // Either the first-user form (empty database) or the login form.
    await expect(page).toHaveURL(/\/admin\/(login|create-first-user)/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })
})
