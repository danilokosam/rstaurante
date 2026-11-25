'use client'

import { useLocale, useTranslation } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

/**
 * Synchronizes the Payload admin UI language (`i18n`) whenever the user changes
 * the content locale via the `.localizer-button` selector.
 */
export function LocaleSync({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { i18n, switchLanguage } = useTranslation()
  const prevLocaleRef = useRef<string | undefined>(locale?.code)

  useEffect(() => {
    const nextCode = locale?.code
    const urlLocale = searchParams.get('locale')
    const prevCode = prevLocaleRef.current

    if (!nextCode || nextCode === prevCode || !switchLanguage) {
      return
    }

    // Wait until the URL has settled on the new locale so router.refresh()
    // inside switchLanguage does not race with Localizer's router.push().
    if (urlLocale !== nextCode) {
      return
    }

    prevLocaleRef.current = nextCode

    if (i18n.language !== nextCode && (nextCode === 'es' || nextCode === 'en')) {
      void switchLanguage(nextCode)
    }
  }, [locale?.code, searchParams, i18n.language, switchLanguage])

  return <>{children}</>
}
