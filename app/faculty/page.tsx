'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  UserRound,
  MapPin,
  Clock,
  Mail,
  Building2,
  ChevronRight,
  Filter,
  X,
  Crown,
  Award,
  Users,
  GraduationCap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { searchFaculty } from '@/lib/search'
import { WORKING_DAYS, DAY_LABELS, formatTime, cn } from '@/lib/utils'
import type { FacultyMember } from '@/types'

const DESIGNATION_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Professors', value: 'professor' },
  { label: 'Chairman', value: 'chairman' },
  { label: 'Dean', value: 'dean' },
  { label: 'Lecturers', value: 'lecturer' },
]

export default function FacultyPage() {
  const {
    faculty,
    rooms,
    buildings,
    departments,
    settings,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('')

  const filteredFaculty = searchFaculty(faculty, searchQuery, rooms).filter((f) => {
    if (selectedDept && f.departmentId !== selectedDept) return false
    if (selectedDesignation) {
      const d = f.designation.toLowerCase()
      if (selectedDesignation === 'professor' && !d.includes('professor')) return false
      if (selectedDesignation === 'chairman' && !d.includes('chairman')) return false
      if (selectedDesignation === 'dean' && !d.includes('dean')) return false
      if (selectedDesignation === 'lecturer' && !d.includes('lecturer')) return false
    }
    return true
  })

  const chairmanAndDean = filteredFaculty.filter((f) =>
    f.designation.toLowerCase().includes('chairman') ||
    f.designation.toLowerCase().includes('dean')
  )
  const regularFaculty = filteredFaculty.filter((f) =>
    !f.designation.toLowerCase().includes('chairman') &&
    !f.designation.toLowerCase().includes('dean')
  )

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Faculty & Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Find faculty members, their offices, and availability</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, designation, office room…"
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.shortName}</option>
            ))}
          </select>

          <select
            value={selectedDesignation}
            onChange={(e) => setSelectedDesignation(e.target.value)}
            className="text-sm border border-input rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
          >
            {DESIGNATION_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{filteredFaculty.length} faculty member{filteredFaculty.length !== 1 ? 's' : ''}</p>

        {/* Chairman & Dean highlight */}
        {chairmanAndDean.length > 0 && !selectedDesignation && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              Leadership
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chairmanAndDean.map((member) => (
                <FacultyCard key={member.id} member={member} rooms={rooms} buildings={buildings} departments={departments} highlighted />
              ))}
            </div>
          </section>
        )}

        {/* Regular faculty */}
        {regularFaculty.length > 0 && (
          <section>
            {chairmanAndDean.length > 0 && !selectedDesignation && (
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Faculty Members
              </h2>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularFaculty.map((member) => (
                <FacultyCard key={member.id} member={member} rooms={rooms} buildings={buildings} departments={departments} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredFaculty.length === 0 && (
          <div className="empty-state">
            <UserRound className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No faculty found</h3>
            <p className="text-muted-foreground text-sm">Try a different search or clear your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedDept(''); setSelectedDesignation('') }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FacultyCard({ member, rooms, buildings, departments, highlighted = false }: {
  member: FacultyMember
  rooms: any[]
  buildings: any[]
  departments: any[]
  highlighted?: boolean
}) {
  const officeRoom = rooms.find((r) => r.id === member.officeRoomId)
  const building = officeRoom ? buildings.find((b) => b.id === officeRoom.buildingId) : null
  const dept = departments.find((d) => d.id === member.departmentId)

  const initials = member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={cn(
      'bg-white border border-border rounded-xl p-5 transition-all hover:shadow-md hover:border-primary/20',
      highlighted && 'border-amber-200 bg-amber-50/30'
    )}>
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          highlighted ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
        )}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground text-sm leading-tight">{member.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{member.designation}</div>
          {dept && (
            <div className="text-xs text-primary/80 mt-1">{dept.shortName}</div>
          )}
        </div>
        {highlighted && (
          <Crown className="h-4 w-4 text-amber-600 flex-shrink-0" />
        )}
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        {officeRoom ? (
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-foreground font-medium">{officeRoom.name}</div>
              <div>Room {officeRoom.number}{building ? ` · ${building.shortName}` : ''}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            Office not listed
          </div>
        )}

        {member.contactPublished && member.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <a href={`mailto:${member.email}`} className="hover:text-primary hover:underline truncate">
              {member.email}
            </a>
          </div>
        )}

        {member.officeHours && member.officeHours.length > 0 && (
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-foreground mb-1">Office Hours</div>
              {member.officeHours.slice(0, 2).map((oh, i) => (
                <div key={i}>
                  {DAY_LABELS[oh.day]}: {formatTime(oh.startTime)}–{formatTime(oh.endTime)}
                </div>
              ))}
              {member.officeHours.length > 2 && (
                <div className="text-primary">+{member.officeHours.length - 2} more days</div>
              )}
            </div>
          </div>
        )}
      </div>

      {officeRoom && (
        <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
          <Link
            href={`/rooms/${officeRoom.id}`}
            className="flex-1 text-center text-xs font-medium py-2 px-3 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            View Office
          </Link>
          <Link
            href={`/faculty/${member.id}`}
            className="flex-1 text-center text-xs font-medium py-2 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Full Profile
          </Link>
        </div>
      )}
    </div>
  )
}
