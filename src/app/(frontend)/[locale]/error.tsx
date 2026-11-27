'use client'

import { useParams } from 'next/navigation'

import { defaultLocale, isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

type Props = {
  error: unknown
  retry: () => void
}

/** Error page inside the site layout (RF-WEB-06); never shows error details to visitors. */
export default function ErrorPage({ retry }: Props) {
  const params = useParams<{ locale?: string }>()
  const locale = params.locale && isLocale(params.locale) ? params.locale : defaultLocale
  const { error } = getDictionary(locale)
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">{error.title}</h1>
      <p className="mt-4 text-ink-muted">{error.body}</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-8 rounded bg-accent px-5 py-3 font-medium text-accent-ink"
      >
        {error.retry}
      </button>
    </section>
  )
}
