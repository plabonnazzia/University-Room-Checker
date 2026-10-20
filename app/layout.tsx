import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster, ToastProvider } from '@/components/ui/toaster'
import { StoreProvider } from '@/components/providers/store-provider'
import { MainLayout } from '@/components/layout/main-layout'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | University Room Checker',
    default: 'University Room Checker',
  },
  description:
    'Find classroom availability, faculty offices, and campus facilities across the university campus.',
  keywords: ['university', 'room', 'classroom', 'schedule', 'faculty', 'campus'],
  authors: [{ name: 'Greenfield University' }],
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e1f6b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <StoreProvider>
          <ToastProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster />
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
