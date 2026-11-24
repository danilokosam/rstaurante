import { describe, expect, it } from 'vitest'

import { defaultLocale, isLocale, locales } from '@/i18n/config'

describe('i18n config', () => {
  it('supports Spanish and English, with Spanish as default', () => {
    expect(locales).toEqual(['es', 'en'])
    expect(defaultLocale).toBe('es')
  })

  it.each(['es', 'en'])('accepts "%s"', (value) => {
    expect(isLocale(value)).toBe(true)
  })

  it.each(['fr', '', 'ES', 'es-ES', 'admin'])('rejects "%s"', (value) => {
    expect(isLocale(value)).toBe(false)
  })
})
