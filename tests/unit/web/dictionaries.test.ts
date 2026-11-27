import { describe, expect, it } from 'vitest'

import { getDictionary } from '@/i18n/dictionaries'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'

/** Every leaf path of a nested dictionary, e.g. `menu.unavailable`. */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function leafValues(value: unknown): unknown[] {
  if (typeof value !== 'object' || value === null) {
    return [value]
  }
  return Object.values(value).flatMap(leafValues)
}

describe('public site dictionaries (ADR-0010, RF-I18N-03)', () => {
  it('has exactly the same keys in Spanish and English', () => {
    expect(leafPaths(en).sort()).toEqual(leafPaths(es).sort())
  })

  it('has no empty texts', () => {
    for (const text of [...leafValues(es), ...leafValues(en)]) {
      expect(typeof text).toBe('string')
      expect((text as string).trim()).not.toBe('')
    }
  })

  it('returns the dictionary of each locale', () => {
    expect(getDictionary('es')).toBe(es)
    expect(getDictionary('en')).toBe(en)
  })

  it('includes the fixed texts the product requires', () => {
    expect(es.hours.closed).toBe('Cerrado')
    expect(en.hours.closed).toBe('Closed')
    expect(es.menu.unavailable).toBe('No disponible')
    expect(en.menu.unavailable).toBe('Unavailable')
    expect(es.menu.allergyNotice).toBe(
      'Si tienes alguna alergia o intolerancia, consulta al personal.',
    )
    expect(en.days.monday).toBe('Monday')
    expect(es.days.sunday).toBe('Domingo')
  })
})
