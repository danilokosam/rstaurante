import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/lib/localePath'
import { phoneHref, whatsappHref } from '@/lib/links'

type Text = string | null | undefined

/** Plain-text paragraphs separated by blank lines (ADR-0005: textarea, no HTML). */
export function paragraphs(text: Text): string[] {
  return (text ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

export type HeroCta = {
  label?: Text
  action?: 'menu' | 'whatsapp' | 'phone' | 'external' | null
  url?: Text
}

export type CtaContact = { phone?: Text; whatsappNumber?: Text; whatsappMessage?: Text }

/**
 * Destination of the hero button (RF-HOME-01), or `null` when it must not be
 * shown: no label, or an action whose contact data is missing (for example a
 * WhatsApp button after the number was removed).
 */
export function heroCtaHref(
  cta: HeroCta | null | undefined,
  contact: CtaContact | null | undefined,
  locale: Locale,
): string | null {
  if (!cta?.label?.trim()) {
    return null
  }
  switch (cta.action ?? 'menu') {
    case 'menu':
      return localizedPath(locale, 'menu')
    case 'whatsapp':
      return whatsappHref(contact?.whatsappNumber, contact?.whatsappMessage)
    case 'phone':
      return phoneHref(contact?.phone)
    case 'external': {
      const url = cta.url?.trim() ?? ''
      return url.startsWith('https://') ? url : null
    }
  }
}
