import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Images served from external storage (Supabase Storage, ADR-0004) when configured.
const s3PublicUrl = process.env.S3_PUBLIC_URL?.replace(/\/+$/, '')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Styled 404 for URLs that match no route: the root layouts live under
    // [locale] and (payload), so there is no single layout to compose it from.
    globalNotFound: true,
  },
  async redirects() {
    // The public site always lives under a locale prefix (ADR-0010).
    return [{ source: '/', destination: '/es', permanent: false }]
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: s3PublicUrl ? [new URL(`${s3PublicUrl}/**`)] : [],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
