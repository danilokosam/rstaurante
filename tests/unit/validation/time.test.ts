import { describe, expect, it } from 'vitest'

import { crossesMidnight, validateTime, validateTimeSlot } from '@/lib/validation/time'

describe('validateTime', () => {
  it.each(['00:00', '09:30', '13:05', '23:59'])('accepts %s', (value) => {
    expect(validateTime(value)).toBe(true)
  })

  it.each(['24:00', '9:30', '12:60', '12.30', '1230', '', ' 12:30', undefined])(
    'rejects %s',
    (value) => {
      expect(validateTime(value)).toBe('La hora debe tener el formato HH:MM (de 00:00 a 23:59).')
    },
  )

  it('returns the message in English when requested', () => {
    expect(validateTime('25:00', 'en')).toBe('The time must use the HH:MM format (00:00 to 23:59).')
  })
})

describe('validateTimeSlot', () => {
  it('accepts a regular slot', () => {
    expect(validateTimeSlot({ opens: '13:00', closes: '16:00' })).toBe(true)
  })

  it('accepts a slot that crosses midnight', () => {
    expect(validateTimeSlot({ opens: '20:00', closes: '01:00' })).toBe(true)
  })

  it('rejects a slot that opens and closes at the same time', () => {
    expect(validateTimeSlot({ opens: '13:00', closes: '13:00' })).toBe(
      'La hora de apertura y la de cierre no pueden ser iguales.',
    )
  })

  it('reports an invalid time before comparing', () => {
    expect(validateTimeSlot({ opens: '13:00', closes: '25:00' })).toBe(
      'La hora debe tener el formato HH:MM (de 00:00 a 23:59).',
    )
  })

  it('returns the message in English when requested', () => {
    expect(validateTimeSlot({ opens: '13:00', closes: '13:00' }, 'en')).toBe(
      'Opening and closing times cannot be the same.',
    )
  })
})

describe('crossesMidnight', () => {
  it('is true when the slot closes before it opens', () => {
    expect(crossesMidnight({ opens: '20:00', closes: '01:00' })).toBe(true)
  })

  it('is false for a same-day slot', () => {
    expect(crossesMidnight({ opens: '13:00', closes: '16:00' })).toBe(false)
  })
})
