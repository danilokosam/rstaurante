import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { MAX_MEDIA_FILE_SIZE, Media } from './collections/Media'
import { Users } from './collections/Users'
import { Gallery } from './globals/Gallery'
import { Homepage } from './globals/Homepage'
import { SiteSettings } from './globals/SiteSettings'
import { defaultLocale, locales } from './i18n/config'
import { getEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = getEnv()

export default buildConfig({
  serverURL: env.serverUrl,
  cors: [env.serverUrl],
  csrf: [env.serverUrl],
  secret: env.payloadSecret,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    fallbackLanguage: defaultLocale,
    supportedLanguages: { es, en },
  },
  localization: {
    locales: [...locales],
    defaultLocale,
    fallback: true,
  },
  collections: [Users, Media],
  globals: [SiteSettings, Homepage, Gallery],
  // HTTP uploads above 4 MB are aborted with 413 before reaching the collection (RF-MEDIA-01).
  upload: {
    limits: { fileSize: MAX_MEDIA_FILE_SIZE },
  },
  // GraphQL is not used by this project: disabling it reduces the attack surface (ADR-0001).
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.databaseUrl,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema "push" only during local development. Tests and production use
    // versioned migrations so they are always exercised (ADR-0003).
    // The E2E dev server sets PAYLOAD_DISABLE_PUSH so it runs on the migrated
    // schema, like CI, and does not leave the database in "dev push" state.
    push: process.env.NODE_ENV === 'development' && process.env.PAYLOAD_DISABLE_PUSH !== 'true',
  }),
  sharp,
  plugins: [],
})
