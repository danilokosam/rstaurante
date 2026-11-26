/** Image MIME types accepted by the media library (RF-MEDIA-01). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

const startsWith = (data: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  data.length >= offset + signature.length &&
  signature.every((byte, index) => data[offset + index] === byte)

const ascii = (text: string): number[] => Array.from(text, (char) => char.charCodeAt(0))

const JPEG = [0xff, 0xd8, 0xff]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const RIFF = ascii('RIFF')
const WEBP = ascii('WEBP')
const FTYP = ascii('ftyp')
const AVIF_BRANDS = [ascii('avif'), ascii('avis')]

/**
 * Detects an allowed image type from the file's first bytes (magic bytes),
 * ignoring the file name and the MIME type declared by the client.
 * Returns `null` for anything that is not JPEG, PNG, WebP or AVIF.
 */
export function detectImageType(data: Uint8Array): AllowedImageType | null {
  if (startsWith(data, JPEG)) {
    return 'image/jpeg'
  }
  if (startsWith(data, PNG)) {
    return 'image/png'
  }
  if (startsWith(data, RIFF) && startsWith(data, WEBP, 8)) {
    return 'image/webp'
  }
  if (isAvif(data)) {
    return 'image/avif'
  }
  return null
}

/**
 * AVIF is an ISO BMFF file whose leading `ftyp` box lists `avif` or `avis`
 * as its major brand (offset 8) or as a compatible brand (offset 16 to the
 * end of the box, 4 bytes each; offset 12 is the minor version).
 */
function isAvif(data: Uint8Array): boolean {
  if (!startsWith(data, FTYP, 4)) {
    return false
  }
  const boxSize = ((data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3]) >>> 0
  const boxEnd = Math.min(boxSize, data.length)
  const brandOffsets = [8]
  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    brandOffsets.push(offset)
  }
  return brandOffsets.some((offset) =>
    AVIF_BRANDS.some((brand) => offset + 4 <= boxEnd && startsWith(data, brand, offset)),
  )
}
