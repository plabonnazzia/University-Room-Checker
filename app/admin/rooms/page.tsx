'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  DoorOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  HelpCircle,
  Archive,
  ArrowLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_LABELS, getFloorLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/rooms/status-badge'
import type { Room, RoomCategory } from '@/types'

export default function AdminRoomsPage() {
  const {
    rooms,
    buildings,
    departments,
    updateRoom,
    archiveRoom,
    currentTime,
    getRoomWithStatus,
  } = useAppStore()

  const [search, setSearch] = React.useState('')
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('all')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [filterActive, setFilterActive] = React.useState<boolean>(true)

  const filteredRooms = rooms.filter((r) => {
    if (filterActive && !r.isActive) return false
    if (!filterActive && r.isActive) return false
    if (selectedBuilding !== 'all' && r.buildingId !== selectedBuilding) return false
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const b = buildings.find((x) => x.id === r.buildingId)?.name.toLowerCase() ?? ''
      const text = `${r.name} ${r.number} ${r.category} ${b}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  const toggleClosure = (room: Room) => {
    if (room.isTemporaryClosed) {
      updateRoom(room.id, {
        isTemporaryClosed: false,
        temporaryClosureReason: undefined,
        temporaryClosureUntil: undefined,
      })
    } else {
      const reason = window.prompt(
        `Enter closure reason for room "${room.name}":`,
        'Under maintenance'
      )
      if (reason) {
        updateRoom(room.id, {
          isTemporaryClosed: true,
          temporaryClosureReason: reason,
        })
      }
    }
  }

  const toggleVerified = (room: Room) => {
    updateRoom(room.id, {
      scheduleVerified: !room.scheduleVerified,
    })
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Admin Dashboard
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Room Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Configure classrooms, labs, offices, operating hours, and temporary closures.
                </p>
              </div>

              <Button asChild>
                <Link href="/admin/rooms/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add New Room
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Controls */}
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rooms by number, name, or building..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                {(Object.entries(CATEGORY_LABELS) as [RoomCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilterActive(!filterActive)}
                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors ${
                  filterActive
                    ? 'bg-secondary text-foreground border-border'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {filterActive ? 'Showing Active' : 'Showing Archived'}
              </button>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Verified</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        No rooms match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room) => {
                      const building = buildings.find((b) => b.id === room.buildingId)
                      const roomStatus = getRoomWithStatus(room.id, currentTime)

                      return (
                        <tr key={room.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-foreground">{room.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">Room {room.number}</div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {CATEGORY_LABELS[room.category]}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-foreground text-xs font-medium">{building?.name ?? 'Main'}</div>
                            <div className="text-xs text-muted-foreground">{getFloorLabel(room.floor)}</div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {roomStatus && <StatusBadge status={roomStatus.currentStatus} />}
                              {room.isTemporaryClosed && (
                                <span className="text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                  Closure Flag
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              onClick={() => toggleVerified(room)}
                              className={`text-xs px-2 py-1 rounded font-medium border transition-colors ${
                                room.scheduleVerified
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                              }`}
                              title="Click to toggle schedule verification status"
                            >
                              {room.scheduleVerified ? 'Verified' : 'Unverified'}
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                                <Link href={`/admin/rooms/${room.id}/schedules`} title="Manage Room Schedules">
                                  <Calendar className="h-4 w-4 text-primary" />
                                </Link>
                              </Button>

                              <Button asChild size="sm" variant="ghost" className="h-8 px-2">
                                <Link href={`/admin/rooms/${room.id}/edit`} title="Edit Room Properties">
                                  <Edit className="h-4 w-4 text-slate-600" />
                                </Link>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-orange-600 hover:bg-orange-50"
                                onClick={() => toggleClosure(room)}
                                title={room.isTemporaryClosed ? 'Remove Temporary Closure' : 'Mark Temporarily Closed'}
                              >
                                <Wrench className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm(`Archive room "${room.name}"?`)) {
                                    updateRoom(room.id, { isActive: !room.isActive })
                                  }
                                }}
                                title={room.isActive ? 'Archive Room' : 'Restore Room'}
                              >
                                <Archive className="h-4 w-4" />
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

            <div className="px-5 py-3 border-t border-border bg-slate-50 text-xs text-muted-foreground flex items-center justify-between">
              <span>Showing {filteredRooms.length} room(s)</span>
              <span>Click calendar icon to manage recurring schedules & date overrides</span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
