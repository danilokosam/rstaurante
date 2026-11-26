import { describe, expect, it } from 'vitest'

import { adminLanguage } from '@/i18n/adminLanguage'

describe('adminLanguage', () => {
  it.each(['es', 'en'])('returns the supported admin language %s', (language) => {
    expect(adminLanguage({ i18n: { language } })).toBe(language)
  })

  it.each([undefined, {}, { i18n: {} }, { i18n: { language: 'fr' } }])(
    'falls back to Spanish (%o)',
    (req) => {
      expect(adminLanguage(req)).toBe('es')
    },
  )
})
