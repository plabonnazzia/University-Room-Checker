'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Building2, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORY_LABELS } from '@/lib/utils'
import type { Room, RoomCategory } from '@/types'

export default function NewRoomPage() {
  const router = useRouter()
  const { buildings, departments, addRoom, settings } = useAppStore()

  const [number, setNumber] = React.useState('')
  const [name, setName] = React.useState('')
  const [category, setCategory] = React.useState<RoomCategory>('classroom')
  const [buildingId, setBuildingId] = React.useState(buildings[0]?.id || '')
  const [departmentId, setDepartmentId] = React.useState('')
  const [floor, setFloor] = React.useState(1)
  const [capacity, setCapacity] = React.useState<number | ''>('')
  const [description, setDescription] = React.useState('')
  const [locationInstructions, setLocationInstructions] = React.useState('')
  const [facilitiesStr, setFacilitiesStr] = React.useState('Projector, AC, Whiteboard, WiFi')
  const [openTime, setOpenTime] = React.useState(settings.defaultOpenTime)
  const [closeTime, setCloseTime] = React.useState(settings.defaultCloseTime)
  const [scheduleVerified, setScheduleVerified] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

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

    const newRoom: Room = {
      id: `room-${Date.now()}`,
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
      isActive: true,
      isTemporaryClosed: false,
      scheduleVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addRoom(newRoom)
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
            <h1 className="text-2xl font-bold text-foreground">Add New Campus Room</h1>
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
                  placeholder="e.g. 302, B-105, ADM-201"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room-name">Room Official Name *</Label>
                <Input
                  id="room-name"
                  placeholder="e.g. Classroom 302, Digital Media Lab"
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
                  min={1}
                  max={20}
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room-dept">Department (Optional)</Label>
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
                  placeholder="e.g. 50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-facilities">Facilities & Amenities (comma separated)</Label>
              <Input
                id="room-facilities"
                placeholder="Projector, Whiteboard, AC, WiFi, Audio System"
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
                placeholder="Brief description of the room purpose, special equipment, or layout."
                className="w-full text-sm border border-input rounded-lg p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="room-directions">Directions & Location Guide</Label>
              <Input
                id="room-directions"
                placeholder="e.g. Near the west stairs, opposite the department office"
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

            <div className="flex items-center gap-2 pt-2">
              <input
                id="room-verified"
                type="checkbox"
                checked={scheduleVerified}
                onChange={(e) => setScheduleVerified(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring h-4 w-4"
              />
              <Label htmlFor="room-verified" className="cursor-pointer text-sm">
                Schedule verified (if unchecked, availability will display as &quot;Availability unverified&quot;)
              </Label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
              <Button asChild variant="outline">
                <Link href="/admin/rooms">Cancel</Link>
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-1.5" />
                Save New Room
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
