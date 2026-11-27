import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import { expect, type Page, test } from '@playwright/test'
import type { Payload } from 'payload'

import { connectPayload, createE2EUser, deleteE2EUser, loginAsE2EUser } from './helpers/adminUser'
import {
  adminApi,
  expectNoHorizontalScroll,
  expectNoSeriousA11yViolations,
  expectPublished,
} from './helpers/publicSite'

const E2E_EMAIL = 'e2e-site@example.com'
const NAME = `Casa E2E ${Date.now()}`
const SEO_TITLE = `${NAME} · Cocina de mercado`
const SEO_DESCRIPTION = 'Cocina de mercado en el centro de Madrid.'

let payload: Payload
let previousVersionId: string | undefined

async function saveSiteSettings(page: Page, data: Record<string, unknown>): Promise<void> {
  await adminApi(page, 'POST', '/api/globals/site-settings?locale=es', data)
}

test.describe('public site layout (RF-WEB-03, RF-WEB-04, RF-WEB-06, RF-I18N-04)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    payload = await connectPayload()
    await createE2EUser(payload, E2E_EMAIL)
    // Remember the current content of the development database to restore it.
    const versions = await payload.findGlobalVersions({
      slug: 'site-settings',
      sort: '-updatedAt',
      limit: 1,
    })
    previousVersionId = versions.docs[0] ? String(versions.docs[0].id) : undefined
  })

  test.afterAll(async () => {
    if (!payload) {
      return
    }
    if (previousVersionId) {
      await payload.restoreGlobalVersion({ slug: 'site-settings', id: previousVersionId })
    } else {
      // The settings were never saved: return them to that state (child tables cascade).
      const db = payload.db as unknown as PostgresAdapter
      await db.drizzle.execute(sql`DELETE FROM "_site_settings_v"; DELETE FROM "site_settings";`)
    }
    await deleteE2EUser(payload, E2E_EMAIL)
  })

  test('shows the restaurant information in the header and footer, in both languages', async ({
    page,
  }) => {
    await loginAsE2EUser(page, E2E_EMAIL)
    await saveSiteSettings(page, {
      name: NAME,
      contact: {
        phone: '+34 910 000 000',
        email: 'hola@example.com',
        whatsappNumber: '+34600111222',
        whatsappMessage: 'Hola',
      },
      location: { street: 'Calle Mayor 1', postalCode: '28013', city: 'Madrid', mapsUrl: '' },
      openingHours: { slots: [{ day: 'monday', opens: '13:00', closes: '16:00' }] },
      socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/example' }],
      seo: { title: SEO_TITLE, description: SEO_DESCRIPTION },
    })

    await expectPublished(page, '/es', async () => {
      await expect(page.getByRole('banner').getByRole('link', { name: NAME })).toBeVisible({
        timeout: 1_000,
      })
    })

    const footer = page.getByRole('contentinfo')
    await expect(page.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    await expect(footer.getByText('13:00–16:00')).toBeVisible()
    await expect(footer.getByText('Cerrado')).toHaveCount(6)
    await expect(footer.getByRole('link', { name: '+34 910 000 000' })).toHaveAttribute(
      'href',
      'tel:+34910000000',
    )
    await expect(footer.getByRole('link', { name: 'Cómo llegar' })).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Calle%20Mayor%201/,
    )
    await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/example',
    )
    await expect(page.getByTestId('whatsapp-button')).toHaveAttribute(
      'href',
      'https://wa.me/34600111222?text=Hola',
    )

    await page.goto('/en')
    await expect(page.getByRole('contentinfo').getByText('Closed')).toHaveCount(6)
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Get directions' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  test('hides the WhatsApp button when there is no number (RF-WEB-04)', async ({ page }) => {
    await loginAsE2EUser(page, E2E_EMAIL)
    await saveSiteSettings(page, { name: NAME, contact: { whatsappNumber: '' } })

    await expectPublished(page, '/es', async () => {
      await expect(page.getByTestId('whatsapp-button')).toHaveCount(0, { timeout: 1_000 })
    })
  })

  test('publishes title, description, canonical, hreflang, Open Graph and JSON-LD (US-F3, US-F5 CA4)', async ({
    page,
  }) => {
    await page.goto('/es')
    const origin = new URL(page.url()).origin
    const head = page.locator('head')

    await expect(page).toHaveTitle(SEO_TITLE)
    await expect(head.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      SEO_DESCRIPTION,
    )
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/es`)
    for (const [hreflang, path] of [
      ['es', '/es'],
      ['en', '/en'],
      ['x-default', '/es'],
    ]) {
      await expect(head.locator(`link[rel="alternate"][hreflang="${hreflang}"]`)).toHaveAttribute(
        'href',
        `${origin}${path}`,
      )
    }
    await expect(head.locator('meta[property="og:title"]')).toHaveAttribute('content', SEO_TITLE)
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_ES')
    await expect(head.locator('meta[property="og:url"]')).toHaveAttribute('content', `${origin}/es`)

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    )
    expect(jsonLd).toMatchObject({
      '@type': 'Restaurant',
      name: NAME,
      telephone: '+34910000000',
      url: `${origin}/es`,
      hasMenu: `${origin}/es/menu`,
      address: { streetAddress: 'Calle Mayor 1', addressLocality: 'Madrid' },
    })

    await page.goto('/en/menu')
    await expect(page).toHaveTitle(`Menu | ${NAME}`)
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/en/menu`)
    await expect(head.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute(
      'href',
      `${origin}/es/menu`,
    )
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_IE')
  })

  test('serves sitemap.xml and robots.txt (US-F3 CA2)', async ({ page }) => {
    await page.goto('/es')
    const origin = new URL(page.url()).origin

    const sitemap = await page.request.get('/sitemap.xml')
    expect(sitemap.ok()).toBe(true)
    const xml = await sitemap.text()
    for (const path of ['/es', '/en', '/es/menu', '/en/menu']) {
      expect(xml).toContain(`<loc>${origin}${path}</loc>`)
    }
    expect(xml).toContain(`hreflang="x-default" href="${origin}/es/menu"`)
    expect(xml).not.toContain('/admin')

    const robots = await page.request.get('/robots.txt')
    expect(robots.ok()).toBe(true)
    const text = await robots.text()
    expect(text).toContain('Disallow: /admin')
    expect(text).toContain('Disallow: /api')
    expect(text).toContain(`Sitemap: ${origin}/sitemap.xml`)
  })

  test('switches language and keeps the current page (US-F5 CA1)', async ({ page }) => {
    await page.goto('/es')
    await page.getByRole('link', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.getByRole('link', { name: 'Español' }).click()
    await expect(page).toHaveURL(/\/es$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })

  test('shows styled 404 pages (RF-WEB-06)', async ({ page }) => {
    const insideLocale = await page.goto('/es/no-existe')
    expect(insideLocale?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()

    const unknownRoute = await page.goto('/xx/yy')
    expect(unknownRoute?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()
  })

  test('fits a 360 px screen without horizontal scrolling (RNF-03)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    for (const path of ['/es', '/en']) {
      await page.goto(path)
      await expectNoHorizontalScroll(page)
    }
  })

  test('has no serious accessibility violations (RNF-02)', async ({ page }) => {
    for (const path of ['/es', '/en', '/es/no-existe', '/xx/yy']) {
      await page.goto(path)
      await expectNoSeriousA11yViolations(page)
    }
  })
})
