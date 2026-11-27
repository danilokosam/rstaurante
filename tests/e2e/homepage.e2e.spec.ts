import { expect, type Page, test } from '@playwright/test'
import type { Payload } from 'payload'

import { connectPayload, createE2EUser, deleteE2EUser, loginAsE2EUser } from './helpers/adminUser'

const E2E_EMAIL = 'e2e-homepage@example.com'
const SPANISH_TITLE = `Cocina de mercado E2E ${Date.now()}`
const ENGLISH_TITLE = `Market cuisine E2E ${Date.now()}`

let payload: Payload
let previousVersionId: string | undefined

async function saveHeroTitle(page: Page, locale: 'es' | 'en', title: string): Promise<void> {
  await page.goto(`/admin/globals/homepage?locale=${locale}`)
  const titleInput = page.locator('#field-hero__title')
  await titleInput.fill(title)
  await page.locator('#action-save').click()
  await expect(page.locator('.payload-toast-container')).toContainText(/./, { timeout: 10_000 })
  await expect(titleInput).toHaveValue(title)
}

test.use({ locale: 'es-ES' })

test.describe('home page content in two languages (US-C1, US-C3)', () => {
  test.beforeAll(async () => {
    payload = await connectPayload()
    await createE2EUser(payload, E2E_EMAIL)
    // Remember the current content of the development database to restore it.
    const versions = await payload.findGlobalVersions({
      slug: 'homepage',
      sort: '-updatedAt',
      limit: 1,
    })
    previousVersionId = versions.docs[0] ? String(versions.docs[0].id) : undefined
  })

  test.afterAll(async () => {
    if (!payload) {
      return
    }
    if (previousVersionId) {
      await payload.restoreGlobalVersion({ slug: 'homepage', id: previousVersionId })
    }
    await deleteE2EUser(payload, E2E_EMAIL)
  })

  test('edits the hero title in Spanish and in English from /admin', async ({ page }) => {
    await loginAsE2EUser(page, E2E_EMAIL)

    await saveHeroTitle(page, 'es', SPANISH_TITLE)
    await saveHeroTitle(page, 'en', ENGLISH_TITLE)

    // Each language keeps its own title.
    await page.goto('/admin/globals/homepage?locale=es')
    await expect(page.locator('#field-hero__title')).toHaveValue(SPANISH_TITLE)

    const spanish = await payload.findGlobal({ slug: 'homepage', locale: 'es' })
    const english = await payload.findGlobal({ slug: 'homepage', locale: 'en' })
    expect(spanish.hero?.title).toBe(SPANISH_TITLE)
    expect(english.hero?.title).toBe(ENGLISH_TITLE)
  })
})
