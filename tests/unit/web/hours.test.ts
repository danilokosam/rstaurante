import { describe, expect, it } from 'vitest'

import { formatSlot, groupOpeningHours, WEEK_DAYS } from '@/lib/hours'

describe('opening hours (RF-WEB-03, US-B4)', () => {
  it('lists the seven days from Monday to Sunday', () => {
    expect(WEEK_DAYS).toEqual([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ])
  })

  it('groups slots by day in week order, sorted by opening time, with empty days closed', () => {
    const grouped = groupOpeningHours([
      { day: 'friday', opens: '20:00', closes: '23:30' },
      { day: 'monday', opens: '13:00', closes: '16:00' },
      { day: 'friday', opens: '13:00', closes: '16:00' },
    ])

    expect(grouped.map((entry) => entry.day)).toEqual(WEEK_DAYS)
    expect(grouped[0]).toEqual({ day: 'monday', slots: [{ opens: '13:00', closes: '16:00' }] })
    expect(grouped[1]).toEqual({ day: 'tuesday', slots: [] })
    expect(grouped[4]).toEqual({
      day: 'friday',
      slots: [
        { opens: '13:00', closes: '16:00' },
        { opens: '20:00', closes: '23:30' },
      ],
    })
  })

  it('returns an empty list when there are no slots at all (section hidden)', () => {
    expect(groupOpeningHours([])).toEqual([])
    expect(groupOpeningHours(null)).toEqual([])
    expect(groupOpeningHours(undefined)).toEqual([])
  })

  it('formats a slot, including one that ends after midnight', () => {
    expect(formatSlot({ opens: '13:00', closes: '16:00' })).toBe('13:00–16:00')
    expect(formatSlot({ opens: '20:00', closes: '02:00' })).toBe('20:00–02:00')
  })
})
