import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateSiteAfterGlobalChange } from '@/hooks/revalidateSite'
import { textValidator } from '@/fields/validate'
import { adminLanguage } from '@/i18n/adminLanguage'
import { validateMapsUrl, validateHttpsUrl } from '@/lib/validation/url'
import { validatePhone, validateWhatsAppNumber } from '@/lib/validation/phone'
import { validateTime, validateTimeSlot } from '@/lib/validation/time'

export const WEEKDAYS = [
  { value: 'monday', label: { es: 'Lunes', en: 'Monday' } },
  { value: 'tuesday', label: { es: 'Martes', en: 'Tuesday' } },
  { value: 'wednesday', label: { es: 'Miércoles', en: 'Wednesday' } },
  { value: 'thursday', label: { es: 'Jueves', en: 'Thursday' } },
  { value: 'friday', label: { es: 'Viernes', en: 'Friday' } },
  { value: 'saturday', label: { es: 'Sábado', en: 'Saturday' } },
  { value: 'sunday', label: { es: 'Domingo', en: 'Sunday' } },
]

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tripadvisor', label: 'Tripadvisor' },
  { value: 'google', label: { es: 'Google (ficha del negocio)', en: 'Google (business profile)' } },
]

const validateTimeField = textValidator(validateTime)

/** Closing time: valid `HH:MM` and different from the opening time of the slot. */
const validateClosingTime: TextFieldSingleValidation = (value, options) => {
  const own = validateTimeField(value, options)
  if (own !== true) {
    return own
  }
  const opens = (options.siblingData as { opens?: unknown }).opens
  // An invalid opening time is reported on its own field.
  if (validateTime(opens) !== true) {
    return true
  }
  return validateTimeSlot(
    { opens: opens as string, closes: value as string },
    adminLanguage(options.req),
  )
}

/** Restaurant information shown across the public website (data-model.md). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { es: 'Información del restaurante', en: 'Restaurant information' },
  access: {
    read: anyone,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateSiteAfterGlobalChange],
  },
  versions: { max: 20 },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { es: 'General', en: 'General' },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              maxLength: 80,
              label: { es: 'Nombre del restaurante', en: 'Restaurant name' },
              admin: {
                description: {
                  es: 'Igual en todos los idiomas.',
                  en: 'The same in every language.',
                },
              },
            },
            {
              name: 'tagline',
              type: 'text',
              localized: true,
              maxLength: 120,
              label: { es: 'Eslogan', en: 'Tagline' },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              maxLength: 300,
              label: { es: 'Descripción breve', en: 'Short description' },
              admin: {
                description: {
                  es: 'También se usa como descripción para buscadores si no rellenas la del apartado SEO.',
                  en: 'Also used as the search engine description when the SEO one is empty.',
                },
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: { es: 'Logo', en: 'Logo' },
            },
          ],
        },
        {
          name: 'contact',
          label: { es: 'Contacto', en: 'Contact' },
          fields: [
            {
              name: 'phone',
              type: 'text',
              maxLength: 30,
              label: { es: 'Teléfono', en: 'Phone' },
              validate: textValidator(validatePhone),
            },
            {
              name: 'email',
              type: 'email',
              label: { es: 'Email', en: 'Email' },
            },
            {
              name: 'whatsappNumber',
              type: 'text',
              label: { es: 'Número de WhatsApp', en: 'WhatsApp number' },
              validate: textValidator(validateWhatsAppNumber),
              admin: {
                description: {
                  es: 'Formato internacional sin espacios, p. ej. +34600111222. Si lo dejas vacío, la web no muestra el botón de WhatsApp.',
                  en: 'International format without spaces, e.g. +34600111222. If empty, the website does not show the WhatsApp button.',
                },
              },
            },
            {
              name: 'whatsappMessage',
              type: 'text',
              localized: true,
              maxLength: 200,
              label: { es: 'Mensaje predefinido de WhatsApp', en: 'Prefilled WhatsApp message' },
            },
          ],
        },
        {
          name: 'location',
          label: { es: 'Ubicación', en: 'Location' },
          fields: [
            {
              name: 'street',
              type: 'text',
              maxLength: 150,
              label: { es: 'Calle y número', en: 'Street address' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'postalCode',
                  type: 'text',
                  maxLength: 20,
                  label: { es: 'Código postal', en: 'Postal code' },
                },
                {
                  name: 'city',
                  type: 'text',
                  maxLength: 100,
                  label: { es: 'Ciudad', en: 'City' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'region',
                  type: 'text',
                  maxLength: 100,
                  label: { es: 'Provincia o región', en: 'Region' },
                },
                {
                  name: 'country',
                  type: 'text',
                  maxLength: 100,
                  label: { es: 'País', en: 'Country' },
                },
              ],
            },
            {
              name: 'mapsUrl',
              type: 'text',
              label: { es: 'Enlace de Google Maps', en: 'Google Maps link' },
              validate: textValidator(validateMapsUrl),
              admin: {
                description: {
                  es: 'Opcional. Si lo dejas vacío, la web genera un enlace de Google Maps con la dirección.',
                  en: 'Optional. If empty, the website builds a Google Maps link from the address.',
                },
              },
            },
          ],
        },
        {
          name: 'openingHours',
          label: { es: 'Horario', en: 'Opening hours' },
          fields: [
            {
              name: 'slots',
              type: 'array',
              label: { es: 'Franjas de apertura', en: 'Opening slots' },
              labels: {
                singular: { es: 'Franja', en: 'Slot' },
                plural: { es: 'Franjas', en: 'Slots' },
              },
              admin: {
                description: {
                  es: 'Añade una franja por turno (p. ej. comida y cena). Un día sin franjas aparece como «Cerrado». Si el cierre es anterior a la apertura (20:00–01:00), se entiende que cierra después de medianoche.',
                  en: 'Add one slot per service (e.g. lunch and dinner). A day without slots is shown as "Closed". A closing time earlier than the opening time (20:00–01:00) means it closes after midnight.',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'day',
                      type: 'select',
                      required: true,
                      options: WEEKDAYS,
                      label: { es: 'Día', en: 'Day' },
                    },
                    {
                      name: 'opens',
                      type: 'text',
                      required: true,
                      label: { es: 'Abre (HH:MM)', en: 'Opens (HH:MM)' },
                      validate: validateTimeField,
                    },
                    {
                      name: 'closes',
                      type: 'text',
                      required: true,
                      label: { es: 'Cierra (HH:MM)', en: 'Closes (HH:MM)' },
                      validate: validateClosingTime,
                    },
                  ],
                },
              ],
            },
            {
              name: 'note',
              type: 'text',
              localized: true,
              maxLength: 200,
              label: { es: 'Nota', en: 'Note' },
              admin: {
                placeholder: { es: 'Cerrado los festivos', en: 'Closed on public holidays' },
              },
            },
          ],
        },
        {
          label: { es: 'Redes sociales', en: 'Social media' },
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              maxRows: 10,
              label: { es: 'Redes sociales', en: 'Social media' },
              labels: {
                singular: { es: 'Red social', en: 'Social link' },
                plural: { es: 'Redes sociales', en: 'Social links' },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      required: true,
                      options: SOCIAL_PLATFORMS,
                      label: { es: 'Plataforma', en: 'Platform' },
                    },
                    {
                      name: 'url',
                      type: 'text',
                      required: true,
                      label: { es: 'Enlace (https)', en: 'Link (https)' },
                      validate: textValidator(validateHttpsUrl),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'seo',
          label: { es: 'SEO', en: 'SEO' },
          description: {
            es: 'Valores por defecto para buscadores y redes sociales.',
            en: 'Default values for search engines and social media.',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              maxLength: 60,
              label: { es: 'Título', en: 'Title' },
              admin: {
                description: {
                  es: 'Si lo dejas vacío se usa el nombre del restaurante.',
                  en: 'If empty, the restaurant name is used.',
                },
              },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              maxLength: 160,
              label: { es: 'Descripción', en: 'Description' },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: { es: 'Imagen para compartir', en: 'Sharing image' },
            },
          ],
        },
      ],
    },
  ],
}
