import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { getAllergenLabels } from '@/lib/allergens'
import type { PublicDish } from '@/lib/content'
import { formatPrice } from '@/lib/price'

import { CmsImage } from './CmsImage'

type Props = {
  dish: PublicDish
  locale: Locale
  dictionary: Dictionary
}

/**
 * A dish of the menu: name, price, description, allergens as text and the
 * "unavailable" notice (RF-WEB-02, US-E3 CA1, US-E5 CA2/CA4). Unavailable
 * dishes use muted colors that still meet AA contrast, not opacity.
 */
export function DishItem({ dish, locale, dictionary }: Props) {
  const allergens = getAllergenLabels(dish.allergens, locale)
  return (
    <li className="flex gap-4 border-b border-line py-5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className={`text-lg font-semibold ${dish.unavailable ? 'text-ink-muted' : ''}`}>
            {dish.name}
          </h3>
          <p
            className={`font-semibold tabular-nums ${dish.unavailable ? 'text-ink-muted line-through' : ''}`}
          >
            {formatPrice(dish.price, locale)}
          </p>
        </div>
        {dish.unavailable ? (
          <p className="mt-1 inline-block rounded border border-line bg-surface-muted px-2 py-0.5 text-sm font-medium text-ink-muted">
            {dictionary.menu.unavailable}
          </p>
        ) : null}
        {dish.description ? (
          <p className="mt-1 whitespace-pre-line text-ink-muted">{dish.description}</p>
        ) : null}
        {allergens.length ? (
          <p className="mt-2 text-sm text-ink-muted">
            <span className="font-medium text-ink">{dictionary.menu.allergens}:</span>{' '}
            {allergens.join(', ')}
          </p>
        ) : null}
      </div>
      {dish.image ? (
        <CmsImage
          image={dish.image}
          size="thumbnail"
          sizes="96px"
          className="size-20 shrink-0 rounded object-cover sm:size-24"
        />
      ) : null}
    </li>
  )
}
