'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/lib/localePath'

type Props = {
  locale: Locale
  labels: { label: string; home: string; menu: string }
}

/** Main navigation; the current page is marked with `aria-current`. */
export function MainNav({ locale, labels }: Props) {
  const pathname = usePathname()
  const links = [
    { href: localizedPath(locale), label: labels.home },
    { href: localizedPath(locale, 'menu'), label: labels.menu },
  ]
  return (
    <nav aria-label={labels.label}>
      <ul className="flex items-center gap-1 sm:gap-4">
        {links.map((link) => {
          const current = pathname === link.href || pathname === `${link.href}/`
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className="rounded px-2 py-2 text-sm font-medium text-ink-muted hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:underline-offset-4 sm:text-base"
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
