import { describe, expect, it } from 'vitest'

import { localizedPath, switchLocalePath } from '@/lib/localePath'

describe('locale paths (RF-I18N-04, US-F5 CA1)', () => {
  it('builds paths under a locale prefix', () => {
    expect(localizedPath('es')).toBe('/es')
    expect(localizedPath('en', '/menu')).toBe('/en/menu')
    expect(localizedPath('en', 'menu')).toBe('/en/menu')
  })

  it.each([
    ['/es', 'en', '/en'],
    ['/es/menu', 'en', '/en/menu'],
    ['/en/menu', 'es', '/es/menu'],
    ['/es/', 'en', '/en/'],
    ['/', 'en', '/en'],
    ['/espanol', 'en', '/en'],
  ] as const)('switches %s to %s as %s', (pathname, target, expected) => {
    expect(switchLocalePath(pathname, target)).toBe(expected)
  })
})
