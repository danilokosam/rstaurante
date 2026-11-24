import { describe, expect, it } from 'vitest'

import { resolveTestDatabaseUrl } from '../helpers/testDatabase'

describe('resolveTestDatabaseUrl', () => {
  it('returns DATABASE_URL_TEST when it points to a *_test database', () => {
    const url = 'postgres://postgres:postgres@127.0.0.1:5433/rstaurante_test'
    expect(resolveTestDatabaseUrl({ DATABASE_URL_TEST: url })).toBe(url)
  })

  it('ignores query parameters when checking the database name', () => {
    const url = 'postgres://u:p@localhost:5432/app_test?sslmode=disable'
    expect(resolveTestDatabaseUrl({ DATABASE_URL_TEST: url })).toBe(url)
  })

  it('fails when DATABASE_URL_TEST is not set', () => {
    expect(() => resolveTestDatabaseUrl({})).toThrow(/DATABASE_URL_TEST/)
  })

  it('refuses a database whose name does not end with _test', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL_TEST: 'postgres://u:p@localhost:5432/rstaurante',
      }),
    ).toThrow(/_test/)
  })

  it('refuses a URL where "_test" appears outside the database name', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL_TEST: 'postgres://my_test:p@prod-host:5432/postgres',
      }),
    ).toThrow(/_test/)
  })
})
