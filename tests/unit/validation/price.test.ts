import { describe, expect, it } from 'vitest'

import { MAX_PRICE, MIN_PRICE, validatePrice } from '@/lib/validation/price'

describe('validatePrice (RF-MENU-03, US-E2 CA2)', () => {
  it('exposes the 0..9999.99 EUR bounds', () => {
    expect(MIN_PRICE).toBe(0)
    expect(MAX_PRICE).toBe(9999.99)
  })

  it.each([0, 0.01, 1, 12, 12.5, 19.99, 100.55, 9999.99])('accepts valid price %s', (value) => {
    expect(validatePrice(value)).toBe(true)
  })

  it.each([undefined, null, ''])('rejects missing price (%s)', (value) => {
    expect(validatePrice(value)).toBe('El precio es obligatorio.')
    expect(validatePrice(value, 'en')).toBe('Price is required.')
  })

  it.each([NaN, Infinity, -Infinity, '12.50', {}, []])(
    'rejects non-finite or non-numeric price (%s)',
    (value) => {
      expect(validatePrice(value)).toBe('El precio debe ser un número válido.')
      expect(validatePrice(value, 'en')).toBe('Price must be a valid number.')
    },
  )

  it.each([-0.01, -1, 10000, 9999.999, 10000.01])('rejects out-of-range price %s', (value) => {
    expect(validatePrice(value)).toBe('El precio debe estar entre 0 y 9999,99 €.')
    expect(validatePrice(value, 'en')).toBe('Price must be between €0 and €9999.99.')
  })

  it.each([0.001, 1.005, 12.345, 12.999, 9999.989, 1e-7])(
    'rejects price with more than 2 decimals (%s)',
    (value) => {
      expect(validatePrice(value)).toBe('El precio puede tener como máximo 2 decimales.')
      expect(validatePrice(value, 'en')).toBe('Price can have at most 2 decimal places.')
    },
  )
})
