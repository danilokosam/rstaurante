import sharp from 'sharp'

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif'

/** Generates a real image of the given format with sharp. */
export async function makeImage(format: ImageFormat, width = 1000, height = 600): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 120, b: 40 } },
  })
    .toFormat(format)
    .toBuffer()
}

/** Builds the `file` argument of the Payload Local API. */
export function uploadFile(data: Buffer, name: string, mimetype: string) {
  return { data, name, mimetype, size: data.length }
}
