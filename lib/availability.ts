// ============================================================
// AVAILABILITY ENGINE
// Core deterministic room availability calculation service.
// Independently testable — no UI or framework dependencies.
// ============================================================

import type {
  Room,
  RoomSchedule,
  ScheduleException,
  RoomStatus,
  RoomAvailabilityResult,
  DayOfWeek,
  TimeSlot,
} from '@/types'

export interface AvailabilityContext {
  room: Room
  schedules: RoomSchedule[]
  exceptions: ScheduleException[]
  now: Date
  /** Default open/close if room doesn't override */
  defaultOpenTime: string
  defaultCloseTime: string
  upcomingBufferMinutes: number
}

// ─── Time helpers ─────────────────────────────────────────

/** Convert "HH:mm" to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Convert total minutes to "HH:mm" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Get ISO date string "YYYY-MM-DD" from a Date */
export function getISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Get day-of-week key from Date */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

/** Get "HH:mm" string from a Date */
export function getTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * Check if two time ranges overlap.
 * Ranges are [startA, endA) and [startB, endB) in minutes.
 */
export function timeRangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && endA > startB
}

// ─── Schedule filtering ───────────────────────────────────

/**
 * Get all schedules active on a specific date (day-of-week + date matching).
 * Recurring schedules match any date with the same day-of-week.
 * Non-recurring schedules only match their specific date.
 */
export function getSchedulesForDate(
  schedules: RoomSchedule[],
  date: Date,
): RoomSchedule[] {
  const dayOfWeek = getDayOfWeek(date)
  const isoDate = getISODate(date)

  return schedules.filter((s) => {
    if (!s.isActive) return false
    if (s.isRecurring) {
      return s.dayOfWeek === dayOfWeek
    } else {
      return s.specificDate === isoDate
    }
  })
}

/**
 * Get all exceptions applicable on a specific date.
 */
export function getExceptionsForDate(
  exceptions: ScheduleException[],
  date: Date,
): ScheduleException[] {
  const isoDate = getISODate(date)
  return exceptions.filter((e) => e.date === isoDate)
}

// ─── Conflict Detection ───────────────────────────────────

export interface ConflictResult {
  hasConflict: boolean
  conflictingSchedules: Array<[RoomSchedule, RoomSchedule]>
}

export function detectScheduleConflicts(schedules: RoomSchedule[]): ConflictResult {
  const conflicts: Array<[RoomSchedule, RoomSchedule]> = []

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i]
      const b = schedules[j]

      // Only check conflicts for same day
      const sameDayRecurring =
        a.isRecurring && b.isRecurring && a.dayOfWeek === b.dayOfWeek
      const sameSpecificDate =
        !a.isRecurring && !b.isRecurring && a.specificDate === b.specificDate
      const mixedSameDay =
        (a.isRecurring && !b.isRecurring && a.dayOfWeek === getDayOfWeekFromDate(b.specificDate!)) ||
        (!a.isRecurring && b.isRecurring && b.dayOfWeek === getDayOfWeekFromDate(a.specificDate!))

      if (!sameDayRecurring && !sameSpecificDate && !mixedSameDay) continue

      const startA = timeToMinutes(a.startTime)
      const endA = timeToMinutes(a.endTime) + a.bufferAfterMinutes
      const startB = timeToMinutes(b.startTime)
      const endB = timeToMinutes(b.endTime) + b.bufferAfterMinutes

      if (timeRangesOverlap(startA, endA, startB, endB)) {
        conflicts.push([a, b])
      }
    }
  }

  return { hasConflict: conflicts.length > 0, conflictingSchedules: conflicts }
}

function getDayOfWeekFromDate(isoDate: string): DayOfWeek {
  const d = new Date(isoDate + 'T12:00:00')
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[d.getDay()]
}

// ─── Core Availability Calculation ────────────────────────

/**
 * Calculate room availability at a specific point in time.
 *
 * Priority rules:
 * 1. If room is inactive → closed
 * 2. If room has temporary closure → closed (maintenance)
 * 3. If schedule unverified → unknown
 * 4. If outside operating hours → closed
 * 5. If an all-day exception blocks the room → maintenance/closed
 * 6. If current time is inside a booking (not cancelled) → occupied
 * 7. If a booking starts within upcomingBufferMinutes → upcoming
 * 8. If room is open with no conflicting booking → available
 */
export function calculateRoomAvailability(ctx: AvailabilityContext): RoomAvailabilityResult {
  const { room, schedules, exceptions, now, upcomingBufferMinutes } = ctx

  const currentDate = getISODate(now)
  const currentTime = getTimeString(now)
  const currentMinutes = timeToMinutes(currentTime)

  // 1. Inactive room
  if (!room.isActive) {
    return result(room.id, 'closed', now, false)
  }

  // 2. Temporary closure (not maintenance per se, but we mark as closed)
  if (room.isTemporaryClosed) {
    return result(room.id, 'maintenance', now, true)
  }

  // 3. Schedule unverified
  if (!room.scheduleVerified) {
    return result(room.id, 'unknown', now, false)
  }

  // 4. Operating hours check
  const openTime = room.openTime ?? ctx.defaultOpenTime
  const closeTime = room.closeTime ?? ctx.defaultCloseTime
  const openMinutes = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
    return result(room.id, 'closed', now, true)
  }

  // 5. Check exceptions for today
  const todayExceptions = getExceptionsForDate(exceptions, now)
  const allDayBlock = todayExceptions.find(
    (e) => !e.startTime && (e.type === 'closure' || e.type === 'maintenance')
  )
  if (allDayBlock) {
    const status = allDayBlock.type === 'maintenance' ? 'maintenance' : 'closed'
    return result(room.id, status, now, true)
  }

  // Time-range blocks from exceptions
  const timeBlock = todayExceptions.find((e) => {
    if (!e.startTime || !e.endTime) return false
    if (e.type === 'cancellation') return false // cancellations remove schedules, not block room
    if (e.type !== 'closure' && e.type !== 'maintenance') return false
    return timeRangesOverlap(
      timeToMinutes(e.startTime),
      timeToMinutes(e.endTime),
      currentMinutes,
      currentMinutes + 1,
    )
  })
  if (timeBlock) {
    const status = timeBlock.type === 'maintenance' ? 'maintenance' : 'closed'
    return result(room.id, status, now, true)
  }

  // 6. Get today's schedules (after applying exceptions)
  const todaySchedules = getSchedulesForDate(schedules, now)
  const cancelledScheduleIds = new Set(
    todayExceptions
      .filter((e) => e.type === 'cancellation' && e.affectedScheduleId)
      .map((e) => e.affectedScheduleId!)
  )

  const activeSchedules = todaySchedules.filter((s) => !cancelledScheduleIds.has(s.id))

  // Also apply one-time bookings as schedules
  const oneTimeBookings = todayExceptions.filter((e) => e.type === 'one_time_booking')

  // Check current occupancy
  const currentSchedule = activeSchedules.find((s) => {
    const start = timeToMinutes(s.startTime)
    const end = timeToMinutes(s.endTime)
    return currentMinutes >= start && currentMinutes < end
  })

  if (currentSchedule) {
    const nextSchedule = findNextSchedule(activeSchedules, currentMinutes)
    const nextAvailableTime = minutesToTime(timeToMinutes(currentSchedule.endTime) + currentSchedule.bufferAfterMinutes)
    return {
      roomId: room.id,
      status: 'occupied',
      currentSchedule,
      nextSchedule: nextSchedule ?? undefined,
      nextAvailableTime,
      isVerified: true,
      computedAt: now.toISOString(),
    }
  }

  // Check one-time bookings
  const currentBooking = oneTimeBookings.find((b) => {
    if (!b.startTime || !b.endTime) return false
    return timeRangesOverlap(
      timeToMinutes(b.startTime),
      timeToMinutes(b.endTime),
      currentMinutes,
      currentMinutes + 1,
    )
  })
  if (currentBooking) {
    return result(room.id, 'occupied', now, true)
  }

  // 7. Check upcoming schedules
  const upcomingSchedule = activeSchedules.find((s) => {
    const start = timeToMinutes(s.startTime)
    return start > currentMinutes && start <= currentMinutes + upcomingBufferMinutes
  })

  if (upcomingSchedule) {
    const nextAfter = findNextSchedule(activeSchedules, timeToMinutes(upcomingSchedule.endTime))
    return {
      roomId: room.id,
      status: 'upcoming',
      nextSchedule: upcomingSchedule,
      isVerified: true,
      computedAt: now.toISOString(),
    }
  }

  // 8. Available — find next scheduled time for display
  const nextSchedule = findNextSchedule(activeSchedules, currentMinutes)
  return {
    roomId: room.id,
    status: 'available',
    nextSchedule: nextSchedule ?? undefined,
    isVerified: true,
    computedAt: now.toISOString(),
  }
}

function result(
  roomId: string,
  status: RoomStatus,
  now: Date,
  isVerified: boolean,
): RoomAvailabilityResult {
  return {
    roomId,
    status,
    isVerified,
    computedAt: now.toISOString(),
  }
}

function findNextSchedule(
  schedules: RoomSchedule[],
  afterMinutes: number,
): RoomSchedule | null {
  const upcoming = schedules
    .filter((s) => timeToMinutes(s.startTime) > afterMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  return upcoming[0] ?? null
}

// ─── Daily Timetable ──────────────────────────────────────

/**
 * Build a full-day timetable from open to close time,
 * merging schedules and exceptions for the specified date.
 */
export function buildDailyTimetable(
  room: Room,
  schedules: RoomSchedule[],
  exceptions: ScheduleException[],
  date: Date,
  defaultOpenTime: string,
  defaultCloseTime: string,
): TimeSlot[] {
  const openTime = room.openTime ?? defaultOpenTime
  const closeTime = room.closeTime ?? defaultCloseTime

  if (!room.isActive || room.isTemporaryClosed) {
    return [{ startTime: openTime, endTime: closeTime, status: 'maintenance' }]
  }

  const todaySchedules = getSchedulesForDate(schedules, date)
  const todayExceptions = getExceptionsForDate(exceptions, date)
  const cancelledIds = new Set(
    todayExceptions
      .filter((e) => e.type === 'cancellation' && e.affectedScheduleId)
      .map((e) => e.affectedScheduleId!)
  )

  const activeSchedules = todaySchedules
    .filter((s) => !cancelledIds.has(s.id))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const slots: TimeSlot[] = []
  let cursor = timeToMinutes(openTime)
  const closeMinutes = timeToMinutes(closeTime)

  for (const schedule of activeSchedules) {
    const start = timeToMinutes(schedule.startTime)
    const end = timeToMinutes(schedule.endTime)

    if (start < timeToMinutes(openTime) || end > closeMinutes) continue
    if (start > cursor) {
      slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(start), status: 'available' })
    }

    slots.push({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: 'occupied',
      scheduleId: schedule.id,
      title: schedule.title,
      instructorName: schedule.instructorName,
    })
    cursor = end + schedule.bufferAfterMinutes
  }

  if (cursor < closeMinutes) {
    slots.push({ startTime: minutesToTime(cursor), endTime: closeTime, status: 'available' })
  }

  return slots
}

// ─── Summary stats ────────────────────────────────────────

export interface AvailabilitySummary {
  total: number
  available: number
  occupied: number
  upcoming: number
  closed: number
  maintenance: number
  unknown: number
}

export function summarizeAvailability(results: RoomAvailabilityResult[]): AvailabilitySummary {
  const summary: AvailabilitySummary = {
    total: results.length,
    available: 0,
    occupied: 0,
    upcoming: 0,
    closed: 0,
    maintenance: 0,
    unknown: 0,
  }
  for (const r of results) {
    summary[r.status] = (summary[r.status] ?? 0) + 1
  }
  return summary
}
