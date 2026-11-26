import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'

import { resetDatabase } from '../helpers/resetDatabase'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  await resetDatabase(payload)
})

afterAll(async () => {
  await payload?.destroy()
})

describe('revalidation outside a Next.js request (real next/cache)', () => {
  it('saves without errors or error logs in scripts and tests', async () => {
    const logError = vi.spyOn(payload.logger, 'error')

    await expect(
      payload.updateGlobal({ slug: 'site-settings', data: { name: 'Casa Pepe' } }),
    ).resolves.toMatchObject({ name: 'Casa Pepe' })

    expect(logError).not.toHaveBeenCalled()
    logError.mockRestore()
  })
})
