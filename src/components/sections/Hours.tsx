import { OpeningHours } from '@/components/OpeningHours'
import type { Dictionary } from '@/i18n/dictionaries'
import type { DayHours } from '@/lib/hours'

import { Section } from './Section'

type Props = {
  title: string
  hours: DayHours[]
  note: string | null
  dictionary: Dictionary
}

/** Opening hours from Monday to Sunday, days without slots shown as closed. */
export function Hours({ title, hours, note, dictionary }: Props) {
  return (
    <Section id="hours" title={title}>
      <div className="max-w-md text-lg">
        <OpeningHours hours={hours} dictionary={dictionary} />
        {note ? <p className="mt-4 text-base text-ink-muted">{note}</p> : null}
      </div>
    </Section>
  )
}
