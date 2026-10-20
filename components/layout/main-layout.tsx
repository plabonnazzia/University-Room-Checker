import * as React from 'react'
import { Navbar } from '@/components/layout/navbar'
import { useAppStore } from '@/lib/store'

// This is a server-compatible wrapper — the Navbar itself is client
// We keep this layout component as a simple structural wrapper.

interface MainLayoutProps {
  children: React.ReactNode
}

function FooterContent() {
  // Use a client component pattern for store access
  return null
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">University Room Checker</span>
            <span>·</span>
            <span>Campus Resource Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Demo Data — Not real schedules
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
