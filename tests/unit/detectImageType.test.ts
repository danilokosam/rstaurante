import { describe, expect, it } from 'vitest'

import { detectImageType } from '@/lib/media/detectImageType'

const bytes = (...values: number[]) => Uint8Array.from(values)
const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0))

/** Builds an ISO BMFF `ftyp` box header with the given major brand. */
const ftyp = (brand: string) =>
  bytes(0x00, 0x00, 0x00, 0x1c, ...ascii('ftyp'), ...ascii(brand), 0, 0, 0, 0)

describe('detectImageType', () => {
  it('detects JPEG', () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10))).toBe('image/jpeg')
  })

  it('detects PNG', () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe(
      'image/png',
    )
  })

  it('detects WebP', () => {
    expect(detectImageType(bytes(...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WEBPVP8 ')))).toBe(
      'image/webp',
    )
  })

  it.each(['avif', 'avis'])('detects AVIF (brand %s)', (brand) => {
    expect(detectImageType(ftyp(brand))).toBe('image/avif')
  })

  it('detects AVIF declared only as a compatible brand (major brand mif1)', () => {
    const header = bytes(0x00, 0x00, 0x00, 0x18, ...ascii('ftyp'), ...ascii('mif1'), 0, 0, 0, 0)
    expect(detectImageType(Uint8Array.from([...header, ...ascii('miaf'), ...ascii('avif')]))).toBe(
      'image/avif',
    )
  })

  it('ignores brands outside the ftyp box', () => {
    const header = bytes(0x00, 0x00, 0x00, 0x14, ...ascii('ftyp'), ...ascii('mif1'), 0, 0, 0, 0)
    expect(
      detectImageType(Uint8Array.from([...header, ...ascii('miaf'), ...ascii('avif')])),
    ).toBeNull()
  })

  it.each([
    ['plain text renamed to .jpg', bytes(...ascii('hello, I am not an image'))],
    ['SVG', bytes(...ascii('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))],
    ['GIF', bytes(...ascii('GIF89a'), 0, 0)],
    ['HEIC', ftyp('heic')],
    ['RIFF that is not WebP (WAV)', bytes(...ascii('RIFF'), 0x24, 0, 0, 0, ...ascii('WAVEfmt '))],
    ['PDF', bytes(...ascii('%PDF-1.7'))],
    ['empty buffer', bytes()],
    ['truncated JPEG header', bytes(0xff, 0xd8)],
  ])('rejects %s', (_label, data) => {
    expect(detectImageType(data)).toBeNull()
  })
})
