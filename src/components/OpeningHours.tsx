import type { Dictionary } from '@/i18n/dictionaries'
import { type DayHours, formatSlot } from '@/lib/hours'

type Props = {
  hours: DayHours[]
  dictionary: Dictionary
}

/** Opening hours from Monday to Sunday; days without slots are shown as closed. */
export function OpeningHours({ hours, dictionary }: Props) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
      {hours.map(({ day, slots }) => (
        <div key={day} className="contents">
          <dt className="font-medium">{dictionary.days[day]}</dt>
          <dd className="text-ink-muted">
            {slots.length ? slots.map(formatSlot).join(', ') : dictionary.hours.closed}
          </dd>
        </div>
      ))}
    </dl>
  )
}
