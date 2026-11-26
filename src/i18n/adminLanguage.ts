import { defaultLocale, isLocale, type Locale } from './config'

/**
 * Language of the admin panel for the current request (Spanish by default),
 * used to return validation messages in the language the editor is using.
 */
export function adminLanguage(req: { i18n?: { language?: string } } | undefined): Locale {
  const language = req?.i18n?.language ?? ''
  return isLocale(language) ? language : defaultLocale
}
