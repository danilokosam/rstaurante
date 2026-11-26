import type { S3StorageOptions } from '@payloadcms/storage-s3'

import type { S3Config } from '@/lib/env'

/** Public URL of a stored file: `<bucket public URL>/<prefix>/<filename>`. */
export function buildPublicFileUrl(publicUrl: string, filename: string, prefix = ''): string {
  const segments = [...prefix.split('/'), ...filename.split('/')]
    .filter(Boolean)
    .map(encodeURIComponent)
  return [publicUrl.replace(/\/+$/, ''), ...segments].join('/')
}

/**
 * Options of the official S3 storage plugin for Supabase Storage (ADR-0004).
 *
 * - Without S3 variables the plugin is disabled and Payload stores uploads on
 *   local disk (development and tests).
 * - `alwaysInsertFields` keeps the same database schema with and without S3,
 *   so migrations generated locally also apply in production.
 * - Images are public: they are served directly from the bucket's public URL
 *   instead of being proxied by the app (`disablePayloadAccessControl`).
 */
export function buildS3StorageOptions(s3: S3Config | null): S3StorageOptions {
  const common = { alwaysInsertFields: true } as const

  if (!s3) {
    return {
      ...common,
      enabled: false,
      bucket: '',
      config: {},
      collections: { media: true },
    }
  }

  return {
    ...common,
    enabled: true,
    bucket: s3.bucket,
    config: {
      endpoint: s3.endpoint,
      region: s3.region,
      forcePathStyle: true,
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
    },
    collections: {
      media: {
        disablePayloadAccessControl: true,
        generateFileURL: ({ filename, prefix }) =>
          buildPublicFileUrl(s3.publicUrl, filename, prefix),
      },
    },
  }
}
