import { describe, expect, it } from 'vitest'

import { EnvValidationError, parseEnv } from '@/lib/env'

const SECRET_32 = 'a'.repeat(32)

const validEnv = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  PAYLOAD_SECRET: SECRET_32,
  NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
}

const validS3 = {
  S3_ENDPOINT: 'https://example.storage.supabase.co/storage/v1/s3',
  S3_REGION: 'eu-west-1',
  S3_BUCKET: 'media',
  S3_ACCESS_KEY_ID: 'key-id',
  S3_SECRET_ACCESS_KEY: 'very-secret-value',
  S3_PUBLIC_URL: 'https://example.supabase.co/storage/v1/object/public/media',
}

function captureError(fn: () => unknown): EnvValidationError {
  try {
    fn()
  } catch (error) {
    if (error instanceof EnvValidationError) return error
    throw error
  }
  throw new Error('Expected parseEnv to throw EnvValidationError')
}

describe('parseEnv', () => {
  it('returns the typed configuration for a valid environment', () => {
    const env = parseEnv(validEnv)

    expect(env).toEqual({
      databaseUrl: validEnv.DATABASE_URL,
      payloadSecret: SECRET_32,
      serverUrl: 'http://localhost:3000',
      s3: null,
    })
  })

  it('accepts the postgresql:// scheme', () => {
    const env = parseEnv({ ...validEnv, DATABASE_URL: 'postgresql://u:p@h:6543/postgres' })
    expect(env.databaseUrl).toBe('postgresql://u:p@h:6543/postgres')
  })

  it('removes a trailing slash from the server URL', () => {
    const env = parseEnv({ ...validEnv, NEXT_PUBLIC_SERVER_URL: 'https://example.com/' })
    expect(env.serverUrl).toBe('https://example.com')
  })

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['whitespace only', '   '],
  ])('rejects a %s DATABASE_URL', (_label, value) => {
    const error = captureError(() => parseEnv({ ...validEnv, DATABASE_URL: value }))
    expect(error.issues).toEqual([expect.stringContaining('DATABASE_URL')])
  })

  it('rejects a DATABASE_URL that is not PostgreSQL', () => {
    const error = captureError(() =>
      parseEnv({ ...validEnv, DATABASE_URL: 'mysql://u:p@localhost:3306/db' }),
    )
    expect(error.issues).toEqual([expect.stringContaining('DATABASE_URL')])
  })

  it('rejects a missing PAYLOAD_SECRET', () => {
    const error = captureError(() => parseEnv({ ...validEnv, PAYLOAD_SECRET: undefined }))
    expect(error.issues).toEqual([expect.stringContaining('PAYLOAD_SECRET')])
  })

  it('rejects a PAYLOAD_SECRET shorter than 32 characters', () => {
    const error = captureError(() => parseEnv({ ...validEnv, PAYLOAD_SECRET: 'a'.repeat(31) }))
    expect(error.issues).toEqual([expect.stringContaining('PAYLOAD_SECRET')])
  })

  it.each(['localhost:3000', 'ftp://example.com', 'not a url'])(
    'rejects NEXT_PUBLIC_SERVER_URL "%s"',
    (value) => {
      const error = captureError(() => parseEnv({ ...validEnv, NEXT_PUBLIC_SERVER_URL: value }))
      expect(error.issues).toEqual([expect.stringContaining('NEXT_PUBLIC_SERVER_URL')])
    },
  )

  it('returns the S3 configuration when every S3 variable is set', () => {
    const env = parseEnv({ ...validEnv, ...validS3 })

    expect(env.s3).toEqual({
      endpoint: validS3.S3_ENDPOINT,
      region: validS3.S3_REGION,
      bucket: validS3.S3_BUCKET,
      accessKeyId: validS3.S3_ACCESS_KEY_ID,
      secretAccessKey: validS3.S3_SECRET_ACCESS_KEY,
      publicUrl: validS3.S3_PUBLIC_URL,
    })
  })

  it('rejects a partial S3 configuration and names the missing variables', () => {
    const error = captureError(() =>
      parseEnv({ ...validEnv, S3_ENDPOINT: validS3.S3_ENDPOINT, S3_BUCKET: 'media' }),
    )

    expect(error.issues).toHaveLength(1)
    expect(error.issues[0]).toContain('S3_REGION')
    expect(error.issues[0]).toContain('S3_ACCESS_KEY_ID')
    expect(error.issues[0]).toContain('S3_SECRET_ACCESS_KEY')
    expect(error.issues[0]).toContain('S3_PUBLIC_URL')
  })

  it.each(['http://example.supabase.co/storage', 'not-a-url'])(
    'requires S3_PUBLIC_URL to be an https URL (%s)',
    (value) => {
      const error = captureError(() => parseEnv({ ...validEnv, ...validS3, S3_PUBLIC_URL: value }))

      expect(error.issues).toEqual(['S3_PUBLIC_URL must be an absolute https URL'])
    },
  )

  it('removes the trailing slash of S3_PUBLIC_URL', () => {
    const env = parseEnv({ ...validEnv, ...validS3, S3_PUBLIC_URL: `${validS3.S3_PUBLIC_URL}/` })

    expect(env.s3?.publicUrl).toBe(validS3.S3_PUBLIC_URL)
  })

  it('reports every problem at once', () => {
    const error = captureError(() => parseEnv({}))

    expect(error.issues).toHaveLength(3)
    expect(error.message).toContain('DATABASE_URL')
    expect(error.message).toContain('PAYLOAD_SECRET')
    expect(error.message).toContain('NEXT_PUBLIC_SERVER_URL')
  })

  it('never includes secret values in the error message', () => {
    const leakySecret = 'short-but-secret'
    const leakyDbUrl = 'mysql://admin:topsecretpassword@db:3306/x'
    const error = captureError(() =>
      parseEnv({ ...validEnv, PAYLOAD_SECRET: leakySecret, DATABASE_URL: leakyDbUrl }),
    )

    expect(error.message).not.toContain(leakySecret)
    expect(error.message).not.toContain('topsecretpassword')
  })
})
