'use client'

import * as React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  UserRound,
  Building2,
  MapPin,
  Clock,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  ChevronRight,
  Crown,
  BookOpen,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DAY_LABELS, formatTime, formatTimeRange } from '@/lib/utils'
import { StatusBadge } from '@/components/rooms/status-badge'
import { Button } from '@/components/ui/button'

export default function FacultyDetailPage({ params }: { params: { id: string } }) {
  const { faculty, rooms, buildings, departments, schedules, currentTime, getRoomWithStatus } = useAppStore()

  const member = faculty.find((f) => f.id === params.id)
  if (!member) notFound()

  const dept = departments.find((d) => d.id === member.departmentId)
  const officeRoom = member.officeRoomId ? getRoomWithStatus(member.officeRoomId, currentTime) : null
  const officeBuilding = officeRoom ? buildings.find((b) => b.id === officeRoom.buildingId) : null

  // Schedules taught by this instructor
  const teachingSchedules = schedules.filter(
    (s) => s.isActive && (s.instructorId === member.id || s.instructorName?.toLowerCase() === member.name.toLowerCase())
  )

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const isLeadership =
    member.designation.toLowerCase().includes('chairman') ||
    member.designation.toLowerCase().includes('dean')

  return (
    <div className="min-h-screen bg-[hsl(var(--university-surface))]">
      {/* Back nav */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/faculty"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Faculty Directory
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header card */}
        <div className="bg-white border border-border rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0">
              {initials}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {isLeadership && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="h-3 w-3" />
                    University Leadership
                  </span>
                )}
                {dept && (
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                    {dept.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {member.name}
              </h1>
              <p className="text-base text-muted-foreground mt-0.5 font-medium">
                {member.designation}
              </p>

              {member.bio && (
                <p className="text-sm text-foreground/80 mt-3 max-w-2xl leading-relaxed">
                  {member.bio}
                </p>
              )}

              {/* Contact Information */}
              {member.contactPublished && (member.email || member.phone) && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-1.5 hover:text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{member.email}</span>
                    </a>
                  )}
                  {member.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content: Office Hours & Teaching */}
          <div className="lg:col-span-2 space-y-6">
            {/* Office Hours */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Office Hours
              </h2>

              {!member.officeHours || member.officeHours.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Office hours are arranged by appointment.
                </p>
              ) : (
                <div className="space-y-3">
                  {member.officeHours.map((oh, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-secondary/30 border border-border/50 gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {DAY_LABELS[oh.day]}
                        </span>
                        {oh.note && (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            {oh.note}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatTimeRange(oh.startTime, oh.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teaching Schedule */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Teaching Schedule & Classes
              </h2>

              {teachingSchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No currently scheduled regular courses in the system.
                </p>
              ) : (
                <div className="space-y-3">
                  {teachingSchedules.map((sch) => {
                    const room = rooms.find((r) => r.id === sch.roomId)
                    return (
                      <div
                        key={sch.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-primary/30 transition-all gap-3"
                      >
                        <div>
                          <div className="font-semibold text-sm text-foreground">
                            {sch.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{DAY_LABELS[sch.dayOfWeek]}</span>
                            <span>•</span>
                            <span>{formatTimeRange(sch.startTime, sch.endTime)}</span>
                          </div>
                        </div>

                        {room && (
                          <Link
                            href={`/rooms/${room.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-md"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Room {room.number}</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Office Room & Location */}
          <div className="space-y-6">
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Office Location
              </h3>

              {officeRoom ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm text-foreground">
                        {officeRoom.name}
                      </div>
                      <StatusBadge status={officeRoom.currentStatus} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Room Number: <strong className="text-foreground">{officeRoom.number}</strong></div>
                      <div>Building: <span className="text-foreground">{officeBuilding?.name ?? 'Main Campus'}</span></div>
                      <div>Floor: <span className="text-foreground">{officeRoom.floor}</span></div>
                    </div>
                  </div>

                  {officeRoom.locationInstructions && (
                    <div className="text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <span className="font-medium text-foreground block mb-0.5">Directions:</span>
                      {officeRoom.locationInstructions}
                    </div>
                  )}

                  <Button asChild className="w-full" size="sm">
                    <Link href={`/rooms/${officeRoom.id}`}>
                      View Office Room Details
                      <ChevronRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic text-center py-6">
                  No office room assigned or published yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
