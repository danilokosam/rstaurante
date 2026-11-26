import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { rejectionMessage } from '../helpers/errors'
import { resetDatabase } from '../helpers/resetDatabase'
import { makeImage, uploadFile } from '../helpers/uploads'

let payload: Payload

const BASE_SETTINGS = { name: 'Casa Pepe' }
const BASE_HOMEPAGE = { hero: { title: 'Cocina de mercado' } }

function updateSettings(data: Record<string, unknown>, locale: 'es' | 'en' = 'es') {
  return payload.updateGlobal({
    slug: 'site-settings',
    data: { ...BASE_SETTINGS, ...data },
    locale,
  })
}

function updateHomepage(data: Record<string, unknown>, locale: 'es' | 'en' = 'es') {
  return payload.updateGlobal({
    slug: 'homepage',
    data: { ...BASE_HOMEPAGE, ...data },
    locale,
  })
}

async function createImage(alt = 'Foto') {
  return payload.create({
    collection: 'media',
    data: { alt },
    file: uploadFile(await makeImage('jpeg', 600, 400), 'photo.jpg', 'image/jpeg'),
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

describe('access control (ADR-0006)', () => {
  it.each(['site-settings', 'homepage', 'gallery'] as const)(
    'lets anonymous visitors read %s but not update it',
    async (slug) => {
      await expect(payload.findGlobal({ slug, overrideAccess: false })).resolves.toBeDefined()

      await expect(
        payload.updateGlobal({ slug, data: {}, overrideAccess: false }),
      ).rejects.toThrow()
    },
  )

  it('lets an authenticated user update the globals', async () => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'admin@example.com', password: 'correct-horse-battery-staple' },
    })

    const settings = await payload.updateGlobal({
      slug: 'site-settings',
      data: BASE_SETTINGS,
      user,
      overrideAccess: false,
    })

    expect(settings.name).toBe('Casa Pepe')
  })
})

describe('site-settings (RF-SITE-01..06, US-B1..B5)', () => {
  it('requires the restaurant name and limits it to 80 characters', async () => {
    await expect(updateSettings({ name: '' })).rejects.toThrow()
    await expect(updateSettings({ name: 'a'.repeat(81) })).rejects.toThrow()
  })

  it('stores the general, contact, location and SEO information', async () => {
    const logo = await createImage('Logo')

    const saved = await updateSettings({
      tagline: 'Cocina de mercado',
      description: 'Restaurante familiar desde 1985.',
      logo: logo.id,
      contact: {
        phone: '+34 91 123 45 67',
        email: 'hola@casapepe.example',
        whatsappNumber: '+34600111222',
        whatsappMessage: 'Hola, quiero reservar',
      },
      location: {
        street: 'Calle Mayor 1',
        postalCode: '28013',
        city: 'Madrid',
        region: 'Madrid',
        country: 'España',
        mapsUrl: 'https://maps.app.goo.gl/AbCdEf123',
      },
      seo: { title: 'Casa Pepe', description: 'Cocina de mercado en Madrid', image: logo.id },
    })

    expect(saved).toMatchObject({
      tagline: 'Cocina de mercado',
      contact: { whatsappNumber: '+34600111222' },
      location: { city: 'Madrid' },
      seo: { title: 'Casa Pepe' },
    })
  })

  it.each([
    [
      'WhatsApp number',
      { contact: { whatsappNumber: '600 111 222' } },
      'El número de WhatsApp debe estar en formato internacional',
    ],
    ['phone', { contact: { phone: 'llámanos' } }, 'Teléfono no válido'],
    [
      'Maps URL',
      { location: { mapsUrl: 'https://maps.evil.com/x' } },
      'enlace https de Google Maps',
    ],
    [
      'social link URL',
      { socialLinks: [{ platform: 'instagram', url: 'http://instagram.com/casapepe' }] },
      'La URL debe empezar por https://',
    ],
    [
      'opening time format',
      { openingHours: { slots: [{ day: 'monday', opens: '9:00', closes: '16:00' }] } },
      'La hora debe tener el formato HH:MM',
    ],
    [
      'identical opening and closing times',
      { openingHours: { slots: [{ day: 'monday', opens: '13:00', closes: '13:00' }] } },
      'no pueden ser iguales',
    ],
  ])('rejects an invalid %s with a clear Spanish message', async (_label, data, message) => {
    expect(await rejectionMessage(updateSettings(data))).toContain(message)
  })

  it('rejects an invalid email', async () => {
    await expect(updateSettings({ contact: { email: 'no-es-un-email' } })).rejects.toThrow()
  })

  it('accepts several slots per day and slots that cross midnight (US-B4)', async () => {
    const slots = [
      { day: 'friday', opens: '13:00', closes: '16:00' },
      { day: 'friday', opens: '20:00', closes: '01:00' },
    ]

    const saved = await updateSettings({ openingHours: { slots, note: 'Cerrado los festivos' } })

    expect(saved.openingHours?.slots).toMatchObject(slots)
    expect(saved.openingHours?.note).toBe('Cerrado los festivos')
  })

  it('rejects an unknown weekday', async () => {
    await expect(
      updateSettings({
        openingHours: { slots: [{ day: 'funday', opens: '13:00', closes: '16:00' }] },
      }),
    ).rejects.toThrow()
  })

  it('keeps social links in order, from a closed list, up to 10 (US-B5)', async () => {
    const links = [
      { platform: 'tripadvisor', url: 'https://www.tripadvisor.es/casapepe' },
      { platform: 'instagram', url: 'https://www.instagram.com/casapepe' },
    ]

    const saved = await updateSettings({ socialLinks: links })
    expect(saved.socialLinks).toMatchObject(links)

    await expect(
      updateSettings({ socialLinks: [{ platform: 'myspace', url: 'https://myspace.com/x' }] }),
    ).rejects.toThrow()

    const eleven = Array.from({ length: 11 }, () => links[1])
    await expect(updateSettings({ socialLinks: eleven })).rejects.toThrow()
  })

  it('limits the SEO title to 60 and the SEO description to 160 characters', async () => {
    await expect(updateSettings({ seo: { title: 'a'.repeat(61) } })).rejects.toThrow()
    await expect(updateSettings({ seo: { description: 'a'.repeat(161) } })).rejects.toThrow()
  })

  it('translates texts to English optionally, falling back to Spanish (US-C3)', async () => {
    await updateSettings({ tagline: 'Cocina de mercado', contact: { whatsappMessage: 'Hola' } })
    await updateSettings({ tagline: 'Market cuisine' }, 'en')

    const english = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
    const spanish = await payload.findGlobal({ slug: 'site-settings', locale: 'es' })

    expect(english.tagline).toBe('Market cuisine')
    expect(english.contact?.whatsappMessage).toBe('Hola')
    expect(spanish.tagline).toBe('Cocina de mercado')
    // Non-translatable fields are shared by both languages (US-C3 CA3).
    expect(english.name).toBe('Casa Pepe')
  })
})

describe('homepage (RF-HOME-01..04, US-C1..C3)', () => {
  it('requires the hero title in Spanish only', async () => {
    await expect(updateHomepage({ hero: { title: '' } })).rejects.toThrow()

    await updateHomepage({ hero: { title: 'Cocina de mercado' } })
    // Saving the English version without translating the title is allowed.
    await updateHomepage({ hero: { subtitle: 'Fresh produce every day' } }, 'en')

    const english = await payload.findGlobal({ slug: 'homepage', locale: 'en' })
    expect(english.hero?.title).toBe('Cocina de mercado')
    expect(english.hero?.subtitle).toBe('Fresh produce every day')
  })

  it('stores the hero, about and section titles', async () => {
    const image = await createImage()

    const saved = await updateHomepage({
      hero: {
        title: 'Cocina de mercado',
        subtitle: 'Desde 1985',
        image: image.id,
        cta: { label: 'Ver la carta', action: 'menu' },
      },
      about: {
        title: 'Nuestra historia',
        body: 'Primer párrafo.\n\nSegundo párrafo.',
        image: image.id,
      },
      sections: {
        featuredTitle: 'Lo mejor',
        galleryTitle: 'Fotos',
        hoursTitle: 'Horario',
        contactTitle: 'Ven',
      },
      seo: { title: 'Casa Pepe', description: 'Cocina de mercado' },
    })

    expect(saved).toMatchObject({
      hero: { cta: { action: 'menu' } },
      about: { body: 'Primer párrafo.\n\nSegundo párrafo.' },
      sections: { galleryTitle: 'Fotos' },
    })
  })

  it('only accepts a CTA action from the closed list', async () => {
    await expect(
      updateHomepage({ hero: { title: 'T', cta: { label: 'Ir', action: 'javascript' } } }),
    ).rejects.toThrow()
  })

  it('requires an https URL when the CTA action is external', async () => {
    const message = await rejectionMessage(
      updateHomepage({ hero: { title: 'T', cta: { label: 'Reservar', action: 'external' } } }),
    )
    expect(message).toContain('La URL debe empezar por https://')

    await expect(
      updateHomepage({
        hero: {
          title: 'T',
          cta: { label: 'Reservar', action: 'external', url: 'http://x.example' },
        },
      }),
    ).rejects.toThrow()

    const saved = await updateHomepage({
      hero: {
        title: 'T',
        cta: { label: 'Reservar', action: 'external', url: 'https://x.example' },
      },
    })
    expect(saved.hero?.cta?.url).toBe('https://x.example')
  })

  it('warns when the CTA opens WhatsApp but no WhatsApp number is configured (US-C1 CA3)', async () => {
    const whatsappCta = { hero: { title: 'T', cta: { label: 'Escríbenos', action: 'whatsapp' } } }

    expect(await rejectionMessage(updateHomepage(whatsappCta))).toContain(
      'Configura primero un número de WhatsApp',
    )

    await updateSettings({ contact: { whatsappNumber: '+34600111222' } })
    await expect(updateHomepage(whatsappCta)).resolves.toMatchObject({
      hero: { cta: { action: 'whatsapp' } },
    })
  })

  it('limits the about text to 2000 characters', async () => {
    await expect(updateHomepage({ about: { body: 'a'.repeat(2001) } })).rejects.toThrow()
  })
})

describe('gallery (RF-MEDIA-05, US-D3)', () => {
  it('keeps the images in the order chosen in the panel', async () => {
    const first = await createImage('Primera')
    const second = await createImage('Segunda')

    const saved = await payload.updateGlobal({
      slug: 'gallery',
      data: { images: [second.id, first.id] },
      depth: 0,
    })

    expect(saved.images).toEqual([second.id, first.id])
  })

  it('accepts at most 30 images', async () => {
    const image = await createImage()

    await expect(
      payload.updateGlobal({
        slug: 'gallery',
        data: { images: Array.from({ length: 31 }, () => image.id) },
      }),
    ).rejects.toThrow()
  })
})

describe('deleting an image in use (US-D2 CA2)', () => {
  it('empties the references to it instead of failing', async () => {
    const image = await createImage()
    const kept = await createImage('Se queda')
    await updateHomepage({ hero: { title: 'T', image: image.id } })
    await payload.updateGlobal({ slug: 'gallery', data: { images: [image.id, kept.id] } })

    await payload.delete({ collection: 'media', id: image.id })

    const homepage = await payload.findGlobal({ slug: 'homepage', depth: 0 })
    const gallery = await payload.findGlobal({ slug: 'gallery', depth: 0 })
    expect(homepage.hero?.image ?? null).toBeNull()
    expect(gallery.images).toEqual([kept.id])
  })
})

describe('versions (RF-SITE-07, US-B6)', () => {
  it.each([
    ['site-settings', { name: 'Primera versión' }, { name: 'Segunda versión' }, 'name'],
    [
      'homepage',
      { hero: { title: 'Primera versión' } },
      { hero: { title: 'Segunda versión' } },
      'hero.title',
    ],
  ] as const)('restores a previous version of %s', async (slug, first, second, path) => {
    // `slug` is a union here, so the data type cannot be narrowed.
    await payload.updateGlobal({ slug, data: first as never })
    await payload.updateGlobal({ slug, data: second as never })

    const versions = await payload.findGlobalVersions({ slug, sort: 'createdAt' })
    expect(versions.totalDocs).toBeGreaterThanOrEqual(2)
    const firstVersion = versions.docs.find((version) =>
      JSON.stringify(version.version).includes('Primera versión'),
    )

    await payload.restoreGlobalVersion({ slug, id: String(firstVersion!.id) })

    const restored = (await payload.findGlobal({ slug })) as unknown as Record<string, unknown>
    const value = path
      .split('.')
      .reduce<unknown>((current, key) => (current as Record<string, unknown>)?.[key], restored)
    expect(value).toBe('Primera versión')
  })

  it('keeps at most 20 versions', async () => {
    for (let i = 0; i < 22; i += 1) {
      await payload.updateGlobal({ slug: 'site-settings', data: { name: `Versión ${i}` } })
    }

    const versions = await payload.findGlobalVersions({ slug: 'site-settings', limit: 100 })
    expect(versions.totalDocs).toBe(20)
  })
})
