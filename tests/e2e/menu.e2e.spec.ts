import { expect, type Locator, type Page, test } from '@playwright/test'
import type { Payload } from 'payload'

import { connectPayload, createE2EUser, deleteE2EUser, loginAsE2EUser } from './helpers/adminUser'

const E2E_EMAIL = 'e2e-menu@example.com'
const SUFFIX = `${Date.now()}`
const CATEGORY_NAME = `Entrantes E2E ${SUFFIX}`
const DISH_NAME = `Croquetas E2E ${SUFFIX}`

let payload: Payload
let createdCategoryId: number | undefined
let createdDishId: number | undefined

async function selectOption(page: Page, field: Locator, optionText: string): Promise<void> {
  await field.locator('.rs__control').click()
  const option = page.locator('.rs__option', { hasText: optionText }).first()
  await expect(option).toBeVisible()
  await option.click()
}

test.use({ locale: 'es-ES' })

test.describe('menu management in /admin (US-E1..E3, US-E5)', () => {
  test.beforeAll(async () => {
    payload = await connectPayload()
    await createE2EUser(payload, E2E_EMAIL)
  })

  test.afterAll(async () => {
    if (!payload) {
      return
    }
    if (createdDishId) {
      await payload.delete({ collection: 'dishes', id: createdDishId }).catch(() => undefined)
    }
    if (createdCategoryId) {
      await payload
        .delete({ collection: 'menu-categories', id: createdCategoryId })
        .catch(() => undefined)
    }
    await deleteE2EUser(payload, E2E_EMAIL)
  })

  test('creates a category and a dish with multi-select allergens and updates availability', async ({
    page,
  }) => {
    await loginAsE2EUser(page, E2E_EMAIL)

    // 1. Create a menu category.
    await page.goto('/admin/collections/menu-categories/create?locale=es')
    await page.locator('#field-name').fill(CATEGORY_NAME)
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText(/./, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/admin\/collections\/menu-categories\/\d+/)

    const categories = await payload.find({
      collection: 'menu-categories',
      where: { name: { equals: CATEGORY_NAME } },
      limit: 1,
    })
    createdCategoryId = categories.docs[0]?.id
    expect(createdCategoryId).toBeDefined()

    // 2. Create a dish assigned to that category with price and allergens multi-select.
    await page.goto('/admin/collections/dishes/create?locale=es')
    await page.locator('#field-name').fill(DISH_NAME)
    await page.locator('#field-price').fill('9.50')

    await selectOption(page, page.locator('#field-category'), CATEGORY_NAME)
    await selectOption(page, page.locator('#field-allergens'), 'Cereales con gluten')
    await selectOption(page, page.locator('#field-allergens'), 'Huevos')

    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText(/./, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/admin\/collections\/dishes\/\d+/)

    // 3. Change availability to "No disponible" and save again.
    await selectOption(page, page.locator('#field-availability'), 'No disponible')
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/dishes/') &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      page.locator('#action-save').click(),
    ])
    await expect(page.locator('#field-availability')).toContainText('No disponible')

    const dishes = await payload.find({
      collection: 'dishes',
      where: { name: { equals: DISH_NAME } },
      depth: 0,
      limit: 1,
    })
    const savedDish = dishes.docs[0]
    expect(savedDish).toBeDefined()
    createdDishId = savedDish?.id
    expect(savedDish?.price).toBe(9.5)
    expect(savedDish?.category).toBe(createdCategoryId)
    expect(savedDish?.availability).toBe('unavailable')
    expect(savedDish?.allergens).toEqual(['gluten', 'eggs'])

    // 4. Change availability from the list view with bulk edit (US-E3 CA3).
    await page.goto('/admin/collections/dishes?locale=es')
    const row = page.locator('tr', { hasText: DISH_NAME })
    await row.locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Editar', exact: true }).click()
    const drawer = page.locator('.edit-many__main')
    await selectOption(page, drawer.locator('.field-select'), 'Disponibilidad')
    await selectOption(page, drawer.locator('#field-availability'), 'Oculto')
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/dishes') &&
          response.request().method() === 'PATCH' &&
          response.ok(),
      ),
      drawer.locator('.edit-many__save').click(),
    ])

    const afterBulkEdit = await payload.findByID({
      collection: 'dishes',
      id: savedDish!.id,
      depth: 0,
    })
    expect(afterBulkEdit.availability).toBe('hidden')
  })
})
