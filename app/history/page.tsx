'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProductStore } from '@/store/product-store'
import { formatDate } from '@/lib/utils'
import {
  Search, Filter, Trash2, Package, ImageIcon, Clock,
  SortDesc, CheckCircle, Loader2, AlertCircle, Zap,
} from 'lucide-react'

const STATUS_CONFIG = {
  analyzing:  { label: 'تحليل',  variant: 'warning' as const,     Icon: Loader2 },
  generating: { label: 'توليد',  variant: 'gold' as const,        Icon: Zap },
  complete:   { label: 'مكتمل', variant: 'success' as const,      Icon: CheckCircle },
  error:      { label: 'خطأ',   variant: 'destructive' as const,  Icon: AlertCircle },
}

type SortKey = 'newest' | 'oldest' | 'most_images'

export default function HistoryPage() {
  const router = useRouter()
  const { products, deleteProduct, images, setCurrentProduct } = useProductStore()

  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const materials = [...new Set(products.map(p => p.material).filter(Boolean))]

  const filtered = products
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterMaterial && p.material !== filterMaterial) return false
      if (filterStatus && p.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return (images[b.id]?.length ?? 0) - (images[a.id]?.length ?? 0)
    })

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const bulkDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    selected.forEach(id => deleteProduct(id))
    setSelected(new Set())
    setConfirmDelete(false)
  }

  const openProduct = (id: string) => {
    setCurrentProduct(id)
    router.push(`/studio/${id}/images`)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 mr-60">
        <Header
          title="سجل المشاريع"
          subtitle={`${products.length} منتج`}
          actions={
            selected.size > 0 ? (
              <Button
                variant="destructive" size="sm"
                onClick={bulkDelete}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1.5" />
                {confirmDelete ? `تأكيد حذف ${selected.size}` : `حذف ${selected.size} محدد`}
              </Button>
            ) : undefined
          }
        />

        <main className="p-6 space-y-5">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث باسم المنتج..."
                className="w-full pr-9 pl-4 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              value={filterMaterial}
              onChange={e => setFilterMaterial(e.target.value)}
              className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">كل المواد</option>
              {materials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">كل الحالات</option>
              <option value="complete">مكتمل</option>
              <option value="generating">جارٍ التوليد</option>
              <option value="analyzing">تحليل</option>
              <option value="error">خطأ</option>
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="text-sm bg-card border border-border rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="most_images">أكثر صوراً</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="font-medium">لا توجد منتجات</p>
              <p className="text-sm mt-1">ابدأ برفع أول صورة منتج</p>
              <Button variant="gold" className="mt-5" onClick={() => router.push('/studio/upload')}>
                رفع منتج جديد
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(p => {
                const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.complete
                const imgCount = images[p.id]?.length ?? 0
                const isSelected = selected.has(p.id)

                return (
                  <Card
                    key={p.id}
                    className={`cursor-pointer transition-all hover:shadow-md group ${isSelected ? 'ring-2 ring-studio-gold' : ''}`}
                    onClick={() => openProduct(p.id)}
                  >
                    <CardContent className="p-0">
                      {/* Thumbnail */}
                      <div className="aspect-square bg-muted rounded-t-2xl overflow-hidden relative">
                        {p.originalImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.originalImageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Select checkbox */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleSelect(p.id) }}
                          className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 transition-all ${
                            isSelected ? 'bg-studio-gold border-studio-gold' : 'border-white/60 bg-black/20 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected && <span className="text-[8px] text-white font-bold flex items-center justify-center w-full h-full">✓</span>}
                        </button>
                        <Badge variant={cfg.variant as never} className="absolute top-2 right-2 text-[10px] gap-1">
                          <cfg.Icon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate">{p.name || '—'}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {imgCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
