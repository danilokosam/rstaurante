import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { MAX_MEDIA_FILE_SIZE } from '@/collections/Media'
import config from '@/payload.config'

import { rejectionMessage } from '../helpers/errors'
import { resetDatabase } from '../helpers/resetDatabase'
import { makeImage, uploadFile } from '../helpers/uploads'

let payload: Payload

/** Pass `null` to create the image without any alt text. */
function createMedia(file: ReturnType<typeof uploadFile>, alt: string | null = 'Plato') {
  return payload.create({
    collection: 'media',
    data: alt === null ? ({} as { alt: string }) : { alt },
    file,
    locale: 'es',
  })
}

// One Payload instance for the whole file: destroying it in a nested `afterAll`
// would leave the following `describe` blocks with a closed connection.
beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  await payload?.destroy()
})

describe('media collection (RF-MEDIA-01..04, US-D1, US-D2)', () => {
  beforeEach(async () => {
    await resetDatabase(payload)
  })

  afterEach(async () => {
    // Removes the uploaded files from disk as well as the documents.
    await payload.delete({ collection: 'media', where: {} })
  })

  describe('allowed types', () => {
    it.each([
      ['jpeg', 'photo.jpg', 'image/jpeg'],
      ['png', 'photo.png', 'image/png'],
      ['webp', 'photo.webp', 'image/webp'],
      ['avif', 'photo.avif', 'image/avif'],
    ] as const)('accepts a real %s image', async (format, name, mimetype) => {
      const doc = await createMedia(uploadFile(await makeImage(format), name, mimetype))

      expect(doc.mimeType).toBe(mimetype)
    })
  })

  describe('rejected files', () => {
    it('rejects a text file renamed to .jpg (content is checked, not the extension)', async () => {
      const fake = Buffer.from('this is definitely not an image, just text with a .jpg name')

      const message = await rejectionMessage(
        createMedia(uploadFile(fake, 'photo.jpg', 'image/jpeg')),
      )

      expect(message).toContain('Solo se admiten imágenes JPEG, PNG, WebP o AVIF.')
      expect(await payload.count({ collection: 'media' })).toMatchObject({ totalDocs: 0 })
    })

    it('rejects an SVG image', async () => {
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
      )

      const message = await rejectionMessage(
        createMedia(uploadFile(svg, 'logo.svg', 'image/svg+xml')),
      )

      expect(message).toContain('Solo se admiten imágenes JPEG, PNG, WebP o AVIF.')
    })

    it('rejects a GIF even though it is an image', async () => {
      const gif = await makeImage('png').then((png) => sharp(png).gif().toBuffer())

      const message = await rejectionMessage(createMedia(uploadFile(gif, 'anim.gif', 'image/gif')))

      expect(message).toContain('Solo se admiten imágenes JPEG, PNG, WebP o AVIF.')
    })

    it('rejects a file larger than 4 MB', async () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
      const tooBig = Buffer.concat([jpegHeader, Buffer.alloc(MAX_MEDIA_FILE_SIZE)])

      const message = await rejectionMessage(
        createMedia(uploadFile(tooBig, 'big.jpg', 'image/jpeg')),
      )

      expect(MAX_MEDIA_FILE_SIZE).toBe(4 * 1024 * 1024)
      expect(message).toContain('La imagen no puede superar los 4 MB.')
    })

    it('rejects a disallowed file when replacing the file of an existing image', async () => {
      const doc = await createMedia(uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'))
      const fake = Buffer.from('still not an image')

      const message = await rejectionMessage(
        payload.update({
          collection: 'media',
          id: doc.id,
          data: {},
          file: uploadFile(fake, 'photo.jpg', 'image/jpeg'),
        }),
      )

      expect(message).toContain('Solo se admiten imágenes JPEG, PNG, WebP o AVIF.')
    })
  })

  describe('alt text (RF-MEDIA-02, R-08)', () => {
    it('requires the Spanish alt text', async () => {
      await expect(
        createMedia(uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'), null),
      ).rejects.toThrow()
    })

    it('does not allow clearing the Spanish alt text', async () => {
      const doc = await createMedia(uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'))

      await expect(
        payload.update({ collection: 'media', id: doc.id, locale: 'es', data: { alt: '' } }),
      ).rejects.toThrow()
    })

    it('limits the alt text to 200 characters', async () => {
      await expect(
        createMedia(
          uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'),
          'a'.repeat(201),
        ),
      ).rejects.toThrow()
    })

    it('does not require the English alt text and falls back to Spanish', async () => {
      const doc = await createMedia(
        uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'),
        'Paella',
      )

      // Editing the English version without an English alt must be allowed.
      await payload.update({
        collection: 'media',
        id: doc.id,
        locale: 'en',
        data: { caption: 'Seafood paella' },
      })

      const english = await payload.findByID({ collection: 'media', id: doc.id, locale: 'en' })
      expect(english.alt).toBe('Paella')
      expect(english.caption).toBe('Seafood paella')
    })

    it('stores a translated alt text per locale', async () => {
      const doc = await createMedia(
        uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'),
        'Terraza',
      )
      await payload.update({
        collection: 'media',
        id: doc.id,
        locale: 'en',
        data: { alt: 'Terrace' },
      })

      const spanish = await payload.findByID({ collection: 'media', id: doc.id, locale: 'es' })
      const english = await payload.findByID({ collection: 'media', id: doc.id, locale: 'en' })
      expect(spanish.alt).toBe('Terraza')
      expect(english.alt).toBe('Terrace')
    })
  })

  describe('generated sizes (RF-MEDIA-03)', () => {
    it('generates thumbnail, card and hero sizes in WebP without enlarging the original', async () => {
      const doc = await createMedia(
        uploadFile(await makeImage('jpeg', 1000, 600), 'photo.jpg', 'image/jpeg'),
      )

      expect(doc.sizes?.thumbnail).toMatchObject({ width: 400, mimeType: 'image/webp' })
      expect(doc.sizes?.card).toMatchObject({ width: 800, mimeType: 'image/webp' })
      // The original (1000 px) is smaller than the hero size (1920 px): not enlarged.
      expect(doc.sizes?.hero).toMatchObject({ width: 1000, mimeType: 'image/webp' })
    })
  })

  describe('replace and delete (RF-MEDIA-04)', () => {
    it('replaces the file of an existing image', async () => {
      const doc = await createMedia(
        uploadFile(await makeImage('jpeg', 1000, 600), 'photo.jpg', 'image/jpeg'),
      )

      const updated = await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: uploadFile(await makeImage('png', 500, 500), 'new.png', 'image/png'),
      })

      expect(updated.mimeType).toBe('image/png')
      expect(updated.width).toBe(500)
    })

    it('deletes an image', async () => {
      const doc = await createMedia(uploadFile(await makeImage('jpeg'), 'photo.jpg', 'image/jpeg'))

      await payload.delete({ collection: 'media', id: doc.id })

      expect(await payload.count({ collection: 'media' })).toMatchObject({ totalDocs: 0 })
    })
  })
})

describe('media uploads over HTTP (REST API used by the admin panel)', () => {
  let token: string

  async function postMedia(file: Blob, filename: string, alt = 'Plato') {
    const { REST_POST } = await import('@payloadcms/next/routes')
    const body = new FormData()
    body.append('file', file, filename)
    body.append('_payload', JSON.stringify({ alt }))

    const request = new Request(`${payload.config.serverURL}/api/media`, {
      method: 'POST',
      headers: { Authorization: `JWT ${token}` },
      body,
    })
    return REST_POST(config)(request, { params: Promise.resolve({ slug: ['media'] }) })
  }

  beforeEach(async () => {
    await resetDatabase(payload)
    await payload.create({
      collection: 'users',
      data: { email: 'uploader@example.com', password: 'correct-horse-battery-staple' },
    })
    const login = await payload.login({
      collection: 'users',
      data: { email: 'uploader@example.com', password: 'correct-horse-battery-staple' },
    })
    token = login.token!
  })

  afterEach(async () => {
    await payload.delete({ collection: 'media', where: {} })
  })

  it('accepts a real JPEG', async () => {
    const response = await postMedia(
      new Blob([new Uint8Array(await makeImage('jpeg'))]),
      'photo.jpg',
    )

    expect(response.status).toBe(201)
  })

  it('rejects a text file named .jpg with a clear message', async () => {
    const response = await postMedia(new Blob(['not an image at all']), 'photo.jpg')

    expect(response.status).toBe(400)
    expect(JSON.stringify(await response.json())).toContain(
      'Solo se admiten imágenes JPEG, PNG, WebP o AVIF.',
    )
  })

  it('aborts uploads larger than 4 MB with 413', async () => {
    const tooBig = new Uint8Array(MAX_MEDIA_FILE_SIZE + 1)
    tooBig.set([0xff, 0xd8, 0xff, 0xe0])

    const response = await postMedia(new Blob([tooBig]), 'big.jpg')

    expect(response.status).toBe(413)
    expect(await payload.count({ collection: 'media' })).toMatchObject({ totalDocs: 0 })
  })
})
