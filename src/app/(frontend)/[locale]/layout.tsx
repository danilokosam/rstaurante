import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { WhatsAppButton } from '@/components/WhatsAppButton'
import { isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/content'
import { getEnv } from '@/lib/env'

import '@/styles/globals.css'

// Only the supported locales exist: any other first segment is a 404.
export const dynamicParams = false

// Fallback revalidation if an on-save revalidation fails (RF-PUB-02, ADR-0007).
export const revalidate = 3600

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * Site-wide metadata: base URL for relative metadata URLs and the title
 * template of child pages ("Carta | Casa Pepe"). Each page adds its own
 * description, canonical URL, hreflang and Open Graph (RF-WEB-05).
 */
export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const settings = await getSiteSettings(locale)
  const name = settings.name?.trim() || getDictionary(locale).site.defaultName
  return {
    metadataBase: new URL(getEnv().serverUrl),
    title: { template: `%s | ${name}`, default: settings.seo?.title?.trim() || name },
    applicationName: name,
  }
}

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function PublicRootLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dictionary = getDictionary(locale)
  const settings = await getSiteSettings(locale)
  const name = settings.name?.trim() || dictionary.site.defaultName
  const logo = typeof settings.logo === 'object' ? settings.logo : null

  return (
    <html lang={locale}>
      <body className="flex min-h-dvh flex-col bg-surface text-ink antialiased">
        <a
          href="#content"
          className="sr-only rounded bg-accent px-4 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-20"
        >
          {dictionary.site.skipToContent}
        </a>
        <SiteHeader locale={locale} dictionary={dictionary} name={name} logo={logo} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter dictionary={dictionary} name={name} settings={settings} />
        <WhatsAppButton
          number={settings.contact?.whatsappNumber}
          message={settings.contact?.whatsappMessage}
          label={dictionary.contact.whatsapp}
        />
      </body>
    </html>
  )
}
