'use client'
import { Moon, Sun, Globe } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSessionStore } from '@/store/session-store'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useSessionStore()

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          title="تبديل اللغة"
        >
          <Globe className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  )
}
