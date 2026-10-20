'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  ArrowLeft,
  Search,
  UserRound,
  DoorOpen,
  Mail,
  Phone,
  Trash2,
  Edit,
  Save,
  CheckCircle2,
  X,
  Crown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FacultyMember } from '@/types'

export default function AdminFacultyPage() {
  const { faculty, rooms, departments, addFacultyMember, updateFacultyMember } = useAppStore()

  const [search, setSearch] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)

  // New faculty form
  const [name, setName] = React.useState('')
  const [title, setTitle] = React.useState('Dr.')
  const [designation, setDesignation] = React.useState('Associate Professor')
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id || '')
  const [officeRoomId, setOfficeRoomId] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [contactPublished, setContactPublished] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const filteredFaculty = faculty.filter((f) => {
    if (!f.isActive) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const room = rooms.find((r) => r.id === f.officeRoomId)
      const dept = departments.find((d) => d.id === f.departmentId)
      const text = `${f.name} ${f.designation} ${room?.number ?? ''} ${dept?.name ?? ''}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please provide a full faculty name.')
      return
    }

    const newMember: FacultyMember = {
      id: `fac-${Date.now()}`,
      name: name.trim(),
      title,
      designation: designation.trim(),
      departmentId: departmentId || undefined,
      officeRoomId: officeRoomId || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      contactPublished,
      isActive: true,
    }

    addFacultyMember(newMember)
    setName('')
    setEmail('')
    setPhone('')
    setShowAdd(false)
  }

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
                <h1 className="text-2xl font-bold text-foreground">Faculty & Office Management</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Assign faculty office rooms, configure designations, and manage official contact directory.
                </p>
              </div>

              <Button onClick={() => setShowAdd(true)} size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Faculty Member
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Add Modal */}
          {showAdd && (
            <div className="bg-white border border-border rounded-xl p-6 shadow-md space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" />
                  Add Faculty Profile
                </h3>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fac-title">Title</Label>
                    <Input
                      id="fac-title"
                      placeholder="Dr. / Prof. / Mr."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="fac-name">Full Name *</Label>
                    <Input
                      id="fac-name"
                      placeholder="e.g. Dr. Ayesha Siddiqua"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fac-desig">Designation</Label>
                    <Input
                      id="fac-desig"
                      placeholder="e.g. Associate Professor, Chairman"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fac-dept">Department</Label>
                    <select
                      id="fac-dept"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">None</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fac-room">Assigned Office Room</Label>
                    <select
                      id="fac-room"
                      value={officeRoomId}
                      onChange={(e) => setOfficeRoomId(e.target.value)}
                      className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">None / Unassigned</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Room {r.number})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="fac-email">Email (Optional)</Label>
                    <Input
                      id="fac-email"
                      type="email"
                      placeholder="name@gfu.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fac-phone">Office Phone (Optional)</Label>
                    <Input
                      id="fac-phone"
                      placeholder="e.g. +880 2 9876543 ext 102"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="fac-pub"
                    type="checkbox"
                    checked={contactPublished}
                    onChange={(e) => setContactPublished(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <Label htmlFor="fac-pub" className="cursor-pointer text-xs">
                    Publish contact info publicly on student-facing directory
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search faculty by name, office room, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Faculty Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Faculty Member</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Office Room</th>
                    <th className="px-5 py-3">Contact Details</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFaculty.map((member) => {
                    const room = rooms.find((r) => r.id === member.officeRoomId)
                    const dept = departments.find((d) => d.id === member.departmentId)

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {member.name}
                            {(member.designation.includes('Chairman') || member.designation.includes('Dean')) && (
                              <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.designation}</div>
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-foreground">
                          {dept?.name ?? '—'}
                        </td>

                        <td className="px-5 py-4">
                          {room ? (
                            <Link
                              href={`/rooms/${room.id}`}
                              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                            >
                              <DoorOpen className="h-3.5 w-3.5" />
                              {room.name} (Rm {room.number})
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-muted-foreground space-y-0.5">
                          {member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          )}
                          {!member.contactPublished && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              Unpublished
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 h-8"
                            onClick={() => {
                              if (confirm(`Remove faculty profile "${member.name}"?`)) {
                                updateFacultyMember(member.id, { isActive: false })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
