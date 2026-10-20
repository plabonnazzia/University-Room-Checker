'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Settings,
  ArrowLeft,
  Save,
  CheckCircle2,
  Building2,
  Clock,
  Globe,
  HelpCircle,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useAppStore()

  const [name, setName] = React.useState(settings.name)
  const [shortName, setShortName] = React.useState(settings.shortName)
  const [timezone, setTimezone] = React.useState(settings.timezone)
  const [defaultOpen, setDefaultOpen] = React.useState(settings.defaultOpenTime)
  const [defaultClose, setDefaultClose] = React.useState(settings.defaultCloseTime)
  const [bufferMinutes, setBufferMinutes] = React.useState(settings.upcomingBufferMinutes)
  const [isDemo, setIsDemo] = React.useState(settings.isDemo)
  const [saved, setSaved] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings({
      name: name.trim(),
      shortName: shortName.trim(),
      timezone: timezone.trim(),
      defaultOpenTime: defaultOpen,
      defaultCloseTime: defaultClose,
      upcomingBufferMinutes: Number(bufferMinutes),
      isDemo,
      updatedAt: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--university-surface))]">
        <div className="bg-white border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Admin Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              University & System Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure institution branding, operational hours, default schedule buffers, and availability logic parameters.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {saved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>University settings updated successfully! Changes reflect globally in real time.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-foreground border-b border-border pb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Branding & Identity
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="uni-name">University Official Name</Label>
                <Input
                  id="uni-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uni-short">Short Name / Acronym</Label>
                <Input
                  id="uni-short"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 className="font-bold text-base text-foreground border-b border-border pb-3 pt-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Operating Hours & Timezone
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="uni-open">Default Campus Open Time</Label>
                <Input
                  id="uni-open"
                  type="time"
                  value={defaultOpen}
                  onChange={(e) => setDefaultOpen(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uni-close">Default Campus Close Time</Label>
                <Input
                  id="uni-close"
                  type="time"
                  value={defaultClose}
                  onChange={(e) => setDefaultClose(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uni-tz">Timezone Identifier</Label>
                <Input
                  id="uni-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 className="font-bold text-base text-foreground border-b border-border pb-3 pt-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Availability Engine Parameters
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="uni-buf">Upcoming Class Window (Minutes)</Label>
                <Input
                  id="uni-buf"
                  type="number"
                  min={5}
                  max={60}
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  If an activity starts within this buffer time, status turns amber &quot;Class Soon&quot;.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="block mb-2">Campus Working Days</Label>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg border border-border">
                  Default schedule cycle: <strong>Sunday, Monday, Tuesday, Wednesday, Thursday</strong>.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                id="is-demo"
                type="checkbox"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <Label htmlFor="is-demo" className="cursor-pointer text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Enable Demo Mode Banner (Indicates fictional university data to visitors)
              </Label>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">
                <Save className="h-4 w-4 mr-1.5" />
                Save Settings
              </Button>
            </div>
          </form>

          {/* Explanation of availability logic */}
          <div className="bg-white border border-border rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Deterministic Availability Logic Documentation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Room availability is calculated mathematically by the deterministic rule engine without fake random states or static labels:
            </p>

            <ol className="list-decimal list-inside text-xs text-foreground/80 space-y-2 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
              <li>
                <strong>Maintenance & Inactivity:</strong> If a room is marked inactive or has an active temporary closure exception, status is set to <span className="font-semibold text-orange-700">Maintenance / Closed</span>.
              </li>
              <li>
                <strong>Unverified Data:</strong> If <code className="font-mono text-primary">scheduleVerified: false</code>, the room is labeled <span className="font-semibold text-gray-700">Availability Unverified</span>. It will never show as &quot;Available&quot; simply due to missing entries.
              </li>
              <li>
                <strong>Operating Hours:</strong> Outside the room&apos;s configured open and close hours (default {settings.defaultOpenTime} to {settings.defaultCloseTime}), status is <span className="font-semibold text-slate-700">Closed</span>.
              </li>
              <li>
                <strong>Active Bookings:</strong> If local university time falls within [start, end) of a valid booking or one-time reservation, status is <span className="font-semibold text-red-700">Occupied</span> with its title and ending time displayed.
              </li>
              <li>
                <strong>Upcoming Warning:</strong> If a booking begins within <code className="font-mono text-primary">{settings.upcomingBufferMinutes} minutes</code>, status switches to <span className="font-semibold text-amber-700">Class Soon</span>.
              </li>
              <li>
                <strong>Free Window:</strong> If room is open and no active booking or conflicting exception covers the slot, status is <span className="font-semibold text-emerald-700">Available</span>. Next available schedule is dynamically calculated from verified timetable data.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
