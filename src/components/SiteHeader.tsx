import Link from 'next/link'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { localizedPath } from '@/lib/localePath'
import type { Media } from '@/payload-types'

import { CmsImage } from './CmsImage'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MainNav } from './MainNav'

type Props = {
  locale: Locale
  dictionary: Dictionary
  name: string
  logo: Media | null
}

/** Header with logo or name, main navigation and language switcher (RF-WEB-03). */
export function SiteHeader({ locale, dictionary, name, logo }: Props) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link
          href={localizedPath(locale)}
          className="flex items-center gap-3 rounded text-lg font-semibold text-ink"
        >
          {logo ? (
            <CmsImage
              image={logo}
              size="thumbnail"
              sizes="48px"
              className="h-10 w-auto"
              decorative
              loading="eager"
            />
          ) : null}
          <span>{name}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <MainNav locale={locale} labels={dictionary.nav} />
          <LanguageSwitcher locale={locale} labels={dictionary.language} />
        </div>
      </div>
    </header>
  )
}
