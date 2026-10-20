'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  GraduationCap,
  UserRound,
  Crown,
  Award,
  BookOpen,
  Monitor,
  FlaskConical,
  Users,
  Building2,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { searchRooms } from '@/lib/search'
import { summarizeAvailability, calculateRoomAvailability } from '@/lib/availability'
import {
  WORKING_DAYS,
  DAY_LABELS,
  DAY_SHORT,
  STATUS_LABELS,
  CATEGORY_LABELS,
  formatTime,
  formatDate,
} from '@/lib/utils'
import type { DayOfWeek, RoomCategory, RoomWithStatus, RoomStatus } from '@/types'
import { useRouter } from 'next/navigation'

const CATEGORY_SHORTCUTS: Array<{
  category: RoomCategory | 'all'
  label: string
  icon: React.ReactNode
  href: string
}> = [
  { category: 'classroom', label: 'Classrooms', icon: <GraduationCap className="h-5 w-5" />, href: '/rooms?category=classroom' },
  { category: 'faculty_office', label: 'Faculty Offices', icon: <UserRound className="h-5 w-5" />, href: '/rooms?category=faculty_office' },
  { category: 'chairman_office', label: "Chairman's Office", icon: <Crown className="h-5 w-5" />, href: '/rooms?category=chairman_office' },
  { category: 'dean_office', label: "Dean's Office", icon: <Award className="h-5 w-5" />, href: '/rooms?category=dean_office' },
  { category: 'library', label: 'Library', icon: <BookOpen className="h-5 w-5" />, href: '/rooms?category=library' },
  { category: 'computer_lab', label: 'Computer Labs', icon: <Monitor className="h-5 w-5" />, href: '/rooms?category=computer_lab' },
  { category: 'science_lab', label: 'Science Labs', icon: <FlaskConical className="h-5 w-5" />, href: '/rooms?category=science_lab' },
  { category: 'seminar_room', label: 'Seminar Rooms', icon: <Users className="h-5 w-5" />, href: '/rooms?category=seminar_room' },
]

const STATUS_INDICATOR_COLORS: Record<RoomStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-red-500',
  upcoming: 'bg-amber-500',
  closed: 'bg-slate-400',
  maintenance: 'bg-orange-500',
  unknown: 'bg-gray-400',
}

export default function HomePage() {
  const {
    settings,
    currentTime,
    selectedDay,
    setSelectedDay,
    getRoomsWithStatus,
    buildings,
    departments,
    recentlyViewedRoomIds,
    getRoomWithStatus,
  } = useAppStore()

  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithStatus[]>([])

  useEffect(() => {
    setRoomsWithStatus(getRoomsWithStatus(currentTime))
  }, [currentTime, getRoomsWithStatus])

  const summary = summarizeAvailability(
    roomsWithStatus.map((r) => ({
      roomId: r.id,
      status: r.currentStatus,
      isVerified: r.scheduleVerified,
      computedAt: currentTime.toISOString(),
    }))
  )

  const recentRooms = recentlyViewedRoomIds
    .map((id) => getRoomWithStatus(id, currentTime))
    .filter(Boolean) as RoomWithStatus[]

  const availableRooms = roomsWithStatus.filter((r) => r.currentStatus === 'available').slice(0, 4)
  const occupiedRooms = roomsWithStatus.filter((r) => r.currentStatus === 'occupied').slice(0, 3)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/rooms?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const todayIndex = WORKING_DAYS.indexOf(selectedDay)

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Hero Section */}
      <div className="bg-[hsl(var(--university-primary))] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Demo badge */}
          {settings.isDemo && (
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Demo Mode — Showing fictional university data
            </div>
          )}

          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {settings.shortName.slice(0, 1)}
              </div>
              <span className="text-white/70 text-sm font-medium">{settings.name}</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight mb-3 text-white">
              Find Your Room.{' '}
              <span className="text-teal-300">Plan Your Campus Day.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Check classroom availability, locate faculty offices, and explore campus facilities — all in one place.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Try "Computer Lab", "Dr. Ahmed", "available classroom Tuesday"…'
                className="w-full pl-12 pr-32 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all text-base"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Available Now', value: summary.available, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Occupied', value: summary.occupied, color: 'text-red-400', bg: 'bg-red-400/10' },
              { label: 'Class Soon', value: summary.upcoming, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Total Rooms', value: summary.total, color: 'text-blue-300', bg: 'bg-blue-400/10' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} border border-white/10 rounded-xl p-4`}>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-white/60 text-sm mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="bg-white border-b border-border sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin py-1">
            <span className="text-xs text-muted-foreground font-medium mr-2 shrink-0 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              View day:
            </span>
            {WORKING_DAYS.map((day) => {
              const isToday = day === WORKING_DAYS[currentTime.getDay()] || 
                (currentTime.getDay() > 4 && day === 'thursday')
              const isSelected = day === selectedDay
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`day-tab ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`}
                >
                  <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
                  <span className="sm:hidden">{DAY_SHORT[day]}</span>
                  {isToday && <span className="ml-1.5 text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">Today</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Category shortcuts */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORY_SHORTCUTS.map((cat) => (
              <Link
                key={cat.category}
                href={cat.href}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all group text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-foreground/80 leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available rooms */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Available Right Now
                </h2>
                <Link href="/rooms?status=available" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {availableRooms.length === 0 ? (
                <div className="bg-white border border-border rounded-xl p-8 text-center text-muted-foreground">
                  <p className="text-sm">No rooms currently available</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableRooms.map((room) => (
                    <Link key={room.id} href={`/rooms/${room.id}`} className="room-card group">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{room.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Room {room.number}</div>
                        </div>
                        <span className="status-badge status-available text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          Available
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {buildings.find(b => b.id === room.buildingId)?.shortName ?? 'Unknown'}
                        </span>
                        {room.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {room.capacity} seats
                          </span>
                        )}
                      </div>
                      {room.nextSchedule && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Next: {room.nextSchedule.title.split(':')[0]} at {formatTime(room.nextSchedule.startTime)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recently viewed */}
            {recentRooms.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Recently Viewed</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {recentRooms.map((room) => (
                    <Link key={room.id} href={`/rooms/${room.id}`} className="room-card group flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_INDICATOR_COLORS[room.currentStatus]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">{room.name}</div>
                        <div className="text-xs text-muted-foreground">{STATUS_LABELS[room.currentStatus]}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — currently occupied */}
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                  Currently Occupied
                </h2>
                <Link href="/rooms?status=occupied" className="text-sm text-primary hover:underline flex items-center gap-1">
                  All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {occupiedRooms.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No rooms currently occupied</div>
                ) : occupiedRooms.map((room) => (
                  <Link key={room.id} href={`/rooms/${room.id}`} className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg hover:border-red-200 hover:bg-red-50/30 transition-all group">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-red-700 transition-colors">{room.name}</div>
                      {room.currentSchedule && (
                        <div className="text-xs text-muted-foreground truncate">{room.currentSchedule.title}</div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {room.currentSchedule ? `until ${formatTime(room.currentSchedule.endTime)}` : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick links */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">Quick Links</h2>
              <div className="space-y-2">
                {[
                  { href: '/faculty', label: 'Faculty Directory', icon: <UserRound className="h-4 w-4" /> },
                  { href: '/facilities', label: 'Campus Facilities', icon: <Building2 className="h-4 w-4" /> },
                  { href: '/rooms', label: 'All Rooms', icon: <MapPin className="h-4 w-4" /> },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-3 bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all group text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-primary">{link.icon}</span>
                    {link.label}
                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </section>

            {/* Current time */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">Campus Time</span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
