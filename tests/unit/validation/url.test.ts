import { describe, expect, it } from 'vitest'

import { validateHttpsUrl, validateMapsUrl } from '@/lib/validation/url'

describe('validateHttpsUrl', () => {
  it.each([undefined, null, ''])('accepts an empty optional value (%s)', (value) => {
    expect(validateHttpsUrl(value)).toBe(true)
  })

  it.each(['https://www.instagram.com/restaurante', 'https://example.com/a?b=c#d'])(
    'accepts %s',
    (value) => {
      expect(validateHttpsUrl(value)).toBe(true)
    },
  )

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'ftp://example.com',
    'example.com',
    'https://',
    'https://user:pass@example.com',
    `https://example.com/${'a'.repeat(2048)}`,
  ])('rejects %s', (value) => {
    expect(validateHttpsUrl(value)).toBe('La URL debe empezar por https:// y ser válida.')
  })

  it('rejects non-string values', () => {
    expect(typeof validateHttpsUrl(42)).toBe('string')
  })

  it('returns the message in English when requested', () => {
    expect(validateHttpsUrl('http://example.com', 'en')).toBe(
      'The URL must start with https:// and be valid.',
    )
  })
})

describe('validateMapsUrl', () => {
  it('accepts an empty optional value', () => {
    expect(validateMapsUrl('')).toBe(true)
  })

  it.each([
    'https://www.google.com/maps/place/Restaurante',
    'https://google.com/maps?q=Madrid',
    'https://maps.google.com/?q=Madrid',
    'https://maps.app.goo.gl/AbCdEf123',
    'https://goo.gl/maps/AbCdEf123',
  ])('accepts %s', (value) => {
    expect(validateMapsUrl(value)).toBe(true)
  })

  it.each([
    'http://maps.google.com/?q=Madrid',
    'https://maps.evil.com/?q=Madrid',
    'https://google.com.evil.com/maps',
    'https://evilgoogle.com/maps',
    'https://www.openstreetmap.org/',
  ])('rejects %s', (value) => {
    expect(validateMapsUrl(value)).toBe(
      'Debe ser un enlace https de Google Maps (google.com, maps.google.com, maps.app.goo.gl o goo.gl).',
    )
  })

  it('returns the message in English when requested', () => {
    expect(validateMapsUrl('https://maps.evil.com', 'en')).toBe(
      'It must be an https Google Maps link (google.com, maps.google.com, maps.app.goo.gl or goo.gl).',
    )
  })
})
