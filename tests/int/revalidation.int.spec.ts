import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

import { resetDatabase } from '../helpers/resetDatabase'
import { makeImage, uploadFile } from '../helpers/uploads'

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }))

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidatePath,
}))

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

beforeEach(async () => {
  await resetDatabase(payload)
  revalidatePath.mockReset()
})

afterAll(async () => {
  await payload.delete({ collection: 'media', where: {} })
  await payload?.destroy()
})

describe('saving content revalidates the public site (ADR-0007, RF-PUB-01)', () => {
  it.each([
    ['site-settings', { name: 'Casa Pepe' }],
    ['homepage', { hero: { title: 'Cocina de mercado' } }],
    ['gallery', { images: [] }],
  ] as const)('revalidates the whole site after saving %s', async (slug, data) => {
    await payload.updateGlobal({ slug, data: data as never })

    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('revalidates after creating, updating and deleting an image', async () => {
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Paella' },
      file: uploadFile(await makeImage('jpeg'), 'paella.jpg', 'image/jpeg'),
    })
    expect(revalidatePath).toHaveBeenCalledTimes(1)

    await payload.update({ collection: 'media', id: image.id, data: { alt: 'Paella valenciana' } })
    expect(revalidatePath).toHaveBeenCalledTimes(2)

    await payload.delete({ collection: 'media', id: image.id })
    expect(revalidatePath).toHaveBeenCalledTimes(3)
    expect(revalidatePath).toHaveBeenLastCalledWith('/', 'layout')
  })

  it('revalidates after creating, updating and deleting a menu category and a dish', async () => {
    const category = await payload.create({
      collection: 'menu-categories',
      data: { name: 'Entrantes' },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(1)

    await payload.update({
      collection: 'menu-categories',
      id: category.id,
      data: { name: 'Tapas' },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(2)

    const dish = await payload.create({
      collection: 'dishes',
      data: {
        name: 'Patatas bravas',
        price: 7.5,
        category: category.id,
        availability: 'available',
      },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(3)

    await payload.update({
      collection: 'dishes',
      id: dish.id,
      data: { availability: 'unavailable' },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(4)

    await payload.delete({ collection: 'dishes', id: dish.id })
    expect(revalidatePath).toHaveBeenCalledTimes(5)

    await payload.delete({ collection: 'menu-categories', id: category.id })
    expect(revalidatePath).toHaveBeenCalledTimes(6)
    expect(revalidatePath).toHaveBeenLastCalledWith('/', 'layout')
  })

  it('does not revalidate when the caller disables it (seed scripts)', async () => {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { name: 'Casa Pepe' },
      context: { disableRevalidate: true },
    })

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('keeps the change saved and logs the error when revalidation fails (RF-PUB-02)', async () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('cache backend unavailable')
    })
    const logError = vi.spyOn(payload.logger, 'error').mockImplementation(() => undefined)

    await expect(
      payload.updateGlobal({ slug: 'site-settings', data: { name: 'Guardado igualmente' } }),
    ).resolves.toMatchObject({ name: 'Guardado igualmente' })

    const saved = await payload.findGlobal({ slug: 'site-settings' })
    expect(saved.name).toBe('Guardado igualmente')
    expect(logError).toHaveBeenCalled()
    logError.mockRestore()
  })
})
