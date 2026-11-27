import { expect, test } from '@playwright/test'
import type { Payload } from 'payload'

import { connectPayload, createE2EUser, deleteE2EUser, loginAsE2EUser } from './helpers/adminUser'
import {
  adminApi,
  expectNoHorizontalScroll,
  expectNoSeriousA11yViolations,
  expectPublished,
} from './helpers/publicSite'

const E2E_EMAIL = 'e2e-public-menu@example.com'
const RUN = Date.now()
const CATEGORY = `Entrantes E2E ${RUN}`
const HIDDEN_CATEGORY = `Oculta E2E ${RUN}`
const CROQUETAS = `Croquetas E2E ${RUN}`
const CROQUETTES = `Croquettes E2E ${RUN}`
const LUBINA = `Lubina E2E ${RUN}`
const SECRETO = `Secreto E2E ${RUN}`
const ENSALADA = `Ensalada oculta E2E ${RUN}`

type Created = { doc: { id: number } }

let payload: Payload
const categoryIds: number[] = []
const dishIds: number[] = []

test.describe('public home page and menu (RF-WEB-01, RF-WEB-02, US-E3..E5, US-F1, US-F4)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    payload = await connectPayload()
    await createE2EUser(payload, E2E_EMAIL)
  })

  test.afterAll(async () => {
    if (!payload) {
      return
    }
    for (const id of dishIds) {
      await payload.delete({ collection: 'dishes', id }).catch(() => undefined)
    }
    for (const id of categoryIds) {
      await payload.delete({ collection: 'menu-categories', id }).catch(() => undefined)
    }
    await deleteE2EUser(payload, E2E_EMAIL)
  })

  test('shows visible dishes with prices, availability and allergens in both languages', async ({
    page,
  }) => {
    await loginAsE2EUser(page, E2E_EMAIL)

    const createCategory = async (name: string, isVisible: boolean) => {
      const { doc } = await adminApi<Created>(page, 'POST', '/api/menu-categories?locale=es', {
        name,
        isVisible,
      })
      categoryIds.push(doc.id)
      return doc.id
    }
    const createDish = async (data: Record<string, unknown>) => {
      const { doc } = await adminApi<Created>(page, 'POST', '/api/dishes?locale=es', data)
      dishIds.push(doc.id)
      return doc.id
    }

    const visible = await createCategory(CATEGORY, true)
    const hidden = await createCategory(HIDDEN_CATEGORY, false)
    const croquetas = await createDish({
      name: CROQUETAS,
      price: 9.5,
      category: visible,
      allergens: ['gluten', 'milk'],
      isFeatured: true,
    })
    await createDish({ name: LUBINA, price: 18, category: visible, availability: 'unavailable' })
    await createDish({ name: SECRETO, price: 5, category: visible, availability: 'hidden' })
    await createDish({ name: ENSALADA, price: 7, category: hidden })
    await adminApi(page, 'PATCH', `/api/dishes/${croquetas}?locale=en`, { name: CROQUETTES })

    await expectPublished(page, '/es/menu', async () => {
      await expect(page.getByRole('heading', { name: CROQUETAS })).toBeVisible({
        timeout: 1_000,
      })
    })

    const croquetasItem = page.getByRole('listitem').filter({ hasText: CROQUETAS })
    await expect(page.getByRole('heading', { level: 1, name: 'Carta' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: CATEGORY })).toBeVisible()
    await expect(croquetasItem).toContainText(/9,50\s€/)
    await expect(croquetasItem).toContainText('Alérgenos: Cereales con gluten, Leche')
    await expect(page.getByRole('listitem').filter({ hasText: LUBINA })).toContainText(
      'No disponible',
    )
    await expect(page.getByText(SECRETO)).toHaveCount(0)
    await expect(page.getByText(ENSALADA)).toHaveCount(0)
    await expect(page.getByText(HIDDEN_CATEGORY)).toHaveCount(0)
    await expect(
      page.getByText('Si tienes alguna alergia o intolerancia, consulta al personal.'),
    ).toBeVisible()

    await page.goto('/en/menu')
    const croquettesItem = page.getByRole('listitem').filter({ hasText: CROQUETTES })
    await expect(page.getByRole('heading', { level: 1, name: 'Menu' })).toBeVisible()
    await expect(croquettesItem).toContainText('€9.50')
    await expect(croquettesItem).toContainText('Allergens: Cereals containing gluten, Milk')
    // Not translated: falls back to Spanish (US-F5 CA3).
    await expect(page.getByRole('listitem').filter({ hasText: LUBINA })).toContainText(
      'Unavailable',
    )

    // Featured dish on the home page (US-E4).
    await page.goto('/es')
    const featured = page.getByRole('region', { name: 'Nuestros destacados' })
    await expect(featured.getByText(CROQUETAS)).toBeVisible()
    await expect(featured.getByText(LUBINA)).toHaveCount(0)
  })

  test('publishes a price saved in /admin on the menu (US-F4, RF-PUB-01)', async ({ page }) => {
    await loginAsE2EUser(page, E2E_EMAIL)
    const croquetas = dishIds[0]
    expect(croquetas).toBeDefined()

    await page.goto(`/admin/collections/dishes/${croquetas}?locale=es`)
    await page.locator('#field-price').fill('11.25')
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/dishes/${croquetas}`) &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      page.locator('#action-save').click(),
    ])

    await expectPublished(page, '/es/menu', async () => {
      await expect(page.getByRole('listitem').filter({ hasText: CROQUETAS })).toContainText(
        /11,25\s€/,
        { timeout: 1_000 },
      )
    })
  })

  test('fits a 360 px screen and has no serious accessibility violations', async ({ page }) => {
    for (const path of ['/es', '/es/menu', '/en/menu']) {
      await page.setViewportSize({ width: 360, height: 740 })
      await page.goto(path)
      await expectNoHorizontalScroll(page)
      await page.setViewportSize({ width: 1280, height: 800 })
      await expectNoSeriousA11yViolations(page)
    }
  })
})
