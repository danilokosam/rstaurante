import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '@/access'
import { requiredInDefaultLocale } from '@/fields/localizedText'
import { numberValidator } from '@/fields/validate'
import { revalidateSiteAfterChange, revalidateSiteAfterDelete } from '@/hooks/revalidateSite'
import { ALLERGEN_OPTIONS } from '@/lib/allergens'
import { MAX_PRICE, MIN_PRICE, validatePrice } from '@/lib/validation/price'

export const DISH_AVAILABILITY_OPTIONS = [
  { value: 'available', label: { es: 'Disponible', en: 'Available' } },
  { value: 'unavailable', label: { es: 'No disponible', en: 'Unavailable' } },
  { value: 'hidden', label: { es: 'Oculto', en: 'Hidden' } },
]

/** Restaurant menu dishes (RF-MENU-02..05, RF-MENU-07, RF-MENU-08). */
export const Dishes: CollectionConfig = {
  slug: 'dishes',
  labels: {
    singular: { es: 'Plato', en: 'Dish' },
    plural: { es: 'Platos', en: 'Dishes' },
  },
  orderable: true,
  defaultSort: '_order',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'availability', 'isFeatured'],
    description: {
      es: 'El orden de los platos es único para toda la carta: filtra por categoría antes de arrastrar para reordenar solo los platos de esa categoría. Para cambiar la disponibilidad de varios platos, selecciónalos y pulsa «Editar».',
      en: 'Dish order is shared across the whole menu: filter by category before dragging to reorder only that category\'s dishes. To change the availability of several dishes, select them and click "Edit".',
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return true
      }
      const publicOnly: Where = {
        and: [
          { availability: { not_equals: 'hidden' } },
          { 'category.isVisible': { equals: true } },
        ],
      }
      return publicOnly
    },
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateSiteAfterChange],
    afterDelete: [revalidateSiteAfterDelete],
  },
  fields: [
    requiredInDefaultLocale({
      name: 'name',
      type: 'text',
      maxLength: 120,
      label: { es: 'Nombre', en: 'Name' },
      admin: {
        description: {
          es: 'Obligatorio en español.',
          en: 'Required in Spanish.',
        },
      },
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 500,
      label: { es: 'Descripción', en: 'Description' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: MIN_PRICE,
      max: MAX_PRICE,
      label: { es: 'Precio (EUR)', en: 'Price (EUR)' },
      validate: numberValidator(validatePrice),
      admin: {
        step: 0.01,
        description: {
          es: 'En euros, de 0 a 9999,99 con como máximo 2 decimales.',
          en: 'In euros, from 0 to 9999.99 with at most 2 decimal places.',
        },
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'menu-categories',
      required: true,
      label: { es: 'Categoría', en: 'Category' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { es: 'Imagen', en: 'Image' },
    },
    {
      name: 'availability',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: DISH_AVAILABILITY_OPTIONS,
      label: { es: 'Disponibilidad', en: 'Availability' },
      admin: {
        description: {
          es: '«No disponible» lo muestra atenuado en la carta; «Oculto» lo retira de la web y la API.',
          en: '"Unavailable" keeps it dimmed on the menu; "Hidden" removes it from the website and API.',
        },
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: { es: 'Destacado en portada', en: 'Featured on home page' },
    },
    {
      name: 'allergens',
      type: 'select',
      hasMany: true,
      options: ALLERGEN_OPTIONS,
      label: { es: 'Alérgenos (UE)', en: 'Allergens (EU)' },
      admin: {
        isClearable: true,
        description: {
          es: 'Selecciona los alérgenos presentes según el Reglamento (UE) 1169/2011. Si no marcas ninguno, no se afirma que sea libre de alérgenos.',
          en: 'Select any present allergens per EU Regulation 1169/2011. Leaving this empty does not claim the dish is allergen-free.',
        },
      },
    },
  ],
}
