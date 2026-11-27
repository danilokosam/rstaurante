'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { defaultLocale, isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedPath } from '@/lib/localePath'

/** 404 inside the site layout (RF-WEB-06). `not-found` receives no props: the locale comes from the URL. */
export default function NotFound() {
  const params = useParams<{ locale?: string }>()
  const locale = params.locale && isLocale(params.locale) ? params.locale : defaultLocale
  const { notFound } = getDictionary(locale)
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold">{notFound.title}</h1>
      <p className="mt-4 text-ink-muted">{notFound.body}</p>
      <Link
        href={localizedPath(locale)}
        className="mt-8 inline-block rounded bg-accent px-5 py-3 font-medium text-accent-ink"
      >
        {notFound.backHome}
      </Link>
    </section>
  )
}
