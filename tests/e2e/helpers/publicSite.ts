import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

/**
 * Calls the REST API of the running server with the logged-in session, as the
 * admin panel does, so the on-save revalidation of the public site runs
 * (ADR-0007). Changes made with the Local API from the Playwright process do
 * not revalidate the production build used in CI.
 */
export async function adminApi<T = { doc?: { id: number } }>(
  page: Page,
  method: 'POST' | 'PATCH',
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  const response = await page.request.fetch(path, {
    method,
    data,
    headers: { origin: new URL(page.url()).origin },
  })
  expect(response.ok(), `${method} ${path}: ${await response.text()}`).toBe(true)
  return (await response.json()) as T
}

/** Reloads a page until the saved content is visible (RF-PUB-01: < 10 s). */
export async function expectPublished(
  page: Page,
  path: string,
  check: () => Promise<void>,
): Promise<void> {
  await expect(async () => {
    await page.goto(path)
    await check()
  }).toPass({ timeout: 10_000 })
}

/** No serious or critical WCAG 2.2 AA violations reported by axe (RNF-02). */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(serious.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
}

/** The page fits the viewport width without horizontal scrolling (RNF-03). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, page.url()).toBeLessThanOrEqual(0)
}
