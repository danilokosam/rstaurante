import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  getFeaturedDishes,
  getGalleryImages,
  getHomepage,
  getMenu,
  getSiteSettings,
} from '@/lib/content'
import config from '@/payload.config'

import { resetDatabase } from '../helpers/resetDatabase'
import { makeImage, uploadFile } from '../helpers/uploads'

let payload: Payload

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

async function category(name: string, isVisible = true) {
  return payload.create({ collection: 'menu-categories', data: { name, isVisible } })
}

async function dish(
  categoryId: number,
  name: string,
  data: Partial<{
    availability: 'available' | 'unavailable' | 'hidden'
    isFeatured: boolean
    allergens: ('gluten' | 'milk' | 'eggs')[]
    price: number
  }> = {},
) {
  return payload.create({
    collection: 'dishes',
    data: { name, price: 10, category: categoryId, availability: 'available', ...data },
  })
}

describe('public menu content (RF-WEB-02, RF-MENU-07, US-E1 CA2, US-E2 CA3)', () => {
  it('returns visible categories with their non-hidden dishes, in panel order', async () => {
    const mains = await category('Principales')
    const hidden = await category('Fuera de carta', false)
    const starters = await category('Entrantes')
    await category('Vacía')

    await dish(mains.id, 'Paella', { allergens: ['gluten'], price: 14.5 })
    await dish(mains.id, 'Lubina', { availability: 'unavailable' })
    await dish(mains.id, 'Secreto', { availability: 'hidden' })
    await dish(hidden.id, 'Plato oculto')
    await dish(starters.id, 'Croquetas', { allergens: ['milk', 'eggs', 'gluten'] })

    // Move "Entrantes" before "Principales" (manual order, RF-MENU-02).
    await payload.update({ collection: 'menu-categories', id: starters.id, data: { _order: '!' } })

    const menu = await getMenu('es')

    expect(menu.map((section) => section.name)).toEqual(['Entrantes', 'Principales'])
    expect(menu[1]?.dishes.map((item) => item.name)).toEqual(['Paella', 'Lubina'])
    expect(menu[1]?.dishes[0]).toMatchObject({
      price: 14.5,
      unavailable: false,
      allergens: ['gluten'],
      image: null,
      description: null,
    })
    expect(menu[1]?.dishes[1]?.unavailable).toBe(true)
    expect(menu[0]?.dishes[0]?.allergens).toEqual(['milk', 'eggs', 'gluten'])
  })

  it('shows English translations and falls back to Spanish (US-F5 CA3)', async () => {
    const mains = await category('Principales')
    const paella = await dish(mains.id, 'Paella valenciana')
    await dish(mains.id, 'Fideuá')
    await payload.update({
      collection: 'menu-categories',
      id: mains.id,
      locale: 'en',
      data: { name: 'Mains' },
    })
    await payload.update({
      collection: 'dishes',
      id: paella.id,
      locale: 'en',
      data: { name: 'Valencian paella' },
    })

    const menu = await getMenu('en')

    expect(menu[0]?.name).toBe('Mains')
    expect(menu[0]?.dishes.map((item) => item.name)).toEqual(['Valencian paella', 'Fideuá'])
  })

  it('populates the dish image with its localized alt text', async () => {
    const mains = await category('Principales')
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Paella en la sartén' },
      file: uploadFile(await makeImage('jpeg'), 'paella.jpg', 'image/jpeg'),
    })
    await payload.create({
      collection: 'dishes',
      data: {
        name: 'Paella',
        price: 12,
        category: mains.id,
        image: image.id,
        availability: 'available',
      },
    })

    const [section] = await getMenu('es')

    expect(section?.dishes[0]?.image).toMatchObject({ id: image.id, alt: 'Paella en la sartén' })
    expect(section?.dishes[0]?.image?.sizes?.card?.url).toBeTruthy()
  })

  it('returns an empty menu when there is no content', async () => {
    await expect(getMenu('es')).resolves.toEqual([])
  })
})

describe('featured dishes (US-E4)', () => {
  it('returns up to 6 featured, non-hidden dishes of visible categories in menu order', async () => {
    const desserts = await category('Postres')
    const mains = await category('Principales')
    const hidden = await category('Oculta', false)
    await payload.update({ collection: 'menu-categories', id: mains.id, data: { _order: '!' } })

    await dish(hidden.id, 'Oculto por categoría', { isFeatured: true })
    await dish(mains.id, 'Oculto', { isFeatured: true, availability: 'hidden' })
    await dish(mains.id, 'No destacado')
    for (const name of ['P1', 'P2', 'P3', 'P4']) {
      await dish(mains.id, name, { isFeatured: true })
    }
    await dish(mains.id, 'P5 no disponible', { isFeatured: true, availability: 'unavailable' })
    for (const name of ['D1', 'D2']) {
      await dish(desserts.id, name, { isFeatured: true })
    }

    const featured = await getFeaturedDishes('es')

    expect(featured.map((item) => item.name)).toEqual([
      'P1',
      'P2',
      'P3',
      'P4',
      'P5 no disponible',
      'D1',
    ])
  })

  it('returns no dishes when none is featured (the section is hidden)', async () => {
    const mains = await category('Principales')
    await dish(mains.id, 'Paella')
    await expect(getFeaturedDishes('es')).resolves.toEqual([])
  })
})

describe('site globals for the public site', () => {
  it('reads globals that were never saved without errors', async () => {
    const settings = await getSiteSettings('es')
    const homepage = await getHomepage('es')

    expect(settings.contact?.whatsappNumber ?? null).toBeNull()
    expect(settings.openingHours?.slots ?? []).toEqual([])
    expect(homepage.hero?.title ?? null).toBeNull()
    await expect(getGalleryImages('es')).resolves.toEqual([])
  })

  it('reads localized settings with Spanish fallback and populated images', async () => {
    const logo = await payload.create({
      collection: 'media',
      data: { alt: 'Logotipo' },
      file: uploadFile(await makeImage('png'), 'logo.png', 'image/png'),
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        name: 'Casa Pepe',
        tagline: 'Cocina de mercado',
        logo: logo.id,
        contact: { whatsappNumber: '+34600111222', whatsappMessage: 'Hola' },
        openingHours: { slots: [{ day: 'monday', opens: '13:00', closes: '16:00' }] },
      },
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: { tagline: 'Market cuisine' },
    })

    const es = await getSiteSettings('es')
    const en = await getSiteSettings('en')

    expect(es.name).toBe('Casa Pepe')
    expect(en.tagline).toBe('Market cuisine')
    expect(en.contact?.whatsappMessage).toBe('Hola')
    expect(es.logo).toMatchObject({ id: logo.id, alt: 'Logotipo' })
    expect(es.openingHours?.slots).toHaveLength(1)
  })

  it('returns the gallery images in their order', async () => {
    const first = await payload.create({
      collection: 'media',
      data: { alt: 'Comedor' },
      file: uploadFile(await makeImage('webp'), 'room.webp', 'image/webp'),
    })
    const second = await payload.create({
      collection: 'media',
      data: { alt: 'Terraza' },
      file: uploadFile(await makeImage('webp'), 'terrace.webp', 'image/webp'),
    })
    await payload.updateGlobal({ slug: 'gallery', data: { images: [second.id, first.id] } })

    const images = await getGalleryImages('es')

    expect(images.map((image) => image.alt)).toEqual(['Terraza', 'Comedor'])
  })
})
