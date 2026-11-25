export const MIN_PASSWORD_LENGTH = 12

/**
 * Validates that a user password is a non-blank string with at least
 * `MIN_PASSWORD_LENGTH` characters (RF-AUTH-07).
 */
export function validatePassword(value: unknown): string | true {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `Password is required and must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  return true
}
