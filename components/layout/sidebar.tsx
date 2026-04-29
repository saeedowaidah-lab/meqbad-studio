'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Upload, Image, FileText, MessageSquare, Download,
  History, Palette, Settings, ChevronRight, Sparkles,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/studio/upload', icon: Upload, label: 'رفع منتج' },
  { href: '/history', icon: History, label: 'المشاريع' },
  { divider: true, label: 'الإعدادات' },
  { href: '/settings/brand', icon: Palette, label: 'هوية المتجر' },
  { href: '/settings/api-keys', icon: Settings, label: 'مفاتيح API' },
]

export function Sidebar({ productId }: { productId?: string }) {
  const pathname = usePathname()

  const studioNav = productId ? [
    { href: `/studio/${productId}/images`, icon: Image, label: 'الصور' },
    { href: `/studio/${productId}/content`, icon: FileText, label: 'المحتوى' },
    { href: `/studio/${productId}/chat`, icon: MessageSquare, label: 'المحرر الذكي' },
    { href: `/studio/${productId}/export`, icon: Download, label: 'التصدير' },
  ] : []

  return (
    <aside className="fixed right-0 top-0 h-full w-60 bg-studio-dark text-white flex flex-col z-40 border-l border-white/10">
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-studio-gold rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">مقبض ستوديو</div>
            <div className="text-xs text-white/40">AI Studio v1.0</div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {nav.map((item, i) => {
          if ('divider' in item && item.divider) {
            return (
              <div key={i} className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</span>
              </div>
            )
          }
          if (!('href' in item) || !item.href) return null
          const Icon = item.icon!
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-studio-gold text-white shadow-lg shadow-studio-gold/20'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 mr-auto opacity-60" />}
            </Link>
          )
        })}

        {studioNav.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">المنتج الحالي</span>
            </div>
            {studioNav.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-[10px] text-white/25 text-center">مقبض ستوديو © 2025</div>
      </div>
    </aside>
  )
}
