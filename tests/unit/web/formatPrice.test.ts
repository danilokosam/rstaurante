import { describe, expect, it } from 'vitest'

import { formatPrice } from '@/lib/price'

// Intl separates the amount and the euro sign with a no-break space in Spanish.
const NBSP = ' '

describe('formatPrice (ADR-0011, US-F1 CA2)', () => {
  it.each([
    [12.5, `12,50${NBSP}€`],
    [0, `0,00${NBSP}€`],
    [9, `9,00${NBSP}€`],
    [9999.99, `9999,99${NBSP}€`],
  ])('formats %s in Spanish as %s', (value, expected) => {
    expect(formatPrice(value, 'es')).toBe(expected)
  })

  it.each([
    [12.5, '€12.50'],
    [0, '€0.00'],
    [9999.99, '€9,999.99'],
  ])('formats %s in English as %s', (value, expected) => {
    expect(formatPrice(value, 'en')).toBe(expected)
  })
})
