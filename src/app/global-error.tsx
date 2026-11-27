'use client'

import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'

import '@/styles/globals.css'

type Props = {
  error: unknown
  retry: () => void
}

/**
 * Last-resort error page when a root layout fails (RF-WEB-06). It replaces the
 * layout, so the language is unknown: bilingual text, no error details.
 */
export default function GlobalError({ retry }: Props) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh items-center justify-center bg-surface px-4 text-ink antialiased">
        <main className="max-w-2xl py-20 text-center">
          <title>{`${es.error.title} · ${en.error.title}`}</title>
          <h1 className="text-3xl font-semibold">{es.error.title}</h1>
          <p className="mt-4 text-ink-muted">{es.error.body}</p>
          <p lang="en" className="mt-6 text-xl font-semibold">
            {en.error.title}
          </p>
          <p lang="en" className="mt-2 text-ink-muted">
            {en.error.body}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-8 rounded bg-accent px-5 py-3 font-medium text-accent-ink"
          >
            {es.error.retry} · <span lang="en">{en.error.retry}</span>
          </button>
        </main>
      </body>
    </html>
  )
}
