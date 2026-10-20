'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Download,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { toCSV, parseCSVRow } from '@/lib/utils'
import type { Room, RoomCategory, RoomSchedule, DayOfWeek } from '@/types'

export default function ImportExportPage() {
  const { rooms, schedules, buildings, addRoom, addSchedule } = useAppStore()

  const [importType, setImportType] = React.useState<'rooms' | 'schedules'>('rooms')
  const [csvText, setCsvText] = React.useState('')
  const [importResult, setImportResult] = React.useState<{
    successCount: number
    errors: Array<{ row: number; reason: string }>
  } | null>(null)

  // CSV Export Handler
  const handleExportRooms = () => {
    const headers = ['Number', 'Name', 'Category', 'BuildingId', 'Floor', 'Capacity', 'Facilities', 'Verified']
    const rows = rooms.map((r) => [
      r.number,
      r.name,
      r.category,
      r.buildingId,
      String(r.floor),
      r.capacity ? String(r.capacity) : '',
      r.facilities.join(';'),
      r.scheduleVerified ? 'true' : 'false',
    ])
    const csv = toCSV(headers, rows)
    downloadFile(csv, `university_rooms_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleExportSchedules = () => {
    const headers = ['RoomId', 'Title', 'DayOfWeek', 'StartTime', 'EndTime', 'Instructor', 'BufferMinutes']
    const rows = schedules.map((s) => [
      s.roomId,
      s.title,
      s.dayOfWeek,
      s.startTime,
      s.endTime,
      s.instructorName ?? '',
      String(s.bufferAfterMinutes),
    ])
    const csv = toCSV(headers, rows)
    downloadFile(csv, `university_schedules_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // CSV Import Validation & Processing
  const handleImport = () => {
    setImportResult(null)
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) {
      alert('CSV must contain a header row and at least one data row.')
      return
    }

    const errors: Array<{ row: number; reason: string }> = []
    let successCount = 0

    if (importType === 'rooms') {
      const validCategories: RoomCategory[] = [
        'classroom',
        'faculty_office',
        'chairman_office',
        'dean_office',
        'department_office',
        'admin_office',
        'library',
        'computer_lab',
        'science_lab',
        'seminar_room',
        'conference_room',
        'examination_room',
        'prayer_room',
        'common_room',
        'meeting_room',
        'storage',
        'other',
      ]

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i])
        const rowNum = i + 1

        if (cols.length < 4) {
          errors.push({ row: rowNum, reason: 'Insufficient columns. Expected at least: Number, Name, Category, BuildingId' })
          continue
        }

        const [num, name, cat, bId, floorStr, capStr, facStr] = cols

        if (!num) {
          errors.push({ row: rowNum, reason: 'Missing Room Number' })
          continue
        }
        if (!name) {
          errors.push({ row: rowNum, reason: 'Missing Room Name' })
          continue
        }
        if (!validCategories.includes(cat.toLowerCase() as RoomCategory)) {
          errors.push({ row: rowNum, reason: `Invalid Category "${cat}". Must be one of: ${validCategories.slice(0, 5).join(', ')}...` })
          continue
        }

        const validBuilding = buildings.find((b) => b.id === bId || b.name.toLowerCase() === bId.toLowerCase())
        const targetBuildingId = validBuilding ? validBuilding.id : buildings[0]?.id || 'b1'

        const newRoom: Room = {
          id: `room-${Date.now()}-${i}`,
          number: num,
          name: name,
          category: cat.toLowerCase() as RoomCategory,
          buildingId: targetBuildingId,
          floor: Number(floorStr) || 1,
          capacity: Number(capStr) || undefined,
          facilities: facStr ? facStr.split(';').map((s) => s.trim()) : ['AC', 'WiFi'],
          isActive: true,
          isTemporaryClosed: false,
          scheduleVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addRoom(newRoom)
        successCount++
      }
    } else {
      // Import schedules
      const validDays: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i])
        const rowNum = i + 1

        if (cols.length < 5) {
          errors.push({ row: rowNum, reason: 'Insufficient columns. Expected: RoomId, Title, DayOfWeek, StartTime, EndTime' })
          continue
        }

        const [rId, title, day, start, end, instructor, bufStr] = cols

        if (!rooms.some((r) => r.id === rId || r.number === rId)) {
          errors.push({ row: rowNum, reason: `Referenced RoomId "${rId}" does not exist in database.` })
          continue
        }
        if (!title) {
          errors.push({ row: rowNum, reason: 'Missing Schedule Title' })
          continue
        }
        if (!validDays.includes(day.toLowerCase() as DayOfWeek)) {
          errors.push({ row: rowNum, reason: `Invalid Day "${day}". Must be sunday-thursday.` })
          continue
        }
        if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
          errors.push({ row: rowNum, reason: `Invalid time format "${start}-${end}". Expected HH:mm.` })
          continue
        }

        const matchedRoom = rooms.find((r) => r.id === rId || r.number === rId)!

        const newSchedule: RoomSchedule = {
          id: `sch-${Date.now()}-${i}`,
          roomId: matchedRoom.id,
          title,
          dayOfWeek: day.toLowerCase() as DayOfWeek,
          startTime: start,
          endTime: end,
          instructorName: instructor || undefined,
          bufferAfterMinutes: Number(bufStr) || 0,
          isRecurring: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addSchedule(newSchedule)
        successCount++
      }
    }

    setImportResult({ successCount, errors })
  }

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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              CSV Data Import & Export
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bulk download existing records or validate and import university spreadsheets.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Export Section */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-foreground mb-1 flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Export Campus Data
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Download clean CSV spreadsheets compatible with Excel, Google Sheets, or university SIS systems.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Room Directory CSV</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{rooms.length} room records</p>
                </div>
                <Button onClick={handleExportRooms} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download CSV
                </Button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Schedule Timetable CSV</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{schedules.length} booking records</p>
                </div>
                <Button onClick={handleExportSchedules} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Import & Validate CSV Records
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste CSV text below. Rows are rigorously validated before commit; any invalid rows will be reported with exact line numbers and reasons.
            </p>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  checked={importType === 'rooms'}
                  onChange={() => setImportType('rooms')}
                />
                Import Rooms
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="importType"
                  checked={importType === 'schedules'}
                  onChange={() => setImportType('schedules')}
                />
                Import Schedules
              </label>
            </div>

            <div className="text-[11px] text-muted-foreground bg-secondary/40 p-2.5 rounded font-mono">
              {importType === 'rooms'
                ? 'Header: Number,Name,Category,BuildingId,Floor,Capacity,Facilities'
                : 'Header: RoomId,Title,DayOfWeek,StartTime,EndTime,Instructor,BufferMinutes'}
            </div>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste raw CSV data including header row here..."
              className="w-full text-xs font-mono border border-input rounded-lg p-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <Button onClick={handleImport} size="sm" disabled={!csvText.trim()}>
              <Upload className="h-4 w-4 mr-1.5" />
              Validate & Import Records
            </Button>

            {/* Import Results Feedback */}
            {importResult && (
              <div className="mt-4 space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Successfully imported {importResult.successCount} valid record(s).</span>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>{importResult.errors.length} row(s) had errors and were rejected:</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1 max-h-48 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>
                          <strong>Row {err.row}:</strong> {err.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
