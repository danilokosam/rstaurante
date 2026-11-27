import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DishItem } from '@/components/DishItem'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getMenu, getSiteSettings } from '@/lib/content'
import { ogImage } from '@/lib/content/seo'
import { pageMetadata } from '@/lib/seo'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const dictionary = getDictionary(locale)
  const settings = await getSiteSettings(locale)
  const name = settings.name?.trim() || dictionary.site.defaultName
  return pageMetadata({
    locale,
    path: 'menu',
    title: dictionary.menu.title,
    description: dictionary.menu.metaDescription.replace('{name}', name),
    siteName: name,
    image: ogImage(settings.seo?.image),
  })
}

/**
 * Menu: visible categories with their non-hidden dishes in the panel order,
 * EUR prices in the page language, allergens as text and the allergy notice
 * (RF-WEB-02, US-E5).
 */
export default async function MenuPage({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const dictionary = getDictionary(locale)
  const menu = await getMenu(locale)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold">{dictionary.menu.title}</h1>

      {menu.length ? (
        <>
          <p
            role="note"
            className="mt-6 rounded border-l-4 border-accent bg-surface-muted px-4 py-3"
          >
            {dictionary.menu.allergyNotice}
          </p>

          {menu.length > 1 ? (
            <nav aria-label={dictionary.menu.categories} className="mt-8">
              <ul className="flex flex-wrap gap-2">
                {menu.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#category-${section.id}`}
                      className="block rounded border border-line px-3 py-2 text-sm hover:border-accent"
                    >
                      {section.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {menu.map((section) => (
            <section
              key={section.id}
              id={`category-${section.id}`}
              aria-labelledby={`category-${section.id}-title`}
              className="mt-12 scroll-mt-4"
            >
              <h2
                id={`category-${section.id}-title`}
                className="border-b-2 border-ink pb-2 text-2xl font-semibold"
              >
                {section.name}
              </h2>
              {section.description ? (
                <p className="mt-3 whitespace-pre-line text-ink-muted">{section.description}</p>
              ) : null}
              <ul>
                {section.dishes.map((dish) => (
                  <DishItem key={dish.id} dish={dish} locale={locale} dictionary={dictionary} />
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <p className="mt-6 text-lg text-ink-muted">{dictionary.menu.empty}</p>
      )}
    </div>
  )
}
