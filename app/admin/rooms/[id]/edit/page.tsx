'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Building2, AlertCircle, Wrench } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORY_LABELS } from '@/lib/utils'
import type { RoomCategory } from '@/types'

export default function EditRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { rooms, buildings, departments, updateRoom, settings } = useAppStore()

  const room = rooms.find((r) => r.id === params.id)

  const [number, setNumber] = React.useState('')
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState<RoomCategory>('classroom')
  const [buildingId, setBuildingId] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState('')
  const [floor, setFloor] = React.useState(1)
  const [capacity, setCapacity] = React.useState<number | ''>('')
  const [description, setDescription] = React.useState('')
  const [locationInstructions, setLocationInstructions] = React.useState('')
  const [facilitiesStr, setFacilitiesStr] = React.useState('')
  const [openTime, setOpenTime] = React.useState('')
  const [closeTime, setCloseTime] = React.useState('')
  const [scheduleVerified, setScheduleVerified] = React.useState(true)
  const [isTemporaryClosed, setIsTemporaryClosed] = React.useState(false)
  const [temporaryClosureReason, setTemporaryClosureReason] = React.useState('')
  const [temporaryClosureUntil, setTemporaryClosureUntil] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (room) {
      setNumber(room.number)
      setName(room.name)
      setCategory(room.category)
      setBuildingId(room.buildingId)
      setDepartmentId(room.departmentId || '')
      setFloor(room.floor)
      setCapacity(room.capacity || '')
      setDescription(room.description || '')
      setLocationInstructions(room.locationInstructions || '')
      setFacilitiesStr(room.facilities.join(', '))
      setOpenTime(room.openTime || settings.defaultOpenTime)
      setCloseTime(room.closeTime || settings.defaultCloseTime)
      setScheduleVerified(room.scheduleVerified)
      setIsTemporaryClosed(room.isTemporaryClosed)
      setTemporaryClosureReason(room.temporaryClosureReason || '')
      setTemporaryClosureUntil(room.temporaryClosureUntil || '')
    }
  }, [room, settings])

  if (!room) {
    return (
      <ProtectedRoute>
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
          <p className="text-muted-foreground mb-4">Room not found.</p>
          <Button asChild>
            <Link href="/admin/rooms">Back to Rooms</Link>
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim() || !name.trim()) {
      setError('Please provide both Room Number and Room Name.')
      return
    }

    const facilities = facilitiesStr
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)

    updateRoom(room.id, {
      number: number.trim(),
      name: name.trim(),
      category,
      buildingId,
      departmentId: departmentId ? departmentId : undefined,
      floor: Number(floor),
      capacity: capacity ? Number(capacity) : undefined,
      description: description.trim() || undefined,
      locationInstructions: locationInstructions.trim() || undefined,
      facilities,
      openTime: openTime || undefined,
      closeTime: closeTime || undefined,
      scheduleVerified,
      isTemporaryClosed,
      temporaryClosureReason: isTemporaryClosed ? temporaryClosureReason : undefined,
      temporaryClosureUntil: isTemporaryClosed ? temporaryClosureUntil : undefined,
    })

    router.push('/admin/rooms')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        <div className="bg-white border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/admin/rooms"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Room List
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Edit Room: {room.name}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-number">Room Number / Identifier *</Label>
                <Input
                  id="room-number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-name">Room Official Name *</Label>
                <Input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-cat">Room Category</Label>
                <select
                  id="room-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RoomCategory)}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.entries(CATEGORY_LABELS) as [RoomCategory, string][]).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-building">Building</Label>
                <select
                  id="room-building"
                  value={buildingId}
                  onChange={(e) => setBuildingId(e.target.value)}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-floor">Floor Number</Label>
                <Input
                  id="room-floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-dept">Department</Label>
                <select
                  id="room-dept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None / Campus-Wide</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-cap">Seating Capacity</Label>
                <Input
                  id="room-cap"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-facilities">Facilities & Amenities (comma separated)</Label>
              <Input
                id="room-facilities"
                value={facilitiesStr}
                onChange={(e) => setFacilitiesStr(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-desc">Description</Label>
              <textarea
                id="room-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm border border-input rounded-lg p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-directions">Directions & Location Guide</Label>
              <Input
                id="room-directions"
                value={locationInstructions}
                onChange={(e) => setLocationInstructions(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="room-open">Opening Time</Label>
                <Input
                  id="room-open"
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-close">Closing Time</Label>
                <Input
                  id="room-close"
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                />
              </div>
            </div>

            {/* Temporary Closure Section */}
            <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="room-closed"
                  type="checkbox"
                  checked={isTemporaryClosed}
                  onChange={(e) => setIsTemporaryClosed(e.target.checked)}
                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
                />
                <Label htmlFor="room-closed" className="cursor-pointer font-bold text-orange-950 text-sm flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  Mark Room Temporarily Closed / Under Maintenance
                </Label>
              </div>

              {isTemporaryClosed && (
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="closure-reason" className="text-xs text-orange-900">Reason for Closure</Label>
                    <Input
                      id="closure-reason"
                      placeholder="e.g. AC repair, paint renovation"
                      value={temporaryClosureReason}
                      onChange={(e) => setTemporaryClosureReason(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="closure-until" className="text-xs text-orange-900">Expected Reopening Date</Label>
                    <Input
                      id="closure-until"
                      type="date"
                      value={temporaryClosureUntil}
                      onChange={(e) => setTemporaryClosureUntil(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="room-verified"
                type="checkbox"
                checked={scheduleVerified}
                onChange={(e) => setScheduleVerified(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring h-4 w-4"
              />
              <Label htmlFor="room-verified" className="cursor-pointer text-sm">
                Schedule verified
              </Label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Button asChild variant="outline">
                <Link href="/admin/rooms">Cancel</Link>
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1.5" />
                Update Room
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
