// ============================================================
// STORE — Zustand client-side state management
// ============================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Room,
  FacultyMember,
  RoomSchedule,
  ScheduleException,
  Building,
  Department,
  UniversitySettings,
  SearchFilters,
  DayOfWeek,
  User,
  RoomWithStatus,
  AuditLogEntry,
} from '@/types'
import {
  DEMO_ROOMS,
  DEMO_FACULTY,
  DEMO_SCHEDULES,
  DEMO_EXCEPTIONS,
  DEMO_BUILDINGS,
  DEMO_DEPARTMENTS,
  DEMO_UNIVERSITY_SETTINGS,
  DEMO_ADMIN_USER,
  DEMO_STUDENT_USER,
} from '@/lib/demo-data'
import { calculateRoomAvailability, getDayOfWeek } from '@/lib/availability'

// ─── App Store ────────────────────────────────────────────

interface AppStore {
  // University data
  settings: UniversitySettings
  buildings: Building[]
  departments: Department[]
  rooms: Room[]
  faculty: FacultyMember[]
  schedules: RoomSchedule[]
  exceptions: ScheduleException[]
  auditLog: AuditLogEntry[]

  // UI state
  selectedDay: DayOfWeek
  searchFilters: SearchFilters
  currentTime: Date
  recentlyViewedRoomIds: string[]

  // Auth
  currentUser: User | null
  isDemo: boolean

  // Actions — Settings
  updateSettings: (settings: Partial<UniversitySettings>) => void

  // Actions — Rooms
  addRoom: (room: Room) => void
  updateRoom: (id: string, updates: Partial<Room>) => void
  archiveRoom: (id: string) => void

  // Actions — Schedules
  addSchedule: (schedule: RoomSchedule) => void
  updateSchedule: (id: string, updates: Partial<RoomSchedule>) => void
  deleteSchedule: (id: string) => void

  // Actions — Exceptions
  addException: (exception: ScheduleException) => void
  deleteException: (id: string) => void

  // Actions — Faculty
  addFacultyMember: (member: FacultyMember) => void
  updateFacultyMember: (id: string, updates: Partial<FacultyMember>) => void

  // Actions — UI
  setSelectedDay: (day: DayOfWeek) => void
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  clearSearchFilters: () => void
  setCurrentTime: (time: Date) => void
  addRecentlyViewed: (roomId: string) => void

  // Actions — Auth
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void

  // Computed helpers
  getRoomWithStatus: (roomId: string, now?: Date) => RoomWithStatus | null
  getRoomsWithStatus: (now?: Date) => RoomWithStatus[]
  getSchedulesForRoom: (roomId: string) => RoomSchedule[]
  getExceptionsForRoom: (roomId: string) => ScheduleException[]
  getFacultyForRoom: (roomId: string) => FacultyMember[]
  getBuildingById: (id: string) => Building | undefined
  getDepartmentById: (id: string) => Department | undefined
  getRoomById: (id: string) => Room | undefined

  // Admin actions — log
  logAudit: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) => void
}

const EMPTY_FILTERS: SearchFilters = { query: '' }

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state from demo data
      settings: DEMO_UNIVERSITY_SETTINGS,
      buildings: DEMO_BUILDINGS,
      departments: DEMO_DEPARTMENTS,
      rooms: DEMO_ROOMS,
      faculty: DEMO_FACULTY,
      schedules: DEMO_SCHEDULES,
      exceptions: DEMO_EXCEPTIONS,
      auditLog: [],
      selectedDay: getDayOfWeek(new Date()),
      searchFilters: EMPTY_FILTERS,
      currentTime: new Date(),
      recentlyViewedRoomIds: [],
      currentUser: null,
      isDemo: true,

      // ─── Settings ──────────────────────────────────────
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      // ─── Rooms ─────────────────────────────────────────
      addRoom: (room) => {
        set((state) => ({ rooms: [...state.rooms, room] }))
        get().logAudit({
          userId: get().currentUser?.id ?? 'unknown',
          userEmail: get().currentUser?.email ?? 'unknown',
          action: 'create',
          entityType: 'room',
          entityId: room.id,
          entityName: room.name,
        })
      },
      updateRoom: (id, updates) => {
        const before = get().rooms.find((r) => r.id === id)
        set((state) => ({
          rooms: state.rooms.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }))
        get().logAudit({
          userId: get().currentUser?.id ?? 'unknown',
          userEmail: get().currentUser?.email ?? 'unknown',
          action: 'update',
          entityType: 'room',
          entityId: id,
          entityName: before?.name ?? id,
        })
      },
      archiveRoom: (id) => {
        get().updateRoom(id, { isActive: false })
      },

      // ─── Schedules ─────────────────────────────────────
      addSchedule: (schedule) =>
        set((state) => ({ schedules: [...state.schedules, schedule] })),
      updateSchedule: (id, updates) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        })),
      deleteSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),

      // ─── Exceptions ────────────────────────────────────
      addException: (exception) =>
        set((state) => ({ exceptions: [...state.exceptions, exception] })),
      deleteException: (id) =>
        set((state) => ({
          exceptions: state.exceptions.filter((e) => e.id !== id),
        })),

      // ─── Faculty ───────────────────────────────────────
      addFacultyMember: (member) =>
        set((state) => ({ faculty: [...state.faculty, member] })),
      updateFacultyMember: (id, updates) =>
        set((state) => ({
          faculty: state.faculty.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      // ─── UI ────────────────────────────────────────────
      setSelectedDay: (day) => set({ selectedDay: day }),
      setSearchFilters: (filters) =>
        set((state) => ({ searchFilters: { ...state.searchFilters, ...filters } })),
      clearSearchFilters: () => set({ searchFilters: EMPTY_FILTERS }),
      setCurrentTime: (time) => set({ currentTime: time }),
      addRecentlyViewed: (roomId) =>
        set((state) => ({
          recentlyViewedRoomIds: [
            roomId,
            ...state.recentlyViewedRoomIds.filter((id) => id !== roomId),
          ].slice(0, 6),
        })),

      // ─── Auth ──────────────────────────────────────────
      login: (email, password) => {
        // Demo auth — check against demo users only
        const demoUsers = [DEMO_ADMIN_USER, DEMO_STUDENT_USER]
        const match = demoUsers.find((u) => u.email === email && u.password === password)
        if (match) {
          const user: User = {
            id: match.id,
            email: match.email,
            name: match.name,
            role: match.role,
          }
          set({ currentUser: user })
          return { success: true }
        }
        return { success: false, error: 'Invalid email or password.' }
      },
      logout: () => set({ currentUser: null }),

      // ─── Computed ──────────────────────────────────────
      getRoomWithStatus: (roomId, now) => {
        const state = get()
        const room = state.rooms.find((r) => r.id === roomId)
        if (!room) return null
        const effectiveNow = now ?? state.currentTime
        const roomSchedules = state.schedules.filter((s) => s.roomId === roomId)
        const roomExceptions = state.exceptions.filter((e) => e.roomId === roomId)
        const availability = calculateRoomAvailability({
          room,
          schedules: roomSchedules,
          exceptions: roomExceptions,
          now: effectiveNow,
          defaultOpenTime: state.settings.defaultOpenTime,
          defaultCloseTime: state.settings.defaultCloseTime,
          upcomingBufferMinutes: state.settings.upcomingBufferMinutes,
        })

        const day = getDayOfWeek(effectiveNow)
        const todaySchedules = roomSchedules.filter(
          (s) => s.isActive && (s.isRecurring ? s.dayOfWeek === day : true)
        )

        return {
          ...room,
          building: state.buildings.find((b) => b.id === room.buildingId),
          department: state.departments.find((d) => d.id === room.departmentId),
          currentStatus: availability.status,
          currentSchedule: availability.currentSchedule,
          nextSchedule: availability.nextSchedule,
          nextAvailableTime: availability.nextAvailableTime,
          todaySchedules,
        }
      },

      getRoomsWithStatus: (now) => {
        const state = get()
        return state.rooms
          .filter((r) => r.isActive)
          .map((r) => state.getRoomWithStatus(r.id, now)!)
          .filter(Boolean)
      },

      getSchedulesForRoom: (roomId) =>
        get().schedules.filter((s) => s.roomId === roomId),

      getExceptionsForRoom: (roomId) =>
        get().exceptions.filter((e) => e.roomId === roomId),

      getFacultyForRoom: (roomId) =>
        get().faculty.filter((f) => f.officeRoomId === roomId),

      getBuildingById: (id) => get().buildings.find((b) => b.id === id),
      getDepartmentById: (id) => get().departments.find((d) => d.id === id),
      getRoomById: (id) => get().rooms.find((r) => r.id === id),

      // ─── Audit Log ─────────────────────────────────────
      logAudit: (entry) =>
        set((state) => ({
          auditLog: [
            {
              ...entry,
              id: `audit-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
            ...state.auditLog,
          ].slice(0, 500),
        })),
    }),
    {
      name: 'university-room-checker',
      partialize: (state) => ({
        settings: state.settings,
        rooms: state.rooms,
        buildings: state.buildings,
        departments: state.departments,
        faculty: state.faculty,
        schedules: state.schedules,
        exceptions: state.exceptions,
        currentUser: state.currentUser,
        recentlyViewedRoomIds: state.recentlyViewedRoomIds,
        auditLog: state.auditLog,
        selectedDay: state.selectedDay,
      }),
    }
  )
)
