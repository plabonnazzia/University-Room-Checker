'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Shield,
  DoorOpen,
  Calendar,
  Users,
  AlertTriangle,
  Upload,
  Download,
  Settings,
  Plus,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Wrench,
  HelpCircle,
  History,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { detectScheduleConflicts, summarizeAvailability } from '@/lib/availability'
import { formatTime, formatDate } from '@/lib/utils'

export default function AdminDashboardPage() {
  const {
    rooms,
    schedules,
    faculty,
    buildings,
    departments,
    currentTime,
    getRoomsWithStatus,
    auditLog,
    settings,
  } = useAppStore()

  const roomsWithStatus = getRoomsWithStatus(currentTime)
  const summary = summarizeAvailability(
    roomsWithStatus.map((r) => ({
      roomId: r.id,
      status: r.currentStatus,
      isVerified: r.scheduleVerified,
      computedAt: currentTime.toISOString(),
    }))
  )

  const conflicts = detectScheduleConflicts(schedules)
  const totalRooms = rooms.length
  const occupiedCount = summary.occupied
  const utilizationPct = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    <Shield className="h-3 w-3" />
                    Administration Center
                  </span>
                  {settings.isDemo && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      Demo Environment
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Campus Management Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Overview of campus space utilization, room schedules, conflict alerts, and resource management.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/import-export">
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    CSV Data
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/admin/rooms/new">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Room
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Conflict Alert Banner if any conflicts exist */}
          {conflicts.hasConflict && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    {conflicts.conflictingSchedules.length} Schedule Conflict(s) Detected
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5 max-w-xl">
                    Certain room schedules overlap with each other or with buffer periods on the same day. Overlaps are never silently merged.
                  </p>
                </div>
              </div>

              <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0">
                <Link href="/admin/conflicts">
                  Review Conflicts
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Rooms</span>
                <DoorOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{totalRooms}</div>
              <div className="text-xs text-muted-foreground mt-1">Across {buildings.length} campus buildings</div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Utilization</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">{utilizationPct}%</div>
              <div className="text-xs text-muted-foreground mt-1">{summary.occupied} currently occupied</div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Bookings</span>
                <Calendar className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">{schedules.filter((s) => s.isActive).length}</div>
              <div className="text-xs text-muted-foreground mt-1">Recurring & date schedules</div>
            </div>

            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty Members</span>
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">{faculty.length}</div>
              <div className="text-xs text-muted-foreground mt-1">In {departments.length} departments</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Manage Rooms', icon: <DoorOpen className="h-5 w-5" />, href: '/admin/rooms', desc: 'Create, edit & status' },
              { label: 'Room Schedules', icon: <Calendar className="h-5 w-5" />, href: '/admin/schedules', desc: 'Timetables & overrides' },
              { label: 'Faculty Directory', icon: <Users className="h-5 w-5" />, href: '/admin/faculty', desc: 'Offices & hours' },
              { label: 'Conflict Engine', icon: <AlertTriangle className="h-5 w-5" />, href: '/admin/conflicts', desc: 'Overlap checks' },
              { label: 'CSV Import/Export', icon: <FileSpreadsheet className="h-5 w-5" />, href: '/admin/import-export', desc: 'Bulk import & backup' },
              { label: 'Campus Settings', icon: <Settings className="h-5 w-5" />, href: '/admin/settings', desc: 'Hours & branding' },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white border border-border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors mb-3">
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Status Breakdown & Audit Log */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Real-time Status Breakdown */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Live Status Breakdown
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Available', count: summary.available, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" /> },
                  { label: 'Occupied', count: summary.occupied, color: 'text-red-700 bg-red-50 border-red-200', icon: <XCircle className="h-4 w-4 text-red-600" /> },
                  { label: 'Upcoming Class', count: summary.upcoming, color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock className="h-4 w-4 text-amber-600" /> },
                  { label: 'Closed (Hours)', count: summary.closed, color: 'text-slate-700 bg-slate-50 border-slate-200', icon: <XCircle className="h-4 w-4 text-slate-500" /> },
                  { label: 'Under Maintenance', count: summary.maintenance, color: 'text-orange-700 bg-orange-50 border-orange-200', icon: <Wrench className="h-4 w-4 text-orange-600" /> },
                  { label: 'Unverified Schedule', count: summary.unknown, color: 'text-gray-700 bg-gray-50 border-gray-200', icon: <HelpCircle className="h-4 w-4 text-gray-500" /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-3 rounded-lg border ${item.color}`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className="font-bold text-sm">{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button asChild variant="outline" className="w-full text-xs" size="sm">
                  <Link href="/admin/rooms">Manage All Rooms & Overrides</Link>
                </Button>
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="lg:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Recent Audit History
                  </h3>
                  <Link href="/admin/audit" className="text-xs text-primary hover:underline">
                    View Full Audit
                  </Link>
                </div>

                {auditLog.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No recent administrative changes recorded yet. Changes to rooms, schedules, and faculty will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLog.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-secondary/30 border border-border/60 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase text-[10px] tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {log.action}
                            </span>
                            <span className="font-semibold text-foreground">{log.entityName}</span>
                            <span className="text-muted-foreground">({log.entityType})</span>
                          </div>
                          <div className="text-muted-foreground text-[11px] mt-1">
                            By {log.userEmail}
                          </div>
                        </div>
                        <div className="text-muted-foreground text-[11px] font-mono shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>System Time: {formatDate(currentTime)} {currentTime.toLocaleTimeString()}</span>
                <span>Timezone: {settings.timezone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
