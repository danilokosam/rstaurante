import {
  APIError,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  ValidationError,
} from 'payload'

import { authenticated } from '@/access'
import { requiredInDefaultLocale } from '@/fields/localizedText'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '@/hooks/revalidateSite'
import { adminLanguage } from '@/i18n/adminLanguage'
import type { LocalizedMessage } from '@/lib/validation/messages'

const deleteWithDishesMessage: LocalizedMessage = {
  es: 'No se puede borrar la categoría porque contiene platos. Muévelos o bórralos primero.',
  en: 'Cannot delete this category because it contains dishes. Move or delete them first.',
}

const duplicateNameMessage: LocalizedMessage = {
  es: 'Ya existe una categoría con este nombre (sin distinguir mayúsculas ni espacios).',
  en: 'A category with this name already exists (ignoring case and spaces).',
}

const normalizeName = (value: string): string => value.trim().toLocaleLowerCase()

/**
 * Category names are unique per language ignoring case and surrounding spaces
 * (RF-MENU-01): the database unique index alone would accept "Postres" and "postres ".
 */
const rejectDuplicateName: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const name = typeof data?.name === 'string' ? data.name.trim() : ''
  if (!name) {
    return data
  }
  const locale = req.locale && req.locale !== 'all' ? req.locale : undefined
  // `like` is a case-insensitive superset (it matches words); the exact comparison is below.
  const candidates = await req.payload.find({
    collection: 'menu-categories',
    where: {
      name: { like: name },
      ...(originalDoc?.id !== undefined ? { id: { not_equals: originalDoc.id } } : {}),
    },
    locale,
    fallbackLocale: false,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const target = normalizeName(name)
  if (
    candidates.docs.some(
      (doc) => typeof doc.name === 'string' && normalizeName(doc.name) === target,
    )
  ) {
    throw new ValidationError({
      collection: 'menu-categories',
      errors: [{ message: duplicateNameMessage[adminLanguage(req)], path: 'name' }],
    })
  }
  return data
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
    beforeValidate: [rejectDuplicateName],
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
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
      },
      admin: {
        description: {
          es: 'Obligatorio en español y único por idioma (sin distinguir mayúsculas).',
          en: 'Required in Spanish and unique per language (case-insensitive).',
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
