'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { type Locale, locales } from '@/i18n/config'
import { switchLocalePath } from '@/lib/localePath'

type Props = {
  locale: Locale
  labels: { label: string } & Record<Locale, string>
}

/** Language switcher that keeps the current page (RF-I18N-04, US-F5 CA1). */
export function LanguageSwitcher({ locale, labels }: Props) {
  const pathname = usePathname()
  return (
    <nav aria-label={labels.label}>
      <ul className="flex items-center gap-1">
        {locales.map((target) => (
          <li key={target}>
            {target === locale ? (
              <span
                aria-current="true"
                title={labels[target]}
                className="block rounded px-2 py-2 text-sm font-semibold text-ink uppercase"
              >
                <span className="sr-only">{labels[target]}</span>
                <span aria-hidden="true">{target}</span>
              </span>
            ) : (
              <Link
                href={switchLocalePath(pathname, target)}
                hrefLang={target}
                lang={target}
                title={labels[target]}
                className="block rounded px-2 py-2 text-sm text-ink-muted uppercase hover:text-ink"
              >
                <span className="sr-only">{labels[target]}</span>
                <span aria-hidden="true">{target}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
