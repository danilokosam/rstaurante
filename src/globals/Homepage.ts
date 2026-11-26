import type {
  GlobalConfig,
  SelectFieldSingleValidation,
  TextField,
  TextFieldSingleValidation,
} from 'payload'
import { select } from 'payload/shared'

import { anyone, authenticated } from '@/access'
import { revalidateSiteAfterGlobalChange } from '@/hooks/revalidateSite'
import { requiredInDefaultLocale } from '@/fields/localizedText'
import { textValidator } from '@/fields/validate'
import { adminLanguage } from '@/i18n/adminLanguage'
import type { LocalizedMessage } from '@/lib/validation/messages'
import { validateHttpsUrl } from '@/lib/validation/url'

export const CTA_ACTIONS = [
  { value: 'menu', label: { es: 'Ver la carta', en: 'Open the menu' } },
  { value: 'whatsapp', label: { es: 'Abrir WhatsApp', en: 'Open WhatsApp' } },
  { value: 'phone', label: { es: 'Llamar por teléfono', en: 'Call by phone' } },
  { value: 'external', label: { es: 'Enlace externo', en: 'External link' } },
]

const messages = {
  whatsappMissing: {
    es: 'Configura primero un número de WhatsApp en «Información del restaurante → Contacto».',
    en: 'Set a WhatsApp number first in "Restaurant information → Contact".',
  },
  urlRequired: {
    es: 'La URL debe empezar por https:// y ser válida.',
    en: 'The URL must start with https:// and be valid.',
  },
} satisfies Record<string, LocalizedMessage>

/** The WhatsApp action needs a WhatsApp number in site-settings (US-C1 CA3). */
const validateCtaAction: SelectFieldSingleValidation = async (value, options) => {
  const result = await select(value, options)
  if (result !== true || value !== 'whatsapp' || !options.req?.payload) {
    return result
  }
  const settings = await options.req.payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
    req: options.req,
  })
  return settings.contact?.whatsappNumber
    ? true
    : messages.whatsappMissing[adminLanguage(options.req)]
}

/** The URL is only used, and then required, for the external link action. */
const validateCtaUrl: TextFieldSingleValidation = (value, options) => {
  const action = (options.siblingData as { action?: unknown }).action
  if (action !== 'external') {
    return true
  }
  if (!value) {
    return messages.urlRequired[adminLanguage(options.req)]
  }
  return textValidator(validateHttpsUrl)(value, options)
}

const sectionTitle = (name: string, es: string, en: string): TextField => ({
  name,
  type: 'text',
  localized: true,
  maxLength: 80,
  label: { es, en },
})

/** Content of the public home page (data-model.md). */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: { es: 'Portada', en: 'Home page' },
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
          name: 'hero',
          label: { es: 'Portada principal', en: 'Hero' },
          fields: [
            requiredInDefaultLocale({
              name: 'title',
              type: 'text',
              maxLength: 80,
              label: { es: 'Título', en: 'Title' },
              admin: {
                description: { es: 'Obligatorio en español.', en: 'Required in Spanish.' },
              },
            }),
            {
              name: 'subtitle',
              type: 'textarea',
              localized: true,
              maxLength: 200,
              label: { es: 'Subtítulo', en: 'Subtitle' },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: { es: 'Imagen', en: 'Image' },
            },
            {
              name: 'cta',
              type: 'group',
              label: { es: 'Botón principal', en: 'Main button' },
              admin: {
                description: {
                  es: 'Si no escribes el texto del botón, no se muestra.',
                  en: 'If the button text is empty, no button is shown.',
                },
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  localized: true,
                  maxLength: 30,
                  label: { es: 'Texto del botón', en: 'Button text' },
                },
                {
                  name: 'action',
                  type: 'select',
                  options: CTA_ACTIONS,
                  defaultValue: 'menu',
                  label: { es: 'Acción', en: 'Action' },
                  validate: validateCtaAction,
                },
                {
                  name: 'url',
                  type: 'text',
                  label: { es: 'URL (https)', en: 'URL (https)' },
                  validate: validateCtaUrl,
                  admin: {
                    condition: (_data, siblingData) => siblingData?.action === 'external',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'about',
          label: { es: 'Sobre nosotros', en: 'About us' },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              maxLength: 80,
              label: { es: 'Título', en: 'Title' },
            },
            {
              name: 'body',
              type: 'textarea',
              localized: true,
              maxLength: 2000,
              label: { es: 'Texto', en: 'Text' },
              admin: {
                rows: 10,
                description: {
                  es: 'Separa los párrafos con una línea en blanco. No admite HTML: se muestra como texto.',
                  en: 'Separate paragraphs with a blank line. HTML is not allowed: it is shown as text.',
                },
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: { es: 'Imagen', en: 'Image' },
            },
          ],
        },
        {
          name: 'sections',
          label: { es: 'Títulos de sección', en: 'Section titles' },
          description: {
            es: 'Opcionales: si los dejas vacíos se usa el título por defecto de cada sección.',
            en: 'Optional: if empty, each section uses its default title.',
          },
          fields: [
            sectionTitle('featuredTitle', 'Destacados', 'Highlights'),
            sectionTitle('galleryTitle', 'Galería', 'Gallery'),
            sectionTitle('hoursTitle', 'Horario', 'Opening hours'),
            sectionTitle('contactTitle', 'Dónde estamos', 'Find us'),
          ],
        },
        {
          name: 'seo',
          label: { es: 'SEO', en: 'SEO' },
          fields: [
            {
              name: 'title',
              type: 'text',
              localized: true,
              maxLength: 60,
              label: { es: 'Título', en: 'Title' },
            },
            {
              name: 'description',
              type: 'textarea',
              localized: true,
              maxLength: 160,
              label: { es: 'Descripción', en: 'Description' },
            },
          ],
        },
      ],
    },
  ],
}
