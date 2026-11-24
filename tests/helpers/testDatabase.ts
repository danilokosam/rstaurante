/**
 * Returns the connection string of the database used by automated tests.
 *
 * Guard rail: test suites delete data, so they refuse to run unless the target
 * database name ends with "_test". This prevents wiping a development or
 * production database by accident.
 */
export function resolveTestDatabaseUrl(source: Record<string, string | undefined>): string {
  const url = source.DATABASE_URL_TEST?.trim()
  if (!url) {
    throw new Error('DATABASE_URL_TEST is required to run integration tests (see .env.example)')
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''))
  } catch {
    throw new Error('DATABASE_URL_TEST is not a valid connection URL')
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      'DATABASE_URL_TEST must point to a database whose name ends with "_test" (tests delete data)',
    )
  }

  return url
}
