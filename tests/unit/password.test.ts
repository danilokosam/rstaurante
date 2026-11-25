import { describe, expect, it } from 'vitest'

import { MIN_PASSWORD_LENGTH, validatePassword } from '@/lib/password'

describe('validatePassword', () => {
  it('enforces a minimum length of 12 characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12)
  })

  it('accepts a password with exactly 12 characters', () => {
    expect(validatePassword('a'.repeat(12))).toBe(true)
  })

  it('accepts a longer passphrase', () => {
    expect(validatePassword('correct-horse-battery-staple')).toBe(true)
  })

  it('rejects a password shorter than 12 characters', () => {
    const result = validatePassword('a'.repeat(11))

    expect(typeof result).toBe('string')
    expect(result).toContain('12')
  })

  it('rejects an empty or whitespace-only password', () => {
    expect(typeof validatePassword('')).toBe('string')
    expect(typeof validatePassword('            ')).toBe('string')
  })

  it('rejects non-string values', () => {
    expect(typeof validatePassword(undefined)).toBe('string')
    expect(typeof validatePassword(null)).toBe('string')
  })
})
