'use client'

import { use, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Users,
  GraduationCap,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  HelpCircle,
  Calendar,
  UserRound,
  Shield,
  Info,
  ChevronRight,
  Monitor,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  WORKING_DAYS,
  DAY_LABELS,
  DAY_SHORT,
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatTime,
  formatTimeRange,
  formatDate,
  getFloorLabel,
  cn,
} from '@/lib/utils'
import { buildDailyTimetable, getDayOfWeek, getSchedulesForDate, getExceptionsForDate } from '@/lib/availability'
import type { RoomWithStatus, DayOfWeek, RoomStatus, TimeSlot } from '@/types'

const STATUS_CONFIG: Record<RoomStatus, { icon: React.ReactNode; badge: string; label: string }> = {
  available: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    badge: 'status-badge status-available',
    label: 'Available',
  },
  occupied: {
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    badge: 'status-badge status-occupied',
    label: 'Occupied',
  },
  upcoming: {
    icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
    badge: 'status-badge status-upcoming',
    label: 'Class Soon',
  },
  closed: {
    icon: <XCircle className="h-5 w-5 text-slate-500" />,
    badge: 'status-badge status-closed',
    label: 'Closed',
  },
  maintenance: {
    icon: <Wrench className="h-5 w-5 text-orange-600" />,
    badge: 'status-badge status-maintenance',
    label: 'Maintenance',
  },
  unknown: {
    icon: <HelpCircle className="h-5 w-5 text-gray-500" />,
    badge: 'status-badge status-unknown',
    label: 'Unverified',
  },
}

const SLOT_STYLES: Record<RoomStatus, string> = {
  available: 'bg-emerald-50 border-l-4 border-l-emerald-500 text-emerald-800',
  occupied: 'bg-red-50 border-l-4 border-l-red-500 text-red-800',
  upcoming: 'bg-amber-50 border-l-4 border-l-amber-500 text-amber-800',
  closed: 'bg-slate-100 border-l-4 border-l-slate-400 text-slate-600',
  maintenance: 'bg-orange-50 border-l-4 border-l-orange-500 text-orange-800',
  unknown: 'bg-gray-100 border-l-4 border-l-gray-400 text-gray-600',
}

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const {
    rooms,
    buildings,
    departments,
    schedules,
    exceptions,
    faculty,
    settings,
    currentTime,
    selectedDay,
    setSelectedDay,
    getRoomWithStatus,
    addRecentlyViewed,
    currentUser,
  } = useAppStore()

  const room = rooms.find((r) => r.id === params.id)
  if (!room) notFound()

  const roomWithStatus = getRoomWithStatus(params.id, currentTime)!
  const building = buildings.find((b) => b.id === room.buildingId)
  const dept = departments.find((d) => d.id === room.departmentId)
  const roomSchedules = schedules.filter((s) => s.roomId === room.id)
  const roomExceptions = exceptions.filter((e) => e.roomId === room.id)
  const roomFaculty = faculty.filter((f) => f.officeRoomId === room.id)

  useEffect(() => {
    addRecentlyViewed(params.id)
  }, [params.id])

  // Build timetable for selected day
  const selectedDayDate = (() => {
    const today = new Date(currentTime)
    const todayDay = WORKING_DAYS[Math.min(today.getDay(), 4)]
    const todayIdx = WORKING_DAYS.indexOf(todayDay)
    const selectedIdx = WORKING_DAYS.indexOf(selectedDay)
    const diff = selectedIdx - todayIdx
    const d = new Date(today)
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  })()

  const timetableSlots = buildDailyTimetable(
    room,
    roomSchedules,
    roomExceptions,
    selectedDayDate,
    settings.defaultOpenTime,
    settings.defaultCloseTime,
  )

  const statusConfig = STATUS_CONFIG[roomWithStatus.currentStatus]
  const isToday = selectedDay === WORKING_DAYS[Math.min(currentTime.getDay(), 4)]

  // Weekly schedule overview
  const weeklySchedule: Record<DayOfWeek, typeof roomSchedules> = {
    sunday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'sunday'),
    monday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'monday'),
    tuesday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'tuesday'),
    wednesday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'wednesday'),
    thursday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'thursday'),
    friday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'friday'),
    saturday: roomSchedules.filter(s => s.isActive && s.dayOfWeek === 'saturday'),
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Back navigation */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Room header */}
        <div className="bg-white border border-border rounded-xl p-6">
          {/* Demo + maintenance notice */}
          {settings.isDemo && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              Demo Data — This is fictional room information
            </div>
          )}
          {room.isTemporaryClosed && (
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <Wrench className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-900 text-sm">Temporarily Closed</div>
                <div className="text-orange-700 text-sm mt-0.5">{room.temporaryClosureReason}</div>
                {room.temporaryClosureUntil && (
                  <div className="text-xs text-orange-600 mt-1">Expected to reopen: {room.temporaryClosureUntil}</div>
                )}
              </div>
            </div>
          )}
          {!room.scheduleVerified && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-900 text-sm">Availability Unverified</div>
                <div className="text-yellow-700 text-sm mt-0.5">Schedule data for this room has not been verified. Status may be inaccurate.</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[room.category]}
                </span>
                <span className="text-xs text-muted-foreground">Room {room.number}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
              {room.description && (
                <p className="text-muted-foreground text-sm mt-2 max-w-2xl">{room.description}</p>
              )}
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className={statusConfig.badge}>
                {statusConfig.icon}
                {statusConfig.label}
              </span>
              {roomWithStatus.currentSchedule && (
                <div className="text-xs text-muted-foreground text-right">
                  <span className="font-medium">{roomWithStatus.currentSchedule.title}</span>
                  <br />
                  until {formatTime(roomWithStatus.currentSchedule.endTime)}
                </div>
              )}
              {!roomWithStatus.currentSchedule && roomWithStatus.nextSchedule && (
                <div className="text-xs text-muted-foreground text-right">
                  Next: {formatTime(roomWithStatus.nextSchedule.startTime)}
                </div>
              )}
            </div>
          </div>

          {/* Room meta */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-muted-foreground">Building</div>
                <div className="text-sm font-medium text-foreground">{building?.name ?? 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{getFloorLabel(room.floor)}</div>
              </div>
            </div>
            {dept && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Department</div>
                  <div className="text-sm font-medium text-foreground">{dept.name}</div>
                  <div className="text-xs text-muted-foreground">{dept.shortName}</div>
                </div>
              </div>
            )}
            {room.capacity && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Capacity</div>
                  <div className="text-sm font-medium text-foreground">{room.capacity} people</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-muted-foreground">Operating Hours</div>
                <div className="text-sm font-medium text-foreground">
                  {formatTime(room.openTime ?? settings.defaultOpenTime)} – {formatTime(room.closeTime ?? settings.defaultCloseTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Facilities */}
          {room.facilities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">Facilities</div>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((f) => (
                  <span key={f} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Location instructions */}
          {room.locationInstructions && (
            <div className="mt-4 pt-4 border-t border-border flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">How to find this room</div>
                <p className="text-sm text-foreground">{room.locationInstructions}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Timetable for selected day */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Schedule — {DAY_LABELS[selectedDay]}
                  {isToday && <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Today</span>}
                </h2>
              </div>

              {/* Day selector */}
              <div className="flex overflow-x-auto border-b border-border">
                {WORKING_DAYS.map((day) => {
                  const isSelectedDay = day === selectedDay
                  const daySchedules = weeklySchedule[day]
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'flex-1 min-w-[80px] px-3 py-3 text-center transition-colors border-b-2',
                        isSelectedDay
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      <div className="text-xs font-semibold">{DAY_SHORT[day]}</div>
                      <div className="text-[10px] mt-0.5">{daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''}</div>
                    </button>
                  )
                })}
              </div>

              {/* Timetable slots */}
              <div className="p-4 space-y-2">
                {timetableSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No schedule data available for {DAY_LABELS[selectedDay]}
                  </div>
                ) : timetableSlots.map((slot, i) => (
                  <div key={i} className={cn('rounded-lg p-3', SLOT_STYLES[slot.status])}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{formatTimeRange(slot.startTime, slot.endTime)}</div>
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {slot.status === 'available' ? 'Free' : slot.status === 'occupied' ? 'Occupied' : STATUS_LABELS[slot.status]}
                      </span>
                    </div>
                    {slot.title && (
                      <div className="text-sm mt-1 font-semibold">{slot.title}</div>
                    )}
                    {slot.instructorName && (
                      <div className="text-xs mt-0.5 opacity-75 flex items-center gap-1">
                        <UserRound className="h-3 w-3" />
                        {slot.instructorName}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-6 py-3 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Schedule last updated: {new Date(room.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Faculty in this room */}
            {roomFaculty.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  Faculty
                </h3>
                <div className="space-y-3">
                  {roomFaculty.map((member) => (
                    <Link key={member.id} href={`/faculty/${member.id}`} className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{member.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.designation}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Admin actions */}
            {currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ? (
              <div className="bg-white border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Admin Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href={`/admin/rooms/${room.id}/edit`}
                    className="block w-full text-center text-sm font-medium py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Edit Room
                  </Link>
                  <Link
                    href={`/admin/rooms/${room.id}/schedules`}
                    className="block w-full text-center text-sm font-medium py-2 px-4 border border-border rounded-lg hover:bg-secondary transition-colors"
                  >
                    Manage Schedules
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Weekly summary */}
            <div className="bg-white border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Weekly Overview
              </h3>
              <div className="space-y-2">
                {WORKING_DAYS.map((day) => {
                  const daySchedules = weeklySchedule[day]
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'w-full flex items-center justify-between text-sm p-2 rounded-lg transition-colors text-left',
                        day === selectedDay ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      )}
                    >
                      <span className="font-medium">{DAY_LABELS[day]}</span>
                      <span className="text-xs text-muted-foreground">
                        {daySchedules.length === 0 ? 'No classes' : `${daySchedules.length} class${daySchedules.length !== 1 ? 'es' : ''}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
