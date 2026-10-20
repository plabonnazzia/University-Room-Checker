'use client'

import * as React from 'react'
import Link from 'next/link'
import { History, ArrowLeft, Shield, User, Clock, Search, FileText } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/admin/protected-route'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

export default function AuditTrailPage() {
  const { auditLog } = useAppStore()
  const [search, setSearch] = React.useState('')

  const filteredLogs = auditLog.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const text = `${log.action} ${log.entityType} ${log.entityName} ${log.userEmail}`.toLowerCase()
      if (!text.includes(q)) return false
    }
    return true
  })

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
              <History className="h-6 w-6 text-primary" />
              Administrative Audit Log & History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Immutable record of administrative creations, room modifications, and schedule updates.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search audit trail by administrator email, action, or target room/entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No audit entries found matching query.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          log.action === 'create'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.action === 'update'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {log.action}
                        </span>
                        <span className="font-semibold text-sm text-foreground">
                          {log.entityName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({log.entityType})
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {log.userEmail}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">ID: {log.entityId}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono shrink-0 flex items-center gap-1 text-right">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-border bg-slate-50 text-xs text-muted-foreground">
              Total {filteredLogs.length} audit entry record(s) recorded
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
