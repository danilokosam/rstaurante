import { describe, expect, it } from 'vitest'

import { restaurantJsonLd, serializeJsonLd } from '@/lib/jsonLd'

const BASE = 'https://casapepe.example'

describe('restaurantJsonLd (RF-WEB-05, US-F3 CA3)', () => {
  it('describes the restaurant with address, phone, hours, menu and social profiles', () => {
    const jsonLd = restaurantJsonLd({
      baseUrl: BASE,
      locale: 'es',
      name: 'Casa Pepe',
      description: 'Cocina de mercado.',
      image: `${BASE}/api/media/file/hero.webp`,
      settings: {
        contact: { phone: '+34 910 000 000', email: 'hola@casapepe.example' },
        location: {
          street: 'Calle Mayor 1',
          postalCode: '28013',
          city: 'Madrid',
          region: 'Madrid',
          country: 'ES',
        },
        openingHours: {
          slots: [
            { day: 'friday', opens: '20:00', closes: '01:00' },
            { day: 'monday', opens: '13:00', closes: '16:00' },
          ],
        },
        socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/casapepe' }],
      },
    })

    expect(jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'Casa Pepe',
      description: 'Cocina de mercado.',
      url: `${BASE}/es`,
      hasMenu: `${BASE}/es/menu`,
      image: `${BASE}/api/media/file/hero.webp`,
      telephone: '+34910000000',
      email: 'hola@casapepe.example',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Calle Mayor 1',
        postalCode: '28013',
        addressLocality: 'Madrid',
        addressRegion: 'Madrid',
        addressCountry: 'ES',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'https://schema.org/Monday',
          opens: '13:00',
          closes: '16:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'https://schema.org/Friday',
          opens: '20:00',
          closes: '01:00',
        },
      ],
      sameAs: ['https://www.instagram.com/casapepe'],
    })
  })

  it('leaves out every field without content', () => {
    expect(
      restaurantJsonLd({
        baseUrl: `${BASE}/`,
        locale: 'en',
        name: 'Casa Pepe',
        description: null,
        image: null,
        settings: { contact: { phone: '' }, location: {}, openingHours: { slots: [] } },
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'Casa Pepe',
      url: `${BASE}/en`,
      hasMenu: `${BASE}/en/menu`,
    })
  })
})

describe('serializeJsonLd', () => {
  it('escapes "<" so content can never close the script tag', () => {
    const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual({ name: '</script><script>alert(1)</script>' })
  })
})
