import { describe, expect, it } from 'vitest'

import { validatePhone, validateWhatsAppNumber } from '@/lib/validation/phone'

describe('validatePhone', () => {
  it.each([undefined, null, ''])('accepts an empty optional value (%s)', (value) => {
    expect(validatePhone(value)).toBe(true)
  })

  it.each(['+34 600 111 222', '(91) 123-45-67', '912345678', '+1 (555) 010-9999'])(
    'accepts %s',
    (value) => {
      expect(validatePhone(value)).toBe(true)
    },
  )

  it.each(['abc', '600-11', '+34 600 111 222 ext. 5', '1'.repeat(31), '++--()', 'tel:600111222'])(
    'rejects %s',
    (value) => {
      expect(validatePhone(value)).toBe(
        'Teléfono no válido: usa dígitos, espacios, +, - o paréntesis (6 dígitos como mínimo, 30 caracteres como máximo).',
      )
    },
  )

  it('returns the message in English when requested', () => {
    expect(validatePhone('abc', 'en')).toBe(
      'Invalid phone number: use digits, spaces, +, - or brackets (at least 6 digits, at most 30 characters).',
    )
  })
})

describe('validateWhatsAppNumber', () => {
  it('accepts an empty optional value', () => {
    expect(validateWhatsAppNumber('')).toBe(true)
  })

  it.each(['+34600111222', '+12025550123', '+447911123456'])('accepts %s', (value) => {
    expect(validateWhatsAppNumber(value)).toBe(true)
  })

  it.each([
    '34600111222',
    '+34 600 111 222',
    '+0600111222',
    '+3460011',
    '+3460011122233344',
    '600111222',
  ])('rejects %s', (value) => {
    expect(validateWhatsAppNumber(value)).toBe(
      'El número de WhatsApp debe estar en formato internacional, sin espacios (p. ej. +34600111222).',
    )
  })

  it('returns the message in English when requested', () => {
    expect(validateWhatsAppNumber('600111222', 'en')).toBe(
      'The WhatsApp number must be in international format, without spaces (e.g. +34600111222).',
    )
  })
})
