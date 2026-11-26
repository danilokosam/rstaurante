import type { TextFieldSingleValidation } from 'payload'
import { text } from 'payload/shared'

import { adminLanguage } from '@/i18n/adminLanguage'
import type { Locale } from '@/i18n/config'
import type { ValidationResult } from '@/lib/validation/messages'

/**
 * Adapts a pure validator from `src/lib/validation` to a Payload text field:
 * runs it with the admin language and then Payload's own text validation
 * (required, max length…), which a custom `validate` would otherwise replace.
 */
export function textValidator(
  validator: (value: unknown, language: Locale) => ValidationResult,
): TextFieldSingleValidation {
  return (value, options) => {
    const result = validator(value, adminLanguage(options.req))
    return result === true ? text(value, options) : result
  }
}
