import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = 3000
const baseURL = `http://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // CI tests the production build (built in a previous step); locally the dev server.
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
