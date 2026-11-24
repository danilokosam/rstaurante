import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { isLocale, locales } from '@/i18n/config'

import '@/styles/globals.css'

// Only the supported locales exist: any other first segment is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// Placeholder metadata until the content model exists (M3/M5).
export const metadata: Metadata = {
  title: 'Restaurante',
}

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function PublicRootLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
