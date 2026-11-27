import { describe, expect, it } from 'vitest'

import {
  ALLERGEN_CODES,
  ALLERGEN_LABELS,
  ALLERGEN_OPTIONS,
  getAllergenLabel,
  getAllergenLabels,
  isAllergenCode,
} from '@/lib/allergens'

const EXPECTED_EU_ALLERGENS = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const

describe('EU allergens catalogue (ADR-0011, RF-MENU-08)', () => {
  it('defines the exact 14 EU Regulation 1169/2011 allergens without duplicates', () => {
    expect(ALLERGEN_CODES).toEqual(EXPECTED_EU_ALLERGENS)
    expect(new Set(ALLERGEN_CODES).size).toBe(14)
    expect(ALLERGEN_OPTIONS).toHaveLength(14)
  })

  it('provides non-empty Spanish and English labels for every allergen', () => {
    for (const code of ALLERGEN_CODES) {
      expect(ALLERGEN_LABELS[code].es.trim().length).toBeGreaterThan(0)
      expect(ALLERGEN_LABELS[code].en.trim().length).toBeGreaterThan(0)
      expect(getAllergenLabel(code, 'es')).toBe(ALLERGEN_LABELS[code].es)
      expect(getAllergenLabel(code, 'en')).toBe(ALLERGEN_LABELS[code].en)
    }

    expect(getAllergenLabel('gluten', 'es')).toBe('Cereales con gluten')
    expect(getAllergenLabel('gluten', 'en')).toBe('Cereals containing gluten')
    expect(getAllergenLabel('nuts', 'es')).toBe('Frutos de cáscara')
    expect(getAllergenLabel('nuts', 'en')).toBe('Tree nuts')
  })

  it('exposes Payload select options matching the 14 codes and localized labels', () => {
    expect(ALLERGEN_OPTIONS.map((option) => option.value)).toEqual([...ALLERGEN_CODES])
    for (const option of ALLERGEN_OPTIONS) {
      expect(option.label).toEqual(ALLERGEN_LABELS[option.value])
    }
  })

  it('validates allergen codes with isAllergenCode', () => {
    for (const code of ALLERGEN_CODES) {
      expect(isAllergenCode(code)).toBe(true)
    }
    expect(isAllergenCode('garlic')).toBe(false)
    expect(isAllergenCode('')).toBe(false)
    expect(isAllergenCode('GLUTEN')).toBe(false)
  })
})

describe('getAllergenLabels (US-E5 CA2, CA4)', () => {
  it('returns the labels of the page language in the stored order', () => {
    expect(getAllergenLabels(['milk', 'gluten'], 'es')).toEqual(['Leche', 'Cereales con gluten'])
    expect(getAllergenLabels(['milk', 'gluten'], 'en')).toEqual([
      'Milk',
      'Cereals containing gluten',
    ])
  })

  it('returns an empty list when no allergen is marked (no "allergen-free" claim)', () => {
    expect(getAllergenLabels([], 'es')).toEqual([])
    expect(getAllergenLabels(null, 'en')).toEqual([])
  })
})
