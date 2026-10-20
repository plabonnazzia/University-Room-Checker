'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Calendar,
  Search,
  Plus,
  ArrowLeft,
  DoorOpen,
  UserRound,
  Trash2,
  Clock,
  Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WORKING_DAYS, DAY_LABELS, formatTimeRange } from '@/lib/utils'
import type { DayOfWeek } from '@/types'

export default function AdminGlobalSchedulesPage() {
  const { schedules, rooms, buildings, deleteSchedule } = useAppStore()

  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek | 'all'>('all')
  const [selectedRoom, setSelectedRoom] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')

  const filtered = schedules.filter((s) => {
    if (selectedDay !== 'all' && s.dayOfWeek !== selectedDay) return false
    if (selectedRoom !== 'all' && s.roomId !== selectedRoom) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const room = rooms.find((r) => r.id === s.roomId)
      const text = `${s.title} ${s.instructorName ?? ''} ${room?.name ?? ''} ${room?.number ?? ''}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Campus Schedules</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Browse and inspect all room bookings across the five campus working days.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Filters */}
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search schedules by title, instructor, or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value as DayOfWeek | 'all')}
                className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Days</option>
                {WORKING_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>

              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Rm {r.number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedules Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Course / Activity</th>
                    <th className="px-5 py-3">Day</th>
                    <th className="px-5 py-3">Time Window</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Instructor</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        No schedules found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sch) => {
                      const room = rooms.find((r) => r.id === sch.roomId)
                      const building = room ? buildings.find((b) => b.id === room.buildingId) : null

                      return (
                        <tr key={sch.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4 font-semibold text-foreground">
                            {sch.title}
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {DAY_LABELS[sch.dayOfWeek]}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-mono text-xs text-primary font-medium">
                            {formatTimeRange(sch.startTime, sch.endTime)}
                            {sch.bufferAfterMinutes > 0 && (
                              <span className="text-slate-400 block text-[10px]">
                                +{sch.bufferAfterMinutes}m buffer
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {room ? (
                              <Link
                                href={`/admin/rooms/${room.id}/schedules`}
                                className="text-primary hover:underline font-medium text-xs flex items-center gap-1"
                              >
                                <DoorOpen className="h-3.5 w-3.5" />
                                {room.name} (Rm {room.number})
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">Unassigned</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {sch.instructorName ? (
                              <span className="flex items-center gap-1 text-foreground">
                                <UserRound className="h-3.5 w-3.5 text-primary" />
                                {sch.instructorName}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {room && (
                                <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
                                  <Link href={`/admin/rooms/${room.id}/schedules`}>
                                    Manage
                                  </Link>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(`Delete schedule "${sch.title}"?`)) {
                                    deleteSchedule(sch.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border bg-slate-50 text-xs text-muted-foreground">
              Total {filtered.length} schedule record(s) listed
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
