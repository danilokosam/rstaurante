/**
 * Server-side environment validation.
 *
 * Fails fast at startup with a readable list of problems. Error messages name
 * the offending variables but never include their values (they may be secrets).
 */

export type S3Config = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  /** Public base URL of the bucket; files are served from here (ADR-0004). */
  publicUrl: string
}

export type Env = {
  databaseUrl: string
  payloadSecret: string
  serverUrl: string
  s3: S3Config | null
}

type EnvSource = Record<string, string | undefined>

export class EnvValidationError extends Error {
  readonly issues: string[]

  constructor(issues: string[]) {
    super(`Invalid environment configuration:\n- ${issues.join('\n- ')}`)
    this.name = 'EnvValidationError'
    this.issues = issues
  }
}

const MIN_SECRET_LENGTH = 32

const S3_VARIABLES = {
  endpoint: 'S3_ENDPOINT',
  region: 'S3_REGION',
  bucket: 'S3_BUCKET',
  accessKeyId: 'S3_ACCESS_KEY_ID',
  secretAccessKey: 'S3_SECRET_ACCESS_KEY',
  publicUrl: 'S3_PUBLIC_URL',
} as const satisfies Record<keyof S3Config, string>

function read(source: EnvSource, name: string): string | undefined {
  const value = source[name]?.trim()
  return value ? value : undefined
}

function hasProtocol(value: string, protocols: string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function parseS3(source: EnvSource, issues: string[]): S3Config | null {
  const entries = Object.entries(S3_VARIABLES).map(
    ([key, name]) => [key, name, read(source, name)] as const,
  )
  const missing = entries.filter(([, , value]) => value === undefined).map(([, name]) => name)

  if (missing.length === entries.length) return null
  if (missing.length > 0) {
    issues.push(
      `Incomplete S3 storage configuration: set all S3_* variables or none. Missing: ${missing.join(', ')}`,
    )
    return null
  }

  const config = Object.fromEntries(entries.map(([key, , value]) => [key, value])) as S3Config
  if (!hasProtocol(config.publicUrl, ['https:'])) {
    issues.push('S3_PUBLIC_URL must be an absolute https URL')
    return null
  }
  return { ...config, publicUrl: config.publicUrl.replace(/\/+$/, '') }
}

export function parseEnv(source: EnvSource): Env {
  const issues: string[] = []

  const databaseUrl = read(source, 'DATABASE_URL')
  if (!databaseUrl) {
    issues.push('DATABASE_URL is required')
  } else if (!hasProtocol(databaseUrl, ['postgres:', 'postgresql:'])) {
    issues.push(
      'DATABASE_URL must be a PostgreSQL connection string (postgres:// or postgresql://)',
    )
  }

  const payloadSecret = read(source, 'PAYLOAD_SECRET')
  if (!payloadSecret) {
    issues.push('PAYLOAD_SECRET is required')
  } else if (payloadSecret.length < MIN_SECRET_LENGTH) {
    issues.push(`PAYLOAD_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`)
  }

  const rawServerUrl = read(source, 'NEXT_PUBLIC_SERVER_URL')
  if (!rawServerUrl) {
    issues.push('NEXT_PUBLIC_SERVER_URL is required')
  } else if (!hasProtocol(rawServerUrl, ['http:', 'https:'])) {
    issues.push('NEXT_PUBLIC_SERVER_URL must be an absolute http(s) URL')
  }

  const s3 = parseS3(source, issues)

  if (issues.length > 0) throw new EnvValidationError(issues)

  return {
    databaseUrl: databaseUrl as string,
    payloadSecret: payloadSecret as string,
    serverUrl: (rawServerUrl as string).replace(/\/+$/, ''),
    s3,
  }
}

let cachedEnv: Env | undefined

/** Validated environment of the current process (memoized). */
export function getEnv(): Env {
  cachedEnv ??= parseEnv(process.env)
  return cachedEnv
}
