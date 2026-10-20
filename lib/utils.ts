// Shared utility functions

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DayOfWeek, RoomCategory, RoomStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WORKING_DAYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

export const DAY_SHORT: Record<DayOfWeek, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
}

export const CATEGORY_LABELS: Record<RoomCategory, string> = {
  classroom: 'Classroom',
  faculty_office: 'Faculty Office',
  chairman_office: "Chairman's Office",
  dean_office: "Dean's Office",
  department_office: 'Department Office',
  admin_office: 'Admin Office',
  library: 'Library',
  computer_lab: 'Computer Lab',
  science_lab: 'Science Lab',
  seminar_room: 'Seminar Room',
  conference_room: 'Conference Room',
  examination_room: 'Examination Room',
  prayer_room: 'Prayer Room',
  common_room: 'Common Room',
  meeting_room: 'Meeting Room',
  storage: 'Storage',
  other: 'Other',
}

export const CATEGORY_ICONS: Record<RoomCategory, string> = {
  classroom: 'GraduationCap',
  faculty_office: 'UserRound',
  chairman_office: 'Crown',
  dean_office: 'Award',
  department_office: 'Building2',
  admin_office: 'Briefcase',
  library: 'BookOpen',
  computer_lab: 'Monitor',
  science_lab: 'FlaskConical',
  seminar_room: 'Presentation',
  conference_room: 'Users',
  examination_room: 'ClipboardList',
  prayer_room: 'Heart',
  common_room: 'Sofa',
  meeting_room: 'CalendarDays',
  storage: 'Package',
  other: 'LayoutGrid',
}

export const STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  upcoming: 'Class Soon',
  closed: 'Closed',
  maintenance: 'Maintenance',
  unknown: 'Unverified',
}

export const STATUS_COLORS: Record<RoomStatus, string> = {
  available: 'status-available',
  occupied: 'status-occupied',
  upcoming: 'status-upcoming',
  closed: 'status-closed',
  maintenance: 'status-maintenance',
  unknown: 'status-unknown',
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function getFloorLabel(floor: number): string {
  if (floor === 1) return 'Ground Floor'
  if (floor === 2) return '1st Floor'
  if (floor === 3) return '2nd Floor'
  if (floor === 4) return '3rd Floor'
  return `${floor - 1}th Floor`
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// CSV utilities
export function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function toCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) =>
    val.includes(',') || val.includes('"') || val.includes('\n')
      ? `"${val.replace(/"/g, '""')}"`
      : val

  return [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n')
}
