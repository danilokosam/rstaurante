import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'

export const MAX_GALLERY_IMAGES = 30

/** Ordered selection of images from the media library (RF-MEDIA-05). */
export const Gallery: GlobalConfig = {
  slug: 'gallery',
  label: { es: 'Galería', en: 'Gallery' },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      maxRows: MAX_GALLERY_IMAGES,
      label: { es: 'Imágenes', en: 'Images' },
      admin: {
        isSortable: true,
        description: {
          es: 'Hasta 30 imágenes. Arrástralas para cambiar el orden en que aparecen en la web. Si no hay ninguna, la sección no se muestra.',
          en: 'Up to 30 images. Drag them to change the order shown on the website. If there are none, the section is hidden.',
        },
      },
    },
  ],
}
