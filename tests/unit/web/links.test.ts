import { describe, expect, it } from 'vitest'

import { addressLines, mapsHref, phoneHref, whatsappHref } from '@/lib/links'

describe('contact links (US-F2 CA1, RF-WEB-04)', () => {
  it.each([
    ['+34 600 11 12 22', 'tel:+34600111222'],
    ['(91) 123-45-67', 'tel:911234567'],
  ])('builds a tel: link from %s', (phone, expected) => {
    expect(phoneHref(phone)).toBe(expected)
  })

  it.each([null, undefined, '', '   '])('has no phone link without a phone (%s)', (phone) => {
    expect(phoneHref(phone)).toBeNull()
  })

  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappHref('+34600111222')).toBe('https://wa.me/34600111222')
    expect(whatsappHref('+34600111222', 'Hola, ¿tenéis mesa?')).toBe(
      'https://wa.me/34600111222?text=Hola%2C%20%C2%BFten%C3%A9is%20mesa%3F',
    )
    expect(whatsappHref('+34600111222', '  ')).toBe('https://wa.me/34600111222')
  })

  it.each([null, undefined, ''])('has no WhatsApp link without a number (%s)', (number) => {
    expect(whatsappHref(number, 'Hola')).toBeNull()
  })

  it('uses the configured Google Maps URL first', () => {
    expect(
      mapsHref({ mapsUrl: 'https://maps.app.goo.gl/abc', street: 'Calle Mayor 1', city: 'Madrid' }),
    ).toBe('https://maps.app.goo.gl/abc')
  })

  it('generates a Google Maps search link from the address when there is no URL', () => {
    expect(
      mapsHref({ street: 'Calle Mayor 1', postalCode: '28013', city: 'Madrid', country: 'España' }),
    ).toBe(
      'https://www.google.com/maps/search/?api=1&query=Calle%20Mayor%201%2C%2028013%20Madrid%2C%20Espa%C3%B1a',
    )
  })

  it('has no Maps link without URL or address', () => {
    expect(mapsHref({})).toBeNull()
    expect(mapsHref(undefined)).toBeNull()
    expect(mapsHref({ street: ' ', city: null })).toBeNull()
  })

  it('formats the address as display lines, skipping empty parts', () => {
    expect(
      addressLines({
        street: 'Calle Mayor 1',
        postalCode: '28013',
        city: 'Madrid',
        region: 'Madrid',
        country: 'España',
      }),
    ).toEqual(['Calle Mayor 1', '28013 Madrid', 'Madrid', 'España'])
    expect(addressLines({ city: 'Sevilla' })).toEqual(['Sevilla'])
    expect(addressLines(undefined)).toEqual([])
  })
})
