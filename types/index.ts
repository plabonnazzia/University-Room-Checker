// ============================================================
// UNIVERSITY ROOM CHECKER — Core Type Definitions
// ============================================================

// ─── Enums ────────────────────────────────────────────────

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type RoomStatus = 'available' | 'occupied' | 'upcoming' | 'closed' | 'maintenance' | 'unknown'

export type RoomCategory =
  | 'classroom'
  | 'faculty_office'
  | 'chairman_office'
  | 'dean_office'
  | 'department_office'
  | 'admin_office'
  | 'library'
  | 'computer_lab'
  | 'science_lab'
  | 'seminar_room'
  | 'conference_room'
  | 'examination_room'
  | 'prayer_room'
  | 'common_room'
  | 'meeting_room'
  | 'storage'
  | 'other'

export type UserRole = 'student' | 'faculty' | 'admin' | 'super_admin'

export type ScheduleExceptionType = 'cancellation' | 'closure' | 'maintenance' | 'one_time_booking' | 'override'

// ─── University Settings ──────────────────────────────────

export interface UniversitySettings {
  id: string
  name: string
  shortName: string
  logoUrl?: string
  timezone: string
  workingDays: DayOfWeek[]
  defaultOpenTime: string  // "HH:mm"
  defaultCloseTime: string // "HH:mm"
  upcomingBufferMinutes: number
  isDemo: boolean
  updatedAt: string
}

// ─── Building & Department ───────────────────────────────

export interface Building {
  id: string
  name: string
  shortName?: string
  floors: number
  description?: string
  isActive: boolean
}

export interface Department {
  id: string
  name: string
  shortName?: string
  buildingId?: string
  building?: Building
  headFacultyId?: string
  isActive: boolean
}

// ─── Room ─────────────────────────────────────────────────

export interface Room {
  id: string
  number: string        // e.g., "301", "A-205"
  name: string          // e.g., "Computer Lab 1", "Chairman's Office"
  category: RoomCategory
  buildingId: string
  building?: Building
  floor: number
  departmentId?: string
  department?: Department
  capacity?: number
  description?: string
  locationInstructions?: string
  facilities: string[]  // e.g., ["Projector", "AC", "Whiteboard"]
  openTime?: string     // Override default, "HH:mm"
  closeTime?: string    // Override default, "HH:mm"
  isActive: boolean
  isTemporaryClosed: boolean
  temporaryClosureReason?: string
  temporaryClosureUntil?: string
  scheduleVerified: boolean  // If false → "Availability unverified"
  createdAt: string
  updatedAt: string
}

// ─── Faculty Member ───────────────────────────────────────

export interface FacultyMember {
  id: string
  name: string
  title: string         // Dr., Prof., Mr., Ms.
  designation: string   // "Associate Professor", "Chairman", etc.
  departmentId?: string
  department?: Department
  officeRoomId?: string
  officeRoom?: Room
  officeHours?: OfficeHours[]
  email?: string        // Only show when published=true
  phone?: string        // Only show when published=true
  contactPublished: boolean
  bio?: string
  photoUrl?: string
  isActive: boolean
}

export interface OfficeHours {
  day: DayOfWeek
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  note?: string
}

// ─── Schedule ─────────────────────────────────────────────

export interface RoomSchedule {
  id: string
  roomId: string
  room?: Room
  title: string           // e.g., "CSE-301: Data Structures"
  description?: string
  instructorName?: string
  instructorId?: string
  facultyMember?: FacultyMember
  dayOfWeek: DayOfWeek
  startTime: string       // "HH:mm"
  endTime: string         // "HH:mm"
  isRecurring: boolean
  specificDate?: string   // ISO date "YYYY-MM-DD", only for non-recurring
  bufferAfterMinutes: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Schedule Exception ───────────────────────────────────

export interface ScheduleException {
  id: string
  roomId: string
  room?: Room
  type: ScheduleExceptionType
  title: string
  description?: string
  date: string           // ISO date "YYYY-MM-DD"
  startTime?: string     // If null, applies all day
  endTime?: string       // If null, applies all day
  affectedScheduleId?: string
  createdAt: string
}

// ─── Computed / Derived Types ─────────────────────────────

export interface TimeSlot {
  startTime: string
  endTime: string
  status: RoomStatus
  scheduleId?: string
  title?: string
  instructorName?: string
}

export interface RoomAvailabilityResult {
  roomId: string
  status: RoomStatus
  currentSchedule?: RoomSchedule
  nextSchedule?: RoomSchedule
  nextAvailableTime?: string
  isVerified: boolean
  computedAt: string
}

export interface RoomWithStatus extends Room {
  currentStatus: RoomStatus
  currentSchedule?: RoomSchedule
  nextSchedule?: RoomSchedule
  nextAvailableTime?: string
  todaySchedules: RoomSchedule[]
}

// ─── Admin / Audit ────────────────────────────────────────

export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  changes?: Record<string, { before: unknown; after: unknown }>
  createdAt: string
}

export interface ScheduleConflict {
  roomId: string
  roomName: string
  scheduleA: RoomSchedule
  scheduleB: RoomSchedule
  conflictType: 'overlap' | 'exact_match'
}

// ─── Search & Filter ──────────────────────────────────────

export interface SearchFilters {
  query: string
  day?: DayOfWeek
  category?: RoomCategory[]
  buildingId?: string
  departmentId?: string
  status?: RoomStatus[]
  floor?: number
}

export interface SearchResult {
  rooms: RoomWithStatus[]
  faculty: FacultyMember[]
  total: number
  query: string
}

// ─── CSV Import ───────────────────────────────────────────

export interface CSVImportResult<T> {
  success: T[]
  errors: Array<{ row: number; data: unknown; errors: string[] }>
  total: number
}

// ─── Auth ─────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  facultyMemberId?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
