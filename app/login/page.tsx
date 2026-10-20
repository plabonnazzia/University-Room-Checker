'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_ADMIN_USER, DEMO_STUDENT_USER } from '@/lib/demo-data'

export default function LoginPage() {
  const router = useRouter()
  const { login, currentUser, settings, isDemo } = useAppStore()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }, [currentUser, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = login(email.trim(), password)
    setLoading(false)

    if (res.success) {
      if (email.includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.')
    }
  }

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError(null)
    const res = login(demoEmail, demoPass)
    if (res.success) {
      if (demoEmail.includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[hsl(var(--university-surface))]">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Access {settings.name} Campus Services
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">University Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@gfu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Demo Logins */}
          {isDemo && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Demo Accounts (One-Click)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1.5 text-xs h-9 bg-slate-50 hover:bg-slate-100 border-slate-200"
                  onClick={() => handleQuickLogin(DEMO_ADMIN_USER.email, DEMO_ADMIN_USER.password)}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Admin Portal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1.5 text-xs h-9 bg-slate-50 hover:bg-slate-100 border-slate-200"
                  onClick={() => handleQuickLogin(DEMO_STUDENT_USER.email, DEMO_STUDENT_USER.password)}
                >
                  <GraduationCap className="h-3.5 w-3.5 text-teal-600" />
                  Student Demo
                </Button>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground text-center">
                Use <span className="font-mono text-foreground font-medium">{DEMO_ADMIN_USER.email}</span> / <span className="font-mono text-foreground font-medium">{DEMO_ADMIN_USER.password}</span> for full administrator permissions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
