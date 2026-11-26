import { APIError, type CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { requiredInDefaultLocale } from '@/fields/localizedText'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '@/hooks/revalidateSite'
import { adminLanguage } from '@/i18n/adminLanguage'
import type { LocalizedMessage } from '@/lib/validation/messages'

const deleteWithDishesMessage: LocalizedMessage = {
  es: 'No se puede borrar la categoría porque contiene platos. Muévelos o bórralos primero.',
  en: 'Cannot delete this category because it contains dishes. Move or delete them first.',
}

/** Menu categories managed by the restaurant (RF-MENU-01, RF-MENU-02, RF-MENU-06). */
export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  labels: {
    singular: { es: 'Categoría de la carta', en: 'Menu category' },
    plural: { es: 'Categorías de la carta', en: 'Menu categories' },
  },
  orderable: true,
  defaultSort: '_order',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'isVisible', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { isVisible: { equals: true } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'dishes',
          where: { category: { equals: id } },
          overrideAccess: true,
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(deleteWithDishesMessage[adminLanguage(req)], 400, undefined, true)
        }
      },
    ],
    afterChange: [revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    requiredInDefaultLocale({
      name: 'name',
      type: 'text',
      maxLength: 80,
      unique: true,
      label: { es: 'Nombre', en: 'Name' },
      admin: {
        description: {
          es: 'Obligatorio en español y único por idioma.',
          en: 'Required in Spanish and unique per language.',
        },
      },
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 300,
      label: { es: 'Descripción', en: 'Description' },
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: { es: 'Visible en la carta', en: 'Visible on menu' },
      admin: {
        description: {
          es: 'Si se desactiva, ni la categoría ni sus platos aparecen en la web.',
          en: 'When unchecked, neither the category nor its dishes appear on the website.',
        },
      },
    },
  ],
}
