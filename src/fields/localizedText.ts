import type { TextareaField, TextField } from 'payload'
import { text, textarea } from 'payload/shared'

import { defaultLocale } from '@/i18n/config'

type LocalizableField = Omit<TextField, 'localized' | 'required' | 'validate'> &
  Pick<TextField, 'type'>
type LocalizableTextarea = Omit<TextareaField, 'localized' | 'required' | 'validate'> &
  Pick<TextareaField, 'type'>

const isBlank = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

/**
 * A translatable text field that is mandatory in Spanish and optional in
 * English (ADR-0010, R-08).
 *
 * Payload's `required: true` on a localized field demands a value in every
 * locale, so the English version of a document could not be saved without
 * translating everything. Instead, the value is required when saving the
 * default locale, or when creating the document; Payload's own text/textarea
 * validation (max length, etc.) still runs.
 */
export function requiredInDefaultLocale(field: LocalizableField): TextField
export function requiredInDefaultLocale(field: LocalizableTextarea): TextareaField
export function requiredInDefaultLocale(
  field: LocalizableField | LocalizableTextarea,
): TextField | TextareaField {
  const validate = (value: unknown, options: Parameters<typeof text>[1]) => {
    const locale = options.req.locale
    const savingDefaultLocale = !locale || locale === defaultLocale || locale === 'all'
    if ((savingDefaultLocale || options.operation === 'create') && isBlank(value)) {
      return options.req.t('validation:required')
    }
    return field.type === 'textarea'
      ? textarea(value as string, options as unknown as Parameters<typeof textarea>[1])
      : text(value as string, options)
  }

  return { ...field, localized: true, required: false, validate } as unknown as
    TextField | TextareaField
}
