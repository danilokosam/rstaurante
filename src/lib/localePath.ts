import { isLocale, type Locale } from '@/i18n/config'

/** Public path under a locale prefix: `/es`, `/en/menu`. */
export function localizedPath(locale: Locale, path = ''): string {
  const rest = path.replace(/^\/+/, '')
  return rest ? `/${locale}/${rest}` : `/${locale}`
}

/** The same page in another language, for the language switcher (RF-I18N-04). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [, first = '', ...rest] = pathname.split('/')
  if (!isLocale(first)) {
    return `/${target}`
  }
  return ['', target, ...rest].join('/')
}
