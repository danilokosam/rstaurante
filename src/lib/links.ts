type Text = string | null | undefined

export type Address = {
  street?: Text
  postalCode?: Text
  city?: Text
  region?: Text
  country?: Text
  mapsUrl?: Text
}

const clean = (value: Text): string => value?.trim() ?? ''

/** `tel:` link with only digits and a leading `+` (US-F2 CA1). */
export function phoneHref(phone: Text): string | null {
  const value = clean(phone)
  if (!value) {
    return null
  }
  const digits = value.replace(/\D/g, '')
  return `tel:${value.startsWith('+') ? '+' : ''}${digits}`
}

/** `wa.me` link for an E.164 number with an optional prefilled message (RF-WEB-04). */
export function whatsappHref(number: Text, message?: Text): string | null {
  const digits = clean(number).replace(/\D/g, '')
  if (!digits) {
    return null
  }
  const text = clean(message)
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Address as display lines: street, postal code and city, region, country. */
export function addressLines(address: Address | null | undefined): string[] {
  if (!address) {
    return []
  }
  return [
    clean(address.street),
    [clean(address.postalCode), clean(address.city)].filter(Boolean).join(' '),
    clean(address.region),
    clean(address.country),
  ].filter(Boolean)
}

/**
 * "Get directions" link: the configured Google Maps URL or, without one, a
 * Google Maps search for the address (Maps URLs API).
 */
export function mapsHref(address: Address | null | undefined): string | null {
  const configured = clean(address?.mapsUrl)
  if (configured) {
    return configured
  }
  const lines = addressLines(address)
  if (!lines.length) {
    return null
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lines.join(', '))}`
}
