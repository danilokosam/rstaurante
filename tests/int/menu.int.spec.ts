import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { ALLERGEN_CODES } from '@/lib/allergens'
import config from '@/payload.config'

import { rejectionMessage } from '../helpers/errors'
import { resetDatabase } from '../helpers/resetDatabase'
import { makeImage, uploadFile } from '../helpers/uploads'

let payload: Payload

async function createUser(email = 'admin@example.com') {
  return payload.create({
    collection: 'users',
    data: { email, password: 'correct-horse-battery-staple' },
  })
}

async function createCategory(
  data: { name?: string; description?: string; isVisible?: boolean } = {},
  locale: 'es' | 'en' = 'es',
) {
  return payload.create({
    collection: 'menu-categories',
    locale,
    data: {
      name: 'Entrantes',
      ...data,
    },
  })
}

async function createDish(
  categoryId: number,
  data: Partial<{
    name: string
    description: string
    price: number
    image: number
    availability: 'available' | 'unavailable' | 'hidden'
    isFeatured: boolean
    allergens: (typeof ALLERGEN_CODES)[number][]
  }> = {},
  locale: 'es' | 'en' = 'es',
) {
  return payload.create({
    collection: 'dishes',
    locale,
    data: {
      name: 'Croquetas caseras',
      price: 9.5,
      category: categoryId,
      availability: 'available',
      ...data,
    },
  })
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

beforeEach(async () => {
  await resetDatabase(payload)
})

afterEach(async () => {
  await payload.delete({ collection: 'media', where: {} })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('menu access control and visibility (RF-MENU-07, US-E1 CA3, US-E3 CA2)', () => {
  it('blocks anonymous writes on menu-categories and dishes', async () => {
    const category = await createCategory()
    const dish = await createDish(category.id)

    await expect(
      payload.create({
        collection: 'menu-categories',
        data: { name: 'Postres' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'menu-categories',
        id: category.id,
        data: { name: 'Hackeado' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({
        collection: 'menu-categories',
        id: category.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.create({
        collection: 'dishes',
        data: { name: 'Tarta', price: 6, category: category.id, availability: 'available' },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        collection: 'dishes',
        id: dish.id,
        data: { price: 0 },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({
        collection: 'dishes',
        id: dish.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('hides invisible categories and hidden or hidden-category dishes from anonymous readers', async () => {
    const user = await createUser()
    const visibleCat = await createCategory({ name: 'Principales', isVisible: true })
    const hiddenCat = await createCategory({ name: 'Borrador', isVisible: false })

    const availableDish = await createDish(visibleCat.id, {
      name: 'Paella',
      availability: 'available',
    })
    const unavailableDish = await createDish(visibleCat.id, {
      name: 'Lubina',
      availability: 'unavailable',
    })
    const hiddenDish = await createDish(visibleCat.id, {
      name: 'Secreto',
      availability: 'hidden',
    })
    const dishInHiddenCat = await createDish(hiddenCat.id, {
      name: 'Ensalada oculta',
      availability: 'available',
    })

    const anonCats = await payload.find({
      collection: 'menu-categories',
      overrideAccess: false,
    })
    expect(anonCats.docs.map((c) => c.id)).toEqual([visibleCat.id])

    await expect(
      payload.findByID({
        collection: 'menu-categories',
        id: hiddenCat.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const anonDishes = await payload.find({
      collection: 'dishes',
      overrideAccess: false,
    })
    expect(anonDishes.docs.map((d) => d.id)).toEqual([availableDish.id, unavailableDish.id])

    await expect(
      payload.findByID({
        collection: 'dishes',
        id: hiddenDish.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    await expect(
      payload.findByID({
        collection: 'dishes',
        id: dishInHiddenCat.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    // Hiding a previously visible category immediately hides its dishes from anonymous reads.
    await payload.update({
      collection: 'menu-categories',
      id: visibleCat.id,
      data: { isVisible: false },
      user,
      overrideAccess: false,
    })

    const anonDishesAfterHide = await payload.find({
      collection: 'dishes',
      overrideAccess: false,
    })
    expect(anonDishesAfterHide.docs).toHaveLength(0)

    // Authenticated users still see every category and dish.
    const adminCats = await payload.find({
      collection: 'menu-categories',
      user,
      overrideAccess: false,
    })
    const adminDishes = await payload.find({
      collection: 'dishes',
      user,
      overrideAccess: false,
    })
    expect(adminCats.totalDocs).toBe(2)
    expect(adminDishes.totalDocs).toBe(4)
  })
})

describe('menu-categories (RF-MENU-01, RF-MENU-02, RF-MENU-06, US-E1)', () => {
  it('requires name in Spanish, keeps English optional with fallback, and enforces max lengths', async () => {
    await expect(createCategory({ name: '' })).rejects.toThrow()
    await expect(createCategory({ name: 'a'.repeat(81) })).rejects.toThrow()
    await expect(createCategory({ name: 'Ok', description: 'a'.repeat(301) })).rejects.toThrow()

    const created = await createCategory({
      name: 'Entrantes',
      description: 'Para compartir.',
    })
    expect(created.isVisible).toBe(true)

    // Updating English description without translating name is allowed (US-C3).
    await payload.update({
      collection: 'menu-categories',
      id: created.id,
      locale: 'en',
      data: { description: 'For sharing.' },
    })

    const english = await payload.findByID({
      collection: 'menu-categories',
      id: created.id,
      locale: 'en',
    })
    expect(english.name).toBe('Entrantes')
    expect(english.description).toBe('For sharing.')
  })

  it('enforces unique category names per locale', async () => {
    const first = await createCategory({ name: 'Entrantes' })
    await expect(createCategory({ name: 'Entrantes' })).rejects.toThrow()

    const second = await createCategory({ name: 'Postres' })
    await payload.update({
      collection: 'menu-categories',
      id: first.id,
      locale: 'en',
      data: { name: 'Starters' },
    })
    await expect(
      payload.update({
        collection: 'menu-categories',
        id: second.id,
        locale: 'en',
        data: { name: 'Starters' },
      }),
    ).rejects.toThrow()
  })

  it('maintains manual order via Payload orderable (RF-MENU-02)', async () => {
    const first = await createCategory({ name: 'Primero' })
    const second = await createCategory({ name: 'Segundo' })
    const third = await createCategory({ name: 'Tercero' })

    const initial = await payload.find({ collection: 'menu-categories' })
    expect(initial.docs.map((c) => c.id)).toEqual([first.id, second.id, third.id])
    expect(first._order).toBeTruthy()

    // Move the third category before the first one using lexicographical order key.
    await payload.update({
      collection: 'menu-categories',
      id: third.id,
      data: { _order: '!' },
    })

    const reordered = await payload.find({ collection: 'menu-categories' })
    expect(reordered.docs.map((c) => c.id)).toEqual([third.id, first.id, second.id])
  })

  it('prevents deleting a category with dishes and allows it once empty (RF-MENU-06, US-E1 CA4)', async () => {
    const starters = await createCategory({ name: 'Entrantes' })
    const mains = await createCategory({ name: 'Principales' })
    const dish = await createDish(starters.id, { name: 'Ensaladilla' })

    const messageEs = await rejectionMessage(
      payload.delete({ collection: 'menu-categories', id: starters.id }),
    )
    expect(messageEs).toContain('contiene platos')

    await payload.update({
      collection: 'dishes',
      id: dish.id,
      data: { category: mains.id },
    })

    await expect(
      payload.delete({ collection: 'menu-categories', id: starters.id }),
    ).resolves.toMatchObject({ id: starters.id })
  })
})

describe('dishes (RF-MENU-02..05, RF-MENU-08, US-E2..E5)', () => {
  it('validates required fields, lengths, price bounds and max 2 decimals', async () => {
    const category = await createCategory()

    await expect(createDish(category.id, { name: '' })).rejects.toThrow()
    await expect(createDish(category.id, { name: 'a'.repeat(121) })).rejects.toThrow()
    await expect(createDish(category.id, { description: 'a'.repeat(501) })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'dishes',
        data: { name: 'Sin categoría', price: 10 } as never,
      }),
    ).rejects.toThrow()

    await expect(createDish(category.id, { price: -0.01 })).rejects.toThrow()
    await expect(createDish(category.id, { price: 10000 })).rejects.toThrow()
    const decimalMessage = await rejectionMessage(createDish(category.id, { price: 12.345 }))
    expect(decimalMessage).toContain('2 decimales')

    const freeDish = await payload.create({
      collection: 'dishes',
      data: { name: 'Pan', price: 0, category: category.id } as never,
    })
    const maxDish = await createDish(category.id, { name: 'Mariscada', price: 9999.99 })
    expect(freeDish.price).toBe(0)
    expect(maxDish.price).toBe(9999.99)
    expect(freeDish.availability).toBe('available')
    expect(freeDish.isFeatured).toBe(false)
  })

  it('stores the 14 EU allergens in a multi-select field and rejects invalid or duplicate codes (RF-MENU-08, US-E5)', async () => {
    const category = await createCategory()

    const withAllergens = await createDish(category.id, {
      name: 'Paella mixta',
      allergens: ['gluten', 'crustaceans', 'molluscs'],
    })
    expect(withAllergens.allergens).toEqual(['gluten', 'crustaceans', 'molluscs'])

    const withAll14 = await createDish(category.id, {
      name: 'Degustación',
      allergens: [...ALLERGEN_CODES],
    })
    expect(withAll14.allergens).toEqual([...ALLERGEN_CODES])

    // Allergens are shared across locales (ADR-0011).
    const inEnglish = await payload.findByID({
      collection: 'dishes',
      id: withAllergens.id,
      locale: 'en',
    })
    expect(inEnglish.allergens).toEqual(['gluten', 'crustaceans', 'molluscs'])

    await expect(
      createDish(category.id, {
        allergens: ['garlic' as never],
      }),
    ).rejects.toThrow()

    await expect(
      createDish(category.id, {
        allergens: ['gluten', 'gluten'],
      }),
    ).rejects.toThrow()
  })

  it('rejects unknown availability values and supports featured flag', async () => {
    const category = await createCategory()
    const featured = await createDish(category.id, {
      name: 'Solomillo',
      isFeatured: true,
      availability: 'unavailable',
    })
    expect(featured.isFeatured).toBe(true)
    expect(featured.availability).toBe('unavailable')

    await expect(createDish(category.id, { availability: 'archived' as never })).rejects.toThrow()
  })

  it('translates name and description optionally to English with Spanish fallback', async () => {
    const category = await createCategory()
    const dish = await createDish(category.id, {
      name: 'Gazpacho andaluz',
      description: 'Tomate, pepino y pimiento.',
    })

    await payload.update({
      collection: 'dishes',
      id: dish.id,
      locale: 'en',
      data: { name: 'Andalusian gazpacho' },
    })

    const english = await payload.findByID({
      collection: 'dishes',
      id: dish.id,
      locale: 'en',
    })
    expect(english.name).toBe('Andalusian gazpacho')
    expect(english.description).toBe('Tomate, pepino y pimiento.')
  })

  it('clears image to null when a referenced media item is deleted (US-D2 CA2)', async () => {
    const category = await createCategory()
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Foto de plato' },
      file: uploadFile(await makeImage('jpeg'), 'dish.jpg', 'image/jpeg'),
    })
    const dish = await createDish(category.id, { image: image.id })

    await payload.delete({ collection: 'media', id: image.id })

    const updated = await payload.findByID({ collection: 'dishes', id: dish.id, depth: 0 })
    expect(updated.image ?? null).toBeNull()
  })

  it('maintains manual dish order via Payload orderable (RF-MENU-02)', async () => {
    const category = await createCategory()
    const first = await createDish(category.id, { name: 'Plato 1' })
    const second = await createDish(category.id, { name: 'Plato 2' })

    const initial = await payload.find({ collection: 'dishes' })
    expect(initial.docs.map((d) => d.id)).toEqual([first.id, second.id])

    await payload.update({
      collection: 'dishes',
      id: second.id,
      data: { _order: '!' },
    })

    const reordered = await payload.find({ collection: 'dishes' })
    expect(reordered.docs.map((d) => d.id)).toEqual([second.id, first.id])
  })
})
