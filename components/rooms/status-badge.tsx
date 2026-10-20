import * as React from 'react'
import {
  CheckCircle2,
  Users,
  Clock,
  Ban,
  Wrench,
  HelpCircle,
} from 'lucide-react'
import { cn, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import type { RoomStatus } from '@/types'

const STATUS_ICONS: Record<RoomStatus, React.ComponentType<{ className?: string }>> = {
  available: CheckCircle2,
  occupied: Users,
  upcoming: Clock,
  closed: Ban,
  maintenance: Wrench,
  unknown: HelpCircle,
}

interface StatusBadgeProps {
  status: RoomStatus
  className?: string
  showIcon?: boolean
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const Icon = STATUS_ICONS[status] || HelpCircle
  const label = STATUS_LABELS[status] || 'Unknown'
  const colorClass = STATUS_COLORS[status] || 'status-unknown'

  return (
    <span
      className={cn(
        'status-badge font-medium tracking-tight',
        colorClass,
        className
      )}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  )
}
