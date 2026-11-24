import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { getEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const env = getEnv()

export default buildConfig({
  serverURL: env.serverUrl,
  secret: env.payloadSecret,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
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
    push: process.env.NODE_ENV === 'development',
  }),
  sharp,
  plugins: [],
})
