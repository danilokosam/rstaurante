import { describe, expect, it } from 'vitest'

import { heroCtaHref, paragraphs } from '@/lib/home'

describe('paragraphs (about text: blank lines separate paragraphs, no HTML)', () => {
  it('splits on blank lines, trims and drops empty paragraphs', () => {
    expect(paragraphs('Primero.\n\nSegundo\ncon salto.\n\n\n  Tercero.  ')).toEqual([
      'Primero.',
      'Segundo\ncon salto.',
      'Tercero.',
    ])
    expect(paragraphs('Uno.\r\n\r\nDos.')).toEqual(['Uno.', 'Dos.'])
  })

  it.each([null, undefined, '', '  \n\n '])('returns no paragraphs for %j', (text) => {
    expect(paragraphs(text)).toEqual([])
  })
})

describe('heroCtaHref (RF-HOME-01)', () => {
  const contact = {
    phone: '+34 910 000 000',
    whatsappNumber: '+34600111222',
    whatsappMessage: 'Hola',
  }

  it('has no button without a label', () => {
    expect(heroCtaHref({ label: '  ', action: 'menu' }, contact, 'es')).toBeNull()
    expect(heroCtaHref(undefined, contact, 'es')).toBeNull()
  })

  it('links to the menu of the page language (default action)', () => {
    expect(heroCtaHref({ label: 'Ver carta', action: 'menu' }, contact, 'es')).toBe('/es/menu')
    expect(heroCtaHref({ label: 'See menu', action: null }, contact, 'en')).toBe('/en/menu')
  })

  it('opens WhatsApp only when a number is configured', () => {
    expect(heroCtaHref({ label: 'Escríbenos', action: 'whatsapp' }, contact, 'es')).toBe(
      'https://wa.me/34600111222?text=Hola',
    )
    expect(heroCtaHref({ label: 'Escríbenos', action: 'whatsapp' }, {}, 'es')).toBeNull()
  })

  it('calls the restaurant only when a phone is configured', () => {
    expect(heroCtaHref({ label: 'Llámanos', action: 'phone' }, contact, 'es')).toBe(
      'tel:+34910000000',
    )
    expect(heroCtaHref({ label: 'Llámanos', action: 'phone' }, { phone: '' }, 'es')).toBeNull()
  })

  it('opens an external https URL', () => {
    expect(
      heroCtaHref(
        { label: 'Reservar', action: 'external', url: 'https://example.com/reservas' },
        contact,
        'es',
      ),
    ).toBe('https://example.com/reservas')
    expect(
      heroCtaHref({ label: 'Reservar', action: 'external', url: '' }, contact, 'es'),
    ).toBeNull()
    expect(
      heroCtaHref(
        { label: 'Reservar', action: 'external', url: 'http://example.com' },
        contact,
        'es',
      ),
    ).toBeNull()
  })
})
