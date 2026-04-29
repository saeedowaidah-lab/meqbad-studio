'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface GenerationTimerProps {
  running: boolean
  durationSeconds?: number
  onComplete?: () => void
  className?: string
}

export function GenerationTimer({ running, durationSeconds = 120, onComplete, className }: GenerationTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)

  useEffect(() => {
    if (!running) { setRemaining(durationSeconds); return }
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onComplete?.(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, durationSeconds, onComplete])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const fraction = remaining / durationSeconds
  const circumference = 2 * Math.PI * 45

  if (!running) return null

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold font-mono tabular-nums">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground animate-pulse">جارٍ التوليد...</p>
    </div>
  )
}
