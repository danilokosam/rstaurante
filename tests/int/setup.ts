import 'dotenv/config'

import { resolveTestDatabaseUrl } from '../helpers/testDatabase'

// Integration tests always run against the dedicated *_test database.
process.env.DATABASE_URL = resolveTestDatabaseUrl(process.env)
