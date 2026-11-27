import Link from 'next/link'

import { CmsImage } from '@/components/CmsImage'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { PublicDish } from '@/lib/content'
import { localizedPath } from '@/lib/localePath'
import { formatPrice } from '@/lib/price'

import { Section } from './Section'

type Props = {
  title: string
  dishes: PublicDish[]
  locale: Locale
  dictionary: Dictionary
}

/** Up to 6 featured dishes in menu order (US-E4). */
export function Featured({ title, dishes, locale, dictionary }: Props) {
  return (
    <Section id="featured" title={title}>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((dish) => (
          <li key={dish.id} className="overflow-hidden rounded border border-line bg-surface">
            {dish.image ? (
              <CmsImage
                image={dish.image}
                size="card"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[4/3] h-auto w-full object-cover"
              />
            ) : null}
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-semibold">{dish.name}</h3>
                <p className="font-semibold tabular-nums">{formatPrice(dish.price, locale)}</p>
              </div>
              {dish.unavailable ? (
                <p className="mt-1 text-sm font-medium text-ink-muted">
                  {dictionary.menu.unavailable}
                </p>
              ) : null}
              {dish.description ? (
                <p className="mt-2 line-clamp-3 text-ink-muted">{dish.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link
          href={localizedPath(locale, 'menu')}
          className="rounded text-accent underline underline-offset-4 hover:no-underline"
        >
          {dictionary.menu.viewAll}
          <span aria-hidden="true"> →</span>
        </Link>
      </p>
    </Section>
  )
}
