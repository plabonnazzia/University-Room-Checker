'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin'
}

export function ProtectedRoute({ children, requiredRole = 'admin' }: ProtectedRouteProps) {
  const router = useRouter()
  const currentUser = useAppStore((s) => s.currentUser)
  const isDemo = useAppStore((s) => s.isDemo)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Administrator Access Required
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This administrative area is restricted to authorized university administrators. Please sign in with administrator credentials.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign In to Admin
              </Link>
            </Button>
          </div>

          {isDemo && (
            <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground bg-secondary/40 p-3 rounded-lg">
              <span className="font-semibold text-foreground">Demo Admin Credentials:</span>
              <br />
              Email: <code className="text-primary font-mono font-medium">admin@gfu.edu</code>
              <br />
              Password: <code className="text-primary font-mono font-medium">admin123</code>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
