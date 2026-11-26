import { open } from 'node:fs/promises'

import type { CollectionBeforeOperationHook, CollectionConfig, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import { anyone, authenticated } from '@/access'
import { requiredInDefaultLocale } from '@/fields/localizedText'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '@/hooks/revalidateSite'
import { adminLanguage } from '@/i18n/adminLanguage'
import { ALLOWED_IMAGE_TYPES, detectImageType } from '@/lib/media/detectImageType'
import type { LocalizedMessage } from '@/lib/validation/messages'

/** Maximum size of an uploaded image (RF-MEDIA-01). */
export const MAX_MEDIA_FILE_SIZE = 4 * 1024 * 1024

/** Enough leading bytes to recognise every allowed format, including AVIF brands. */
const SIGNATURE_BYTES = 64

const messages = {
  invalidType: {
    es: 'Solo se admiten imágenes JPEG, PNG, WebP o AVIF.',
    en: 'Only JPEG, PNG, WebP or AVIF images are allowed.',
  },
  tooLarge: {
    es: 'La imagen no puede superar los 4 MB.',
    en: 'The image cannot be larger than 4 MB.',
  },
} satisfies Record<string, LocalizedMessage>

type UploadedFile = NonNullable<PayloadRequest['file']>

/** Reads the first bytes of the upload, whether it is in memory or in a temp file. */
async function readSignature(file: UploadedFile): Promise<Uint8Array> {
  if (file.data && file.data.length > 0) {
    return file.data.subarray(0, SIGNATURE_BYTES)
  }
  if (!file.tempFilePath) {
    return new Uint8Array()
  }
  const handle = await open(file.tempFilePath, 'r')
  try {
    const buffer = Buffer.alloc(SIGNATURE_BYTES)
    const { bytesRead } = await handle.read(buffer, 0, SIGNATURE_BYTES, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

function reject(message: string): never {
  throw new ValidationError({ collection: 'media', errors: [{ message, path: 'file' }] })
}

/**
 * Validates every uploaded file before Payload processes it (create, update and
 * file replacement, through REST or the Local API):
 * - size ≤ 4 MB (the HTTP limit lives in `upload.limits` of payload.config, but
 *   the Local API bypasses it);
 * - real type detected from the content (magic bytes). Payload alone falls back
 *   to the file extension when it cannot detect the content, so a text file
 *   named `.jpg` would be accepted.
 *
 * The detected type replaces the MIME type declared by the client.
 */
export const validateUploadedImage: CollectionBeforeOperationHook = async ({ args, operation }) => {
  const req: PayloadRequest | undefined = args.req
  const file = req?.file
  if (!req || !file || (operation !== 'create' && operation !== 'update')) {
    return args
  }

  const language = adminLanguage(req)
  if (file.size > MAX_MEDIA_FILE_SIZE) {
    reject(messages.tooLarge[language])
  }

  const detected = detectImageType(await readSignature(file))
  if (!detected) {
    reject(messages.invalidType[language])
  }
  file.mimetype = detected

  return args
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { es: 'Imagen', en: 'Image' },
    plural: { es: 'Imágenes', en: 'Images' },
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeOperation: [validateUploadedImage],
    afterChange: [revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    requiredInDefaultLocale({
      name: 'alt',
      type: 'text',
      maxLength: 200,
      label: { es: 'Texto alternativo', en: 'Alt text' },
      admin: {
        description: {
          es: 'Obligatorio en español. Describe la imagen para quien no puede verla (lectores de pantalla y buscadores). Ej.: «Paella de marisco en sartén de hierro».',
          en: 'Required in Spanish. Describe the image for people who cannot see it (screen readers and search engines). E.g. "Seafood paella in an iron pan".',
        },
      },
    }),
    {
      name: 'caption',
      type: 'text',
      localized: true,
      maxLength: 200,
      label: { es: 'Pie de foto', en: 'Caption' },
    },
  ],
  upload: {
    mimeTypes: [...ALLOWED_IMAGE_TYPES],
    focalPoint: true,
    // Generated sizes are WebP; smaller originals are copied at their own size
    // instead of being enlarged (data-model.md).
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1920 },
    ].map((size) => ({
      ...size,
      withoutEnlargement: true,
      formatOptions: { format: 'webp' as const },
    })),
    adminThumbnail: 'thumbnail',
  },
}
