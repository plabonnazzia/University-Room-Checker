// ============================================================
// SEARCH ENGINE — Rule-based room and faculty search
// ============================================================

import type {
  Room,
  FacultyMember,
  Building,
  Department,
  RoomWithStatus,
  SearchFilters,
  RoomCategory,
  RoomStatus,
  DayOfWeek,
} from '@/types'

// Normalize text for matching
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function matchesQuery(text: string, query: string): boolean {
  const normalizedText = normalize(text)
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return true
  // Split query into terms and check all are present
  const terms = normalizedQuery.split(' ').filter(Boolean)
  return terms.every((term) => normalizedText.includes(term))
}

// Category aliases for natural-language-like queries
const CATEGORY_ALIASES: Record<string, RoomCategory[]> = {
  classroom: ['classroom'],
  class: ['classroom'],
  lecture: ['classroom'],
  'computer lab': ['computer_lab'],
  'comp lab': ['computer_lab'],
  lab: ['computer_lab', 'science_lab'],
  laboratory: ['computer_lab', 'science_lab'],
  'science lab': ['science_lab'],
  library: ['library'],
  lib: ['library'],
  seminar: ['seminar_room'],
  office: ['faculty_office', 'chairman_office', 'dean_office', 'department_office', 'admin_office'],
  faculty: ['faculty_office'],
  chairman: ['chairman_office'],
  dean: ['dean_office'],
  department: ['department_office'],
  admin: ['admin_office'],
  conference: ['conference_room'],
  meeting: ['meeting_room'],
  exam: ['examination_room'],
  examination: ['examination_room'],
  prayer: ['prayer_room'],
  common: ['common_room'],
}

function extractCategoryFromQuery(query: string): RoomCategory[] | null {
  const normalized = normalize(query)
  for (const [alias, categories] of Object.entries(CATEGORY_ALIASES)) {
    if (normalized.includes(alias)) return categories
  }
  return null
}

function extractDayFromQuery(query: string): DayOfWeek | null {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  const normalized = normalize(query)
  for (const day of days) {
    if (normalized.includes(day)) return day
  }
  return null
}

function extractStatusFromQuery(query: string): RoomStatus | null {
  const normalized = normalize(query)
  if (normalized.includes('available')) return 'available'
  if (normalized.includes('occupied') || normalized.includes('busy')) return 'occupied'
  if (normalized.includes('upcoming') || normalized.includes('soon')) return 'upcoming'
  if (normalized.includes('closed')) return 'closed'
  if (normalized.includes('maintenance')) return 'maintenance'
  return null
}

export function searchRooms(
  rooms: RoomWithStatus[],
  filters: SearchFilters,
  buildings: Building[],
  departments: Department[],
): RoomWithStatus[] {
  let results = rooms

  const query = filters.query?.trim() ?? ''

  // Extract intent from query
  const queryCategories = extractCategoryFromQuery(query)
  const queryDay = extractDayFromQuery(query)
  const queryStatus = extractStatusFromQuery(query)

  // Apply category filter from query OR explicit filter
  const activeCategories = filters.category?.length
    ? filters.category
    : queryCategories ?? null

  if (activeCategories) {
    results = results.filter((r) => activeCategories.includes(r.category))
  }

  // Apply status filter from query or explicit
  const activeStatus = filters.status?.length
    ? filters.status
    : queryStatus
    ? [queryStatus]
    : null

  if (activeStatus) {
    results = results.filter((r) => activeStatus.includes(r.currentStatus))
  }

  // Apply building filter
  if (filters.buildingId) {
    results = results.filter((r) => r.buildingId === filters.buildingId)
  }

  // Apply department filter
  if (filters.departmentId) {
    results = results.filter((r) => r.departmentId === filters.departmentId)
  }

  // Apply floor filter
  if (filters.floor !== undefined) {
    results = results.filter((r) => r.floor === filters.floor)
  }

  // Text query matching
  const textQuery = query
    .replace(/available|occupied|busy|upcoming|closed|maintenance/gi, '')
    .replace(/sunday|monday|tuesday|wednesday|thursday/gi, '')
    .replace(
      /classroom|computer lab|comp lab|laboratory|library|seminar|office|faculty|chairman|dean|department|admin|conference|meeting|exam|prayer|common/gi,
      ''
    )
    .trim()

  if (textQuery) {
    results = results.filter((r) => {
      const building = buildings.find((b) => b.id === r.buildingId)
      const dept = departments.find((d) => d.id === r.departmentId)
      const searchableText = [
        r.name,
        r.number,
        r.category.replace(/_/g, ' '),
        building?.name ?? '',
        building?.shortName ?? '',
        dept?.name ?? '',
        dept?.shortName ?? '',
        r.description ?? '',
        r.locationInstructions ?? '',
        r.currentSchedule?.title ?? '',
        r.currentSchedule?.instructorName ?? '',
      ].join(' ')
      return matchesQuery(searchableText, textQuery)
    })
  }

  // Sort: available first, then by category relevance, then by room number
  results.sort((a, b) => {
    const statusOrder: Record<RoomStatus, number> = {
      available: 0,
      upcoming: 1,
      occupied: 2,
      unknown: 3,
      closed: 4,
      maintenance: 5,
    }
    const statusDiff = statusOrder[a.currentStatus] - statusOrder[b.currentStatus]
    if (statusDiff !== 0) return statusDiff
    return a.number.localeCompare(b.number, undefined, { numeric: true })
  })

  return results
}

export function searchFaculty(
  faculty: FacultyMember[],
  query: string,
  rooms: Room[],
): FacultyMember[] {
  if (!query.trim()) return faculty.filter((f) => f.isActive)

  return faculty.filter((f) => {
    if (!f.isActive) return false
    const officeRoom = rooms.find((r) => r.id === f.officeRoomId)
    const searchableText = [
      f.name,
      f.title,
      f.designation,
      officeRoom?.number ?? '',
      officeRoom?.name ?? '',
    ].join(' ')
    return matchesQuery(searchableText, query)
  })
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text
  const terms = normalize(query).split(' ').filter(Boolean)
  let result = text
  for (const term of terms) {
    const regex = new RegExp(`(${term})`, 'gi')
    result = result.replace(regex, '<mark>$1</mark>')
  }
  return result
}
