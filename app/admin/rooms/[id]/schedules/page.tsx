'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  Clock,
  UserRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  WORKING_DAYS,
  DAY_LABELS,
  formatTimeRange,
  formatTime,
} from '@/lib/utils'
import { timeToMinutes, timeRangesOverlap } from '@/lib/availability'
import type { DayOfWeek, RoomSchedule, ScheduleException, ScheduleExceptionType } from '@/types'

export default function RoomSchedulesPage({ params }: { params: { id: string } }) {
  const {
    rooms,
    schedules,
    exceptions,
    faculty,
    addSchedule,
    deleteSchedule,
    addException,
    deleteException,
  } = useAppStore()

  const room = rooms.find((r) => r.id === params.id)

  const [activeTab, setActiveTab] = React.useState<'schedules' | 'exceptions'>('schedules')

  // New Schedule State
  const [showAddSchedule, setShowAddSchedule] = React.useState(false)
  const [schTitle, setSchTitle] = React.useState('')
  const [schDay, setSchDay] = React.useState<DayOfWeek>('sunday')
  const [schStartTime, setSchStartTime] = React.useState('09:00')
  const [schEndTime, setSchEndTime] = React.useState('10:30')
  const [schInstructor, setSchInstructor] = React.useState('')
  const [schBuffer, setSchBuffer] = React.useState(5)
  const [schRecurring, setSchRecurring] = React.useState(true)
  const [schSpecificDate, setSchSpecificDate] = React.useState('')
  const [schError, setSchError] = React.useState<string | null>(null)

  // New Exception State
  const [showAddException, setShowAddException] = React.useState(false)
  const [excType, setExcType] = React.useState<ScheduleExceptionType>('cancellation')
  const [excTitle, setExcTitle] = React.useState('')
  const [excDate, setExcDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [excStartTime, setExcStartTime] = React.useState('08:00')
  const [excEndTime, setExcEndTime] = React.useState('12:00')
  const [excAllDay, setExcAllDay] = React.useState(true)

  if (!room) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-center text-muted-foreground">Room not found.</div>
      </ProtectedRoute>
    )
  }

  const roomSchedules = schedules.filter((s) => s.roomId === room.id)
  const roomExceptions = exceptions.filter((e) => e.roomId === room.id)

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    setSchError(null)

    if (!schTitle.trim()) {
      setSchError('Please provide a course or activity title.')
      return
    }

    const startM = timeToMinutes(schStartTime)
    const endM = timeToMinutes(schEndTime)

    if (startM >= endM) {
      setSchError('Start time must be before end time.')
      return
    }

    // Check for overlap with existing schedules on same day
    const existingSameDay = roomSchedules.filter(
      (s) => s.isActive && (s.isRecurring ? s.dayOfWeek === schDay : true)
    )

    for (const ex of existingSameDay) {
      const exStart = timeToMinutes(ex.startTime)
      const exEnd = timeToMinutes(ex.endTime) + ex.bufferAfterMinutes
      const newEnd = endM + schBuffer

      if (timeRangesOverlap(startM, newEnd, exStart, exEnd)) {
        setSchError(
          `Schedule overlaps with existing activity "${ex.title}" (${ex.startTime} - ${ex.endTime}).`
        )
        return
      }
    }

    const matchedFaculty = faculty.find(
      (f) => f.name.toLowerCase() === schInstructor.toLowerCase()
    )

    const newSch: RoomSchedule = {
      id: `sch-${Date.now()}`,
      roomId: room.id,
      title: schTitle.trim(),
      dayOfWeek: schDay,
      startTime: schStartTime,
      endTime: schEndTime,
      instructorName: schInstructor.trim() || undefined,
      instructorId: matchedFaculty?.id,
      bufferAfterMinutes: Number(schBuffer),
      isRecurring: schRecurring,
      specificDate: !schRecurring ? schSpecificDate : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addSchedule(newSch)
    setSchTitle('')
    setShowAddSchedule(false)
  }

  const handleCreateException = (e: React.FormEvent) => {
    e.preventDefault()
    if (!excTitle.trim()) return

    const newExc: ScheduleException = {
      id: `exc-${Date.now()}`,
      roomId: room.id,
      type: excType,
      title: excTitle.trim(),
      date: excDate,
      startTime: excAllDay ? undefined : excStartTime,
      endTime: excAllDay ? undefined : excEndTime,
      createdAt: new Date().toISOString(),
    }

    addException(newExc)
    setExcTitle('')
    setShowAddException(false)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/admin/rooms"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Room List
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Schedule Management: {room.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Room {room.number} · Manage recurring class schedules, one-time reservations, and cancellations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowAddSchedule(true)
                    setActiveTab('schedules')
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Class Schedule
                </Button>
                <Button
                  onClick={() => {
                    setShowAddException(true)
                    setActiveTab('exceptions')
                  }}
                  variant="outline"
                  size="sm"
                >
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  Add Exception / Closure
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mt-6 border-b border-border text-sm">
              <button
                onClick={() => setActiveTab('schedules')}
                className={`pb-2.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'schedules'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Recurring Schedules ({roomSchedules.length})
              </button>
              <button
                onClick={() => setActiveTab('exceptions')}
                className={`pb-2.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'exceptions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Date Exceptions & Overrides ({roomExceptions.length})
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Add Schedule Modal / Form */}
          {showAddSchedule && (
            <div className="bg-white border border-border rounded-xl p-6 shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Add Class or Recurring Booking
                </h3>
                <button
                  onClick={() => setShowAddSchedule(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              {schError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{schError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="sch-title">Course Code & Title *</Label>
                    <Input
                      id="sch-title"
                      placeholder="e.g. CSE-301: Data Structures"
                      value={schTitle}
                      onChange={(e) => setSchTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sch-inst">Instructor / Faculty</Label>
                    <Input
                      id="sch-inst"
                      placeholder="e.g. Dr. Rahim Ahmed"
                      value={schInstructor}
                      onChange={(e) => setSchInstructor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="sch-day">Day of Week</Label>
                    <select
                      id="sch-day"
                      value={schDay}
                      onChange={(e) => setSchDay(e.target.value as DayOfWeek)}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {WORKING_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {DAY_LABELS[d]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sch-start">Start Time</Label>
                    <Input
                      id="sch-start"
                      type="time"
                      value={schStartTime}
                      onChange={(e) => setSchStartTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sch-end">End Time</Label>
                    <Input
                      id="sch-end"
                      type="time"
                      value={schEndTime}
                      onChange={(e) => setSchEndTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="sch-buf">Buffer (Minutes)</Label>
                    <Input
                      id="sch-buf"
                      type="number"
                      min={0}
                      max={60}
                      value={schBuffer}
                      onChange={(e) => setSchBuffer(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSchedule(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Schedule
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Add Exception Form */}
          {showAddException && (
            <div className="bg-white border border-amber-300 rounded-xl p-6 shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Add Specific Date Exception / Override
                </h3>
                <button
                  onClick={() => setShowAddException(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateException} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="exc-type">Exception Type</Label>
                    <select
                      id="exc-type"
                      value={excType}
                      onChange={(e) => setExcType(e.target.value as ScheduleExceptionType)}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="cancellation">Class Cancellation</option>
                      <option value="closure">Emergency Closure</option>
                      <option value="maintenance">Maintenance Period</option>
                      <option value="one_time_booking">One-Time Special Booking</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="exc-date">Date</Label>
                    <Input
                      id="exc-date"
                      type="date"
                      value={excDate}
                      onChange={(e) => setExcDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="exc-title">Reason / Event Name</Label>
                    <Input
                      id="exc-title"
                      placeholder="e.g. Faculty Meeting, Special Exam"
                      value={excTitle}
                      onChange={(e) => setExcTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="exc-allday"
                    type="checkbox"
                    checked={excAllDay}
                    onChange={(e) => setExcAllDay(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="exc-allday" className="cursor-pointer text-xs">
                    Applies for the entire operating day (all day)
                  </Label>
                </div>

                {!excAllDay && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="exc-start">Start Time</Label>
                      <Input
                        id="exc-start"
                        type="time"
                        value={excStartTime}
                        onChange={(e) => setExcStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="exc-end">End Time</Label>
                      <Input
                        id="exc-end"
                        type="time"
                        value={excEndTime}
                        onChange={(e) => setExcEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddException(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Exception
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Schedules List Tab */}
          {activeTab === 'schedules' && (
            <div className="space-y-6">
              {WORKING_DAYS.map((day) => {
                const daySchedules = roomSchedules.filter((s) => s.dayOfWeek === day)

                return (
                  <div key={day} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                        {DAY_LABELS[day]}
                      </h3>
                      <span className="text-xs text-muted-foreground font-mono">
                        {daySchedules.length} activity
                      </span>
                    </div>

                    {daySchedules.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        No scheduled classes on this day.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {daySchedules.map((sch) => (
                          <div
                            key={sch.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-all gap-2"
                          >
                            <div>
                              <div className="font-semibold text-sm text-foreground">
                                {sch.title}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                                <span className="font-mono text-primary">
                                  {formatTimeRange(sch.startTime, sch.endTime)}
                                </span>
                                {sch.instructorName && (
                                  <span className="flex items-center gap-1">
                                    <UserRound className="h-3 w-3" />
                                    {sch.instructorName}
                                  </span>
                                )}
                                {sch.bufferAfterMinutes > 0 && (
                                  <span className="text-slate-400">
                                    +{sch.bufferAfterMinutes}m buffer
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 h-8 self-end sm:self-center"
                              onClick={() => {
                                if (confirm(`Remove schedule "${sch.title}"?`)) {
                                  deleteSchedule(sch.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Exceptions List Tab */}
          {activeTab === 'exceptions' && (
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-base text-foreground mb-4">
                Date Overrides & Temporary Exceptions
              </h3>

              {roomExceptions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No one-time cancellations or overrides configured for this room.
                </div>
              ) : (
                <div className="space-y-3">
                  {roomExceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-amber-300 transition-all gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {exc.type.replace('_', ' ')}
                          </span>
                          <span className="font-semibold text-sm text-foreground">
                            {exc.title}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Date: <span className="font-medium text-foreground">{exc.date}</span>{' '}
                          {exc.startTime && exc.endTime
                            ? `(${formatTimeRange(exc.startTime, exc.endTime)})`
                            : '(All Day)'}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 h-8"
                        onClick={() => {
                          if (confirm(`Remove exception "${exc.title}"?`)) {
                            deleteException(exc.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
