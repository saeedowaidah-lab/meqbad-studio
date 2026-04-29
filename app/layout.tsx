import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'مقبض ستوديو — Studio',
  description: 'استوديو AI احترافي لتوليد صور وتسويق مقابض الأبواب',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'مقبض ستوديو' },
}

export const viewport: Viewport = {
  themeColor: '#1E293B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-arabic antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: 'IBM Plex Sans Arabic, sans-serif', direction: 'rtl' },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
