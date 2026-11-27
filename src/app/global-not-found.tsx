import type { Metadata } from 'next'
import Link from 'next/link'

import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'

import '@/styles/globals.css'

export const metadata: Metadata = {
  title: `404 · ${es.notFound.title} · ${en.notFound.title}`,
  robots: { index: false },
}

/**
 * 404 for URLs that match no route (`experimental.globalNotFound`, RF-WEB-06).
 * It renders outside any layout, so the language is unknown: bilingual text.
 */
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body className="flex min-h-dvh items-center justify-center bg-surface px-4 text-ink antialiased">
        <main className="max-w-2xl py-20 text-center">
          <p className="text-sm font-semibold tracking-wide text-accent">404</p>
          <h1 className="mt-2 text-3xl font-semibold">{es.notFound.title}</h1>
          <p className="mt-4 text-ink-muted">{es.notFound.body}</p>
          <p lang="en" className="mt-6 text-xl font-semibold">
            {en.notFound.title}
          </p>
          <p lang="en" className="mt-2 text-ink-muted">
            {en.notFound.body}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/es" className="rounded bg-accent px-5 py-3 font-medium text-accent-ink">
              {es.notFound.backHome}
            </Link>
            <Link
              href="/en"
              lang="en"
              hrefLang="en"
              className="rounded border border-accent px-5 py-3 font-medium text-accent"
            >
              {en.notFound.backHome}
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
