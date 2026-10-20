'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  DoorOpen,
  Users,
  Building2,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  X,
  Clock,
  FlaskConical,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/rooms', label: 'Room Checker', icon: DoorOpen },
  { href: '/faculty', label: 'Faculty', icon: Users },
  { href: '/facilities', label: 'Facilities', icon: Building2 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
]

export function Navbar() {
  const pathname = usePathname()
  const settings = useAppStore((s) => s.settings)
  const currentUser = useAppStore((s) => s.currentUser)
  const isDemo = useAppStore((s) => s.isDemo)
  const currentTime = useAppStore((s) => s.currentTime)
  const logout = useAppStore((s) => s.logout)

  const [mobileOpen, setMobileOpen] = React.useState(false)

  const isAdmin =
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin'

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )

  const timeString = React.useMemo(() => {
    const d = currentTime instanceof Date ? currentTime : new Date(currentTime)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }, [currentTime])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground shadow-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <FlaskConical className="h-6 w-6 text-teal-300" />
          <span className="hidden sm:block">{settings.name}</span>
          <span className="sm:hidden">{settings.shortName}</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Demo badge */}
          {isDemo && (
            <Badge
              variant="secondary"
              className="hidden sm:flex bg-amber-400/20 text-amber-200 border-amber-400/30 text-xs"
            >
              Demo
            </Badge>
          )}

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-primary-foreground/70 font-mono">
            <Clock className="h-3.5 w-3.5" />
            {timeString}
          </div>

          {/* Auth button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:block text-xs text-primary-foreground/70">
                {currentUser.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-primary-foreground/80 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground/80 hover:text-white hover:bg-white/10"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Login</span>
              </Link>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground/80 hover:text-white hover:bg-white/10"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary px-4 py-3 space-y-1 animate-fade-in">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-primary-foreground/50 font-mono border-t border-white/10 mt-2 pt-2">
            <Clock className="h-3.5 w-3.5" />
            {timeString}
            {isDemo && (
              <Badge className="ml-auto bg-amber-400/20 text-amber-200 border-amber-400/30 text-xs">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
