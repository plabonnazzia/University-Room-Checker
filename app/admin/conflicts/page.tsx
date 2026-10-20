'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  DoorOpen,
  Clock,
  Trash2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { detectScheduleConflicts } from '@/lib/availability'
import { DAY_LABELS, formatTimeRange } from '@/lib/utils'

export default function ConflictEnginePage() {
  const { schedules, rooms, buildings, deleteSchedule } = useAppStore()

  const conflictReport = detectScheduleConflicts(schedules)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        <div className="bg-white border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-primary" />
                  Schedule Conflict Engine
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Automated validation detects schedule overlaps and buffer violations. Overlaps are never merged silently.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {!conflictReport.hasConflict ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">No Schedule Conflicts Detected</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                All {schedules.length} active room bookings and buffer periods are cleanly separated with no timetable collisions.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/schedules">View All Schedules</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <strong className="font-semibold">
                    {conflictReport.conflictingSchedules.length} Overlapping Schedule Pair(s) Detected!
                  </strong>
                  <p className="text-xs text-red-700 mt-0.5">
                    Two or more scheduled activities require the same room at the same time. Please inspect and resolve each conflict below.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {conflictReport.conflictingSchedules.map(([schA, schB], idx) => {
                  const roomA = rooms.find((r) => r.id === schA.roomId)
                  const roomB = rooms.find((r) => r.id === schB.roomId)
                  const buildingA = roomA ? buildings.find((b) => b.id === roomA.buildingId) : null

                  return (
                    <div
                      key={idx}
                      className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                          <span className="font-bold text-sm text-red-900">
                            Conflict #{idx + 1} on {DAY_LABELS[schA.dayOfWeek]}
                          </span>
                          {roomA && (
                            <span className="text-xs font-mono text-muted-foreground">
                              · {roomA.name} (Room {roomA.number})
                            </span>
                          )}
                        </div>

                        {roomA && (
                          <Button asChild size="sm" variant="outline" className="text-xs h-8">
                            <Link href={`/admin/rooms/${roomA.id}/schedules`}>
                              Manage Room Schedule
                              <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Booking A */}
                        <div className="p-4 rounded-lg bg-red-50/50 border border-red-200 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                              Booking A
                            </div>
                            <h4 className="font-semibold text-sm text-foreground">
                              {schA.title}
                            </h4>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <div>
                                Time:{' '}
                                <strong className="text-foreground font-mono">
                                  {formatTimeRange(schA.startTime, schA.endTime)}
                                </strong>
                              </div>
                              {schA.instructorName && (
                                <div>Instructor: {schA.instructorName}</div>
                              )}
                              {schA.bufferAfterMinutes > 0 && (
                                <div>Buffer: +{schA.bufferAfterMinutes} mins</div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-red-100 flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-700 hover:bg-red-100 h-8 text-xs"
                              onClick={() => {
                                if (confirm(`Delete Booking A "${schA.title}" to resolve this conflict?`)) {
                                  deleteSchedule(schA.id)
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remove Booking A
                            </Button>
                          </div>
                        </div>

                        {/* Booking B */}
                        <div className="p-4 rounded-lg bg-red-50/50 border border-red-200 flex flex-col justify-between">
                          <div>
                            <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                              Booking B
                            </div>
                            <h4 className="font-semibold text-sm text-foreground">
                              {schB.title}
                            </h4>
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <div>
                                Time:{' '}
                                <strong className="text-foreground font-mono">
                                  {formatTimeRange(schB.startTime, schB.endTime)}
                                </strong>
                              </div>
                              {schB.instructorName && (
                                <div>Instructor: {schB.instructorName}</div>
                              )}
                              {schB.bufferAfterMinutes > 0 && (
                                <div>Buffer: +{schB.bufferAfterMinutes} mins</div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-red-100 flex justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-700 hover:bg-red-100 h-8 text-xs"
                              onClick={() => {
                                if (confirm(`Delete Booking B "${schB.title}" to resolve this conflict?`)) {
                                  deleteSchedule(schB.id)
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remove Booking B
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
