import { describe, expect, it } from 'vitest'

import { buildPublicFileUrl, buildS3StorageOptions } from '@/lib/storage/s3Options'

const s3 = {
  endpoint: 'https://abc.storage.supabase.co/storage/v1/s3',
  region: 'eu-west-3',
  bucket: 'media',
  accessKeyId: 'key-id',
  secretAccessKey: 'very-secret-value',
  publicUrl: 'https://abc.supabase.co/storage/v1/object/public/media',
}

describe('buildPublicFileUrl', () => {
  it('joins the public bucket URL and the file name', () => {
    expect(buildPublicFileUrl(s3.publicUrl, 'paella.webp')).toBe(`${s3.publicUrl}/paella.webp`)
  })

  it('includes the prefix and tolerates extra slashes', () => {
    expect(buildPublicFileUrl(`${s3.publicUrl}/`, 'paella.webp', '/2026/')).toBe(
      `${s3.publicUrl}/2026/paella.webp`,
    )
  })

  it('encodes each path segment', () => {
    expect(buildPublicFileUrl(s3.publicUrl, 'paella de marisco #1.webp')).toBe(
      `${s3.publicUrl}/paella%20de%20marisco%20%231.webp`,
    )
  })
})

describe('buildS3StorageOptions (ADR-0004)', () => {
  it('disables the plugin without S3 configuration (local disk in dev and tests)', () => {
    const options = buildS3StorageOptions(null)

    expect(options.enabled).toBe(false)
    // Same database schema with and without S3, so migrations work everywhere.
    expect(options.alwaysInsertFields).toBe(true)
  })

  it('configures the S3-compatible Supabase endpoint for the media collection', () => {
    const options = buildS3StorageOptions(s3)

    expect(options).toMatchObject({
      enabled: true,
      alwaysInsertFields: true,
      bucket: 'media',
      config: {
        endpoint: s3.endpoint,
        region: 'eu-west-3',
        forcePathStyle: true,
        credentials: { accessKeyId: 'key-id', secretAccessKey: 'very-secret-value' },
      },
    })
  })

  it('serves files straight from the public bucket URL, not through the app', async () => {
    const media = buildS3StorageOptions(s3).collections.media

    expect(media).toMatchObject({ disablePayloadAccessControl: true })
    const url = await (media as { generateFileURL: (args: object) => string }).generateFileURL({
      filename: 'paella.webp',
      prefix: '',
    })
    expect(url).toBe(`${s3.publicUrl}/paella.webp`)
  })
})
