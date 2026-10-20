import { describe, it, expect } from 'vitest'
import {
  calculateRoomAvailability,
  buildDailyTimetable,
  detectScheduleConflicts,
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  type AvailabilityContext,
} from '@/lib/availability'
import type { Room, RoomSchedule, ScheduleException } from '@/types'

const baseRoom: Room = {
  id: 'test-room-1',
  number: '101',
  name: 'Classroom 101',
  category: 'classroom',
  buildingId: 'b1',
  floor: 1,
  facilities: ['AC', 'Projector'],
  openTime: '08:00',
  closeTime: '20:00',
  isActive: true,
  isTemporaryClosed: false,
  scheduleVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const sampleSchedule: RoomSchedule = {
  id: 'sch-1',
  roomId: 'test-room-1',
  title: 'CSE-101: Intro to Programming',
  instructorName: 'Dr. Alan Turing',
  dayOfWeek: 'sunday',
  startTime: '10:00',
  endTime: '11:30',
  isRecurring: true,
  bufferAfterMinutes: 10,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

// Helper to make a date on a Sunday at specific HH:mm
function makeSunday(timeStr: string): Date {
  // 2024-01-14 is a Sunday
  return new Date(`2024-01-14T${timeStr}:00`)
}

describe('Availability Engine — Core Rules', () => {
  it('1. Before a booking: Room should be Available', () => {
    const now = makeSunday('09:00') // 1 hour before 10:00 booking
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('available')
    expect(result.nextSchedule?.id).toBe('sch-1')
  })

  it('2. Upcoming interval: Within buffer minutes (e.g. 15 mins before), status should be Upcoming', () => {
    const now = makeSunday('09:50') // 10 mins before 10:00
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('upcoming')
    expect(result.nextSchedule?.title).toBe('CSE-101: Intro to Programming')
  })

  it('3. During a booking: Room should be Occupied', () => {
    const now = makeSunday('10:30') // inside 10:00 - 11:30
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('occupied')
    expect(result.currentSchedule?.id).toBe('sch-1')
    expect(result.nextAvailableTime).toBe('11:40') // 11:30 + 10m buffer
  })

  it('4. After a booking: Room should be Available again', () => {
    const now = makeSunday('11:45') // after 11:30 + 10m buffer
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('available')
  })

  it('5. Between two bookings: Room is available in the gap', () => {
    const secondSchedule: RoomSchedule = {
      ...sampleSchedule,
      id: 'sch-2',
      startTime: '13:00',
      endTime: '14:30',
    }

    const now = makeSunday('12:00') // between 11:30 and 13:00
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule, secondSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('available')
    expect(result.nextSchedule?.id).toBe('sch-2')
  })

  it('6. Outside operating hours: Early morning and night should be Closed', () => {
    const early = makeSunday('06:30')
    const late = makeSunday('21:00')

    const resEarly = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now: early,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })
    expect(resEarly.status).toBe('closed')

    const resLate = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now: late,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })
    expect(resLate.status).toBe('closed')
  })

  it('7. Temporary closure: Maintenance overrides schedule to maintenance status', () => {
    const maintenanceRoom: Room = {
      ...baseRoom,
      isTemporaryClosed: true,
      temporaryClosureReason: 'HVAC repair',
    }

    const now = makeSunday('10:30') // inside booking time
    const result = calculateRoomAvailability({
      room: maintenanceRoom,
      schedules: [sampleSchedule],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('maintenance')
  })

  it('8. Cancelled booking exception: Booking is nullified and room remains Available', () => {
    const cancellationException: ScheduleException = {
      id: 'exc-cancel-1',
      roomId: 'test-room-1',
      type: 'cancellation',
      title: 'Class cancelled due to faculty seminar',
      date: '2024-01-14',
      affectedScheduleId: 'sch-1',
      createdAt: '2024-01-01T00:00:00Z',
    }

    const now = makeSunday('10:30') // during cancelled booking time
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [cancellationException],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('available')
  })

  it('9. Specific-date one-time booking: Takes precedence and marks room Occupied', () => {
    const oneTimeException: ScheduleException = {
      id: 'exc-booking-1',
      roomId: 'test-room-1',
      type: 'one_time_booking',
      title: 'Emergency Department Meeting',
      date: '2024-01-14',
      startTime: '14:00',
      endTime: '16:00',
      createdAt: '2024-01-01T00:00:00Z',
    }

    const now = makeSunday('14:30') // inside one-time booking
    const result = calculateRoomAvailability({
      room: baseRoom,
      schedules: [sampleSchedule],
      exceptions: [oneTimeException],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('occupied')
  })

  it('10. Unverified schedule data: Shows "unknown" (Availability unverified)', () => {
    const unverifiedRoom: Room = {
      ...baseRoom,
      scheduleVerified: false,
    }

    const now = makeSunday('10:30')
    const result = calculateRoomAvailability({
      room: unverifiedRoom,
      schedules: [],
      exceptions: [],
      now,
      defaultOpenTime: '08:00',
      defaultCloseTime: '20:00',
      upcomingBufferMinutes: 15,
    })

    expect(result.status).toBe('unknown')
    expect(result.isVerified).toBe(false)
  })
})

describe('Conflict Detection Engine', () => {
  it('Detects schedule overlap on the same day', () => {
    const overlappingSchedule: RoomSchedule = {
      ...sampleSchedule,
      id: 'sch-overlap',
      startTime: '11:00', // overlaps with 10:00-11:30
      endTime: '12:30',
    }

    const conflicts = detectScheduleConflicts([sampleSchedule, overlappingSchedule])
    expect(conflicts.hasConflict).toBe(true)
    expect(conflicts.conflictingSchedules.length).toBe(1)
  })

  it('Detects overlap during buffer time', () => {
    // sampleSchedule ends at 11:30 with 10m buffer = 11:40
    const bufferOverlapSchedule: RoomSchedule = {
      ...sampleSchedule,
      id: 'sch-buf-overlap',
      startTime: '11:35', // within buffer period
      endTime: '12:30',
    }

    const conflicts = detectScheduleConflicts([sampleSchedule, bufferOverlapSchedule])
    expect(conflicts.hasConflict).toBe(true)
  })

  it('No conflict when schedules are on different days or consecutive without overlap', () => {
    const nextDaySchedule: RoomSchedule = {
      ...sampleSchedule,
      id: 'sch-mon',
      dayOfWeek: 'monday',
      startTime: '10:00',
      endTime: '11:30',
    }

    const conflicts = detectScheduleConflicts([sampleSchedule, nextDaySchedule])
    expect(conflicts.hasConflict).toBe(false)
  })
})

describe('Timetable Builder', () => {
  it('Builds full-day timetable with free and occupied slots', () => {
    const date = makeSunday('12:00')
    const slots = buildDailyTimetable(
      baseRoom,
      [sampleSchedule],
      [],
      date,
      '08:00',
      '20:00'
    )

    // Expected slots:
    // 08:00 - 10:00 available
    // 10:00 - 11:30 occupied
    // 11:40 - 20:00 available
    expect(slots.length).toBeGreaterThanOrEqual(3)
    expect(slots[0].status).toBe('available')
    expect(slots[0].startTime).toBe('08:00')
    expect(slots[0].endTime).toBe('10:00')

    expect(slots[1].status).toBe('occupied')
    expect(slots[1].title).toBe('CSE-101: Intro to Programming')

    expect(slots[2].status).toBe('available')
  })
})

describe('Time Math Utilities', () => {
  it('Converts HH:mm to minutes and back accurately', () => {
    expect(timeToMinutes('08:30')).toBe(510)
    expect(minutesToTime(510)).toBe('08:30')
    expect(timeToMinutes('00:00')).toBe(0)
    expect(minutesToTime(0)).toBe('00:00')
    expect(timeToMinutes('23:59')).toBe(1439)
    expect(minutesToTime(1439)).toBe('23:59')
  })

  it('Calculates time overlap accurately', () => {
    expect(timeRangesOverlap(600, 690, 630, 720)).toBe(true)
    expect(timeRangesOverlap(600, 690, 690, 750)).toBe(false) // exact boundary
    expect(timeRangesOverlap(600, 690, 700, 750)).toBe(false) // disjoint
  })
})
