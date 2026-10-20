'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
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
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Wrench,
  HelpCircle,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { CATEGORY_LABELS, formatTime, getFloorLabel, cn } from '@/lib/utils'
import { StatusBadge } from '@/components/rooms/status-badge'
import type { RoomCategory, RoomWithStatus } from '@/types'

const FACILITY_CATEGORIES: Array<{ key: RoomCategory | 'all'; label: string; icon: React.ReactNode }> = [
  { key: 'all', label: 'All Facilities', icon: <Building2 className="h-4 w-4" /> },
  { key: 'library', label: 'Libraries', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'computer_lab', label: 'Computer Labs', icon: <Monitor className="h-4 w-4" /> },
  { key: 'science_lab', label: 'Science Labs', icon: <FlaskConical className="h-4 w-4" /> },
  { key: 'seminar_room', label: 'Seminar Halls', icon: <Presentation className="h-4 w-4" /> },
  { key: 'conference_room', label: 'Conference & Boardrooms', icon: <Users className="h-4 w-4" /> },
  { key: 'admin_office', label: 'Student & Admin Services', icon: <Briefcase className="h-4 w-4" /> },
  { key: 'prayer_room', label: 'Prayer Rooms', icon: <Heart className="h-4 w-4" /> },
  { key: 'common_room', label: 'Common & Lounges', icon: <Sofa className="h-4 w-4" /> },
  { key: 'examination_room', label: 'Exam Halls', icon: <ClipboardList className="h-4 w-4" /> },
]

export default function FacilitiesPage() {
  const { rooms, buildings, departments, currentTime, getRoomWithStatus, settings } = useAppStore()

  const [activeCategory, setActiveCategory] = React.useState<RoomCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('all')

  // Filter facilities (exclude purely faculty individual offices or standard classrooms if desired, or include all public facilities)
  const nonClassroomCategories: RoomCategory[] = [
    'library',
    'computer_lab',
    'science_lab',
    'seminar_room',
    'conference_room',
    'admin_office',
    'department_office',
    'prayer_room',
    'common_room',
    'examination_room',
    'meeting_room',
  ]

  const facilityRooms: RoomWithStatus[] = React.useMemo(() => {
    return rooms
      .filter((r) => nonClassroomCategories.includes(r.category))
      .map((r) => getRoomWithStatus(r.id, currentTime))
      .filter(Boolean) as RoomWithStatus[]
  }, [rooms, currentTime, getRoomWithStatus])

  const filtered = facilityRooms.filter((room) => {
    if (activeCategory !== 'all' && room.category !== activeCategory) {
      return false
    }
    if (selectedBuilding !== 'all' && room.buildingId !== selectedBuilding) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const building = buildings.find((b) => b.id === room.buildingId)
      const text = `${room.name} ${room.number} ${room.description ?? ''} ${building?.name ?? ''} ${room.facilities.join(' ')}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Campus Facilities & Services
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Explore library spaces, computer labs, seminar halls, prayer rooms, administrative desks, and common facilities across campus.
            </p>
          </div>

          {/* Quick Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin mt-6 pt-2">
            {FACILITY_CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border',
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-white text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facilities by name, amenities (e.g. WiFi, AC), or room number..."
              className="search-input pl-10"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="text-sm border border-input rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Campus Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> facility spaces
        </div>

        {/* Facilities Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state bg-white border border-border rounded-xl p-12">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No facilities found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find any campus facilities matching your selected filters. Try adjusting your search query or building.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((facility) => {
              const building = buildings.find((b) => b.id === facility.buildingId)
              const dept = departments.find((d) => d.id === facility.departmentId)

              return (
                <div
                  key={facility.id}
                  className="bg-white border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {CATEGORY_LABELS[facility.category]}
                      </span>
                      <StatusBadge status={facility.currentStatus} />
                    </div>

                    <h3 className="font-bold text-base text-foreground mb-1 leading-snug">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Room {facility.number}
                    </p>

                    {facility.description && (
                      <p className="text-xs text-foreground/80 leading-relaxed mb-4 line-clamp-2">
                        {facility.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">
                          {building?.name} · {getFloorLabel(facility.floor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          Hours: {formatTime(facility.openTime ?? settings.defaultOpenTime)} –{' '}
                          {formatTime(facility.closeTime ?? settings.defaultCloseTime)}
                        </span>
                      </div>
                      {facility.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>Capacity: {facility.capacity} seats</span>
                        </div>
                      )}
                    </div>

                    {/* Amenities / Facilities */}
                    {facility.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                        {facility.facilities.map((amenity) => (
                          <span
                            key={amenity}
                            className="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      {facility.scheduleVerified ? 'Verified Schedule' : 'Unverified'}
                    </span>
                    <Link
                      href={`/rooms/${facility.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      View Schedule & Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
