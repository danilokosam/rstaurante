import type { TimeSlot } from '@/lib/validation/time'

export const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type WeekDay = (typeof WEEK_DAYS)[number]

export type OpeningSlot = TimeSlot & { day: WeekDay }

export type DayHours = { day: WeekDay; slots: TimeSlot[] }

/**
 * Opening hours for display: every day from Monday to Sunday with its slots
 * sorted by opening time; a day without slots is closed. With no slots at all
 * the list is empty, so the section is not rendered.
 */
export function groupOpeningHours(slots: readonly OpeningSlot[] | null | undefined): DayHours[] {
  if (!slots?.length) {
    return []
  }
  return WEEK_DAYS.map((day) => ({
    day,
    slots: slots
      .filter((slot) => slot.day === day)
      .map(({ opens, closes }) => ({ opens, closes }))
      .sort((a, b) => a.opens.localeCompare(b.opens)),
  }))
}

/** `13:00–16:00`; a closing time earlier than the opening one ends after midnight. */
export function formatSlot(slot: TimeSlot): string {
  return `${slot.opens}–${slot.closes}`
}
