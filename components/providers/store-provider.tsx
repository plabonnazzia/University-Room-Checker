'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const setCurrentTime = useAppStore((s) => s.setCurrentTime)

  useEffect(() => {
    // Update current time every minute
    setCurrentTime(new Date())
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [setCurrentTime])

  return <>{children}</>
}
