'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  ChevronDown,
  Calendar,
  Building2,
  LayoutGrid,
  Clock,
  Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { searchRooms } from '@/lib/search'
import {
  WORKING_DAYS,
  DAY_LABELS,
  DAY_SHORT,
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatTime,
  formatDate,
  cn,
} from '@/lib/utils'
import type { DayOfWeek, RoomCategory, RoomStatus, RoomWithStatus } from '@/types'
import Link from 'next/link'
import {
  GraduationCap,
  UserRound,
  Crown,
  Award,
  BookOpen,
  Monitor,
  FlaskConical,
  Users,
  Briefcase,
  Heart,
  Sofa,
  Presentation,
  ClipboardList,
  CalendarDays,
  MapPin,
} from 'lucide-react'

const CATEGORY_ICONS_MAP: Record<RoomCategory, React.ReactNode> = {
  classroom: <GraduationCap className="h-4 w-4" />,
  faculty_office: <UserRound className="h-4 w-4" />,
  chairman_office: <Crown className="h-4 w-4" />,
  dean_office: <Award className="h-4 w-4" />,
  department_office: <Building2 className="h-4 w-4" />,
  admin_office: <Briefcase className="h-4 w-4" />,
  library: <BookOpen className="h-4 w-4" />,
  computer_lab: <Monitor className="h-4 w-4" />,
  science_lab: <FlaskConical className="h-4 w-4" />,
  seminar_room: <Presentation className="h-4 w-4" />,
  conference_room: <Users className="h-4 w-4" />,
  examination_room: <ClipboardList className="h-4 w-4" />,
  prayer_room: <Heart className="h-4 w-4" />,
  common_room: <Sofa className="h-4 w-4" />,
  meeting_room: <CalendarDays className="h-4 w-4" />,
  storage: <MapPin className="h-4 w-4" />,
  other: <LayoutGrid className="h-4 w-4" />,
}

const STATUS_DOT_COLORS: Record<RoomStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-red-500',
  upcoming: 'bg-amber-500',
  closed: 'bg-slate-400',
  maintenance: 'bg-orange-500',
  unknown: 'bg-gray-400',
}

const STATUS_BADGE_STYLES: Record<RoomStatus, string> = {
  available: 'status-available',
  occupied: 'status-occupied',
  upcoming: 'status-upcoming',
  closed: 'status-closed',
  maintenance: 'status-maintenance',
  unknown: 'status-unknown',
}

function RoomsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    settings,
    currentTime,
    selectedDay,
    setSelectedDay,
    getRoomsWithStatus,
    buildings,
    departments,
    searchFilters,
    setSearchFilters,
    clearSearchFilters,
    addRecentlyViewed,
  } = useAppStore()

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchParams.get('q') ?? searchFilters.query ?? '')
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithStatus[]>([])

  // Sync URL params to filters on mount
  useEffect(() => {
    const q = searchParams.get('q')
    const cat = searchParams.get('category') as RoomCategory | null
    const status = searchParams.get('status') as RoomStatus | null
    if (q) { setSearchFilters({ query: q }); setLocalQuery(q) }
    if (cat) setSearchFilters({ category: [cat] })
    if (status) setSearchFilters({ status: [status] })
  }, [])

  useEffect(() => {
    setRoomsWithStatus(getRoomsWithStatus(currentTime))
  }, [currentTime, getRoomsWithStatus])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchFilters({ query: localQuery })
    }, 300)
    return () => clearTimeout(timer)
  }, [localQuery])

  const filteredRooms = searchRooms(
    roomsWithStatus.filter(r => {
      // Day filter — for recurring schedules, show rooms that have activity on selected day
      return true // show all rooms regardless of day, but timetable shows selected day
    }),
    { ...searchFilters, day: selectedDay },
    buildings,
    departments,
  )

  const hasActiveFilters =
    searchFilters.category?.length ||
    searchFilters.status?.length ||
    searchFilters.buildingId ||
    searchFilters.departmentId

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Room Checker</h1>
          <p className="text-muted-foreground text-sm">
            Check availability for {DAY_LABELS[selectedDay]} · {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>

        {/* Day selector */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {WORKING_DAYS.map((day) => {
              const isToday = day === WORKING_DAYS[Math.min(currentTime.getDay(), 4)]
              const isSelected = day === selectedDay
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={cn('day-tab', isSelected && 'active', isToday && 'today')}
                >
                  <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  {isToday && (
                    <span className="ml-1.5 hidden sm:inline text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder='Search rooms, faculty, departments…'
              className="search-input"
            />
            {localQuery && (
              <button
                onClick={() => { setLocalQuery(''); setSearchFilters({ query: '' }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground border-border hover:bg-secondary'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white/30 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {(searchFilters.category?.length ?? 0) + (searchFilters.status?.length ?? 0) + (searchFilters.buildingId ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2.5 transition-colors', viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
                title="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-2.5 transition-colors', viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white border border-border rounded-xl p-5 mb-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Rooms
              </h3>
              {hasActiveFilters && (
                <button onClick={clearSearchFilters} className="text-xs text-destructive hover:underline">
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Building filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Building</label>
                <select
                  value={searchFilters.buildingId ?? ''}
                  onChange={(e) => setSearchFilters({ buildingId: e.target.value || undefined })}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Buildings</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <select
                  value={searchFilters.category?.[0] ?? ''}
                  onChange={(e) => setSearchFilters({ category: e.target.value ? [e.target.value as RoomCategory] : undefined })}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Categories</option>
                  {(Object.entries(CATEGORY_LABELS) as [RoomCategory, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                <select
                  value={searchFilters.status?.[0] ?? ''}
                  onChange={(e) => setSearchFilters({ status: e.target.value ? [e.target.value as RoomStatus] : undefined })}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Statuses</option>
                  {(Object.entries(STATUS_LABELS) as [RoomStatus, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Department</label>
                <select
                  value={searchFilters.departmentId ?? ''}
                  onChange={(e) => setSearchFilters({ departmentId: e.target.value || undefined })}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filter pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {searchFilters.category?.map((cat) => (
                  <span key={cat} className="filter-pill">
                    {CATEGORY_LABELS[cat]}
                    <button onClick={() => setSearchFilters({ category: undefined })}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {searchFilters.status?.map((s) => (
                  <span key={s} className="filter-pill">
                    {STATUS_LABELS[s]}
                    <button onClick={() => setSearchFilters({ status: undefined })}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {searchFilters.buildingId && (
                  <span className="filter-pill">
                    {buildings.find(b => b.id === searchFilters.buildingId)?.name}
                    <button onClick={() => setSearchFilters({ buildingId: undefined })}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredRooms.length === roomsWithStatus.length
              ? `${filteredRooms.length} rooms`
              : `${filteredRooms.length} of ${roomsWithStatus.length} rooms`}
            {searchFilters.query && ` matching "${searchFilters.query}"`}
          </p>
        </div>

        {/* Room list/grid */}
        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No rooms found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchFilters.query
                ? `No rooms matched "${searchFilters.query}". Try a different search or clear filters.`
                : 'No rooms match the current filters. Try adjusting your filters.'}
            </p>
            <button
              onClick={() => { clearSearchFilters(); setLocalQuery('') }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="room-grid">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onView={() => addRecentlyViewed(room.id)} buildings={buildings} departments={departments} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRooms.map((room) => (
              <RoomListItem key={room.id} room={room} onView={() => addRecentlyViewed(room.id)} buildings={buildings} departments={departments} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Room Card (grid) ─────────────────────────────────────
function RoomCard({ room, onView, buildings, departments }: {
  room: RoomWithStatus
  onView: () => void
  buildings: any[]
  departments: any[]
}) {
  const building = buildings.find(b => b.id === room.buildingId)
  const dept = departments.find(d => d.id === room.departmentId)

  return (
    <Link href={`/rooms/${room.id}`} onClick={onView} className="room-card block group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-primary">{CATEGORY_ICONS_MAP[room.category]}</div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[room.category]}</div>
          </div>
        </div>
        <span className={cn('status-badge text-[11px]', STATUS_BADGE_STYLES[room.currentStatus])}>
          <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT_COLORS[room.currentStatus])} />
          {STATUS_LABELS[room.currentStatus]}
        </span>
      </div>

      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors mb-0.5 leading-tight">
        {room.name}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">Room {room.number}</p>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{building?.name ?? 'Unknown'} · Floor {room.floor}</span>
        </div>
        {dept && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{dept.shortName}</span>
          </div>
        )}
        {room.capacity && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{room.capacity} capacity</span>
          </div>
        )}
      </div>

      {/* Current/next activity */}
      {room.currentSchedule && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="text-xs font-medium text-foreground truncate">{room.currentSchedule.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatTime(room.currentSchedule.startTime)} – {formatTime(room.currentSchedule.endTime)}
          </div>
        </div>
      )}
      {!room.currentSchedule && room.nextSchedule && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">Next:</div>
          <div className="text-xs font-medium text-foreground truncate">{room.nextSchedule.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatTime(room.nextSchedule.startTime)}
          </div>
        </div>
      )}
    </Link>
  )
}

// ─── Room List Item ───────────────────────────────────────
function RoomListItem({ room, onView, buildings, departments }: {
  room: RoomWithStatus
  onView: () => void
  buildings: any[]
  departments: any[]
}) {
  const building = buildings.find(b => b.id === room.buildingId)
  const dept = departments.find(d => d.id === room.departmentId)

  return (
    <Link
      href={`/rooms/${room.id}`}
      onClick={onView}
      className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
    >
      <div className={cn('w-3 h-3 rounded-full flex-shrink-0', STATUS_DOT_COLORS[room.currentStatus])} />

      <div className="flex-1 min-w-0 grid sm:grid-cols-4 gap-2">
        <div className="sm:col-span-1">
          <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{room.name}</div>
          <div className="text-xs text-muted-foreground">Room {room.number}</div>
        </div>
        <div className="text-xs text-muted-foreground sm:col-span-1 flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          {building?.shortName ?? 'N/A'} · Fl. {room.floor}
        </div>
        <div className="text-xs text-muted-foreground sm:col-span-1 flex items-center gap-1 truncate">
          {room.currentSchedule ? room.currentSchedule.title : room.nextSchedule ? `Next: ${room.nextSchedule.title}` : '—'}
        </div>
        <div className="sm:col-span-1 flex items-center">
          <span className={cn('status-badge text-[11px]', STATUS_BADGE_STYLES[room.currentStatus])}>
            {STATUS_LABELS[room.currentStatus]}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[hsl(var(--university-surface))] flex items-center justify-center"><div className="text-muted-foreground">Loading rooms…</div></div>}>
      <RoomsPageContent />
    </Suspense>
  )
}
