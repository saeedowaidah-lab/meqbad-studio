import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function qualityColor(score: number): string {
  if (score >= 8) return 'text-green-500'
  if (score >= 6) return 'text-yellow-500'
  return 'text-red-500'
}

export function qualityBadgeClass(score: number): string {
  if (score >= 8) return 'quality-high'
  if (score >= 6) return 'quality-mid'
  return 'quality-low'
}
