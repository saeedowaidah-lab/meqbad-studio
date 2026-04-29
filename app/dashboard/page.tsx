'use client'
import { useRouter } from 'next/navigation'
import { useProductStore } from '@/store/product-store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, generateId } from '@/lib/utils'
import {
  Plus, Upload, Package, ImageIcon, FileText, HardDrive,
  Zap, ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react'

const STATUS_MAP = {
  analyzing:  { label: 'تحليل', color: 'warning',  Icon: Loader2 },
  generating: { label: 'توليد', color: 'gold',     Icon: Zap },
  complete:   { label: 'مكتمل', color: 'success',  Icon: CheckCircle },
  error:      { label: 'خطأ',   color: 'destructive', Icon: AlertCircle },
} as const

export default function DashboardPage() {
  const router = useRouter()
  const { products, images } = useProductStore()

  const today = new Date().toISOString().split('T')[0]
  const todayImages = Object.values(images)
    .flat()
    .filter(img => img.createdAt.startsWith(today)).length
  const totalImages = Object.values(images).flat().length
  const totalContent = 0 // placeholder
  const storageKB = Object.values(images).flat().reduce((s, i) => s + (i.fileSizeKB ?? 0), 0)

  const stats = [
    { label: 'إجمالي المنتجات', value: products.length, icon: Package, color: 'bg-blue-500' },
    { label: 'صور اليوم', value: todayImages, icon: ImageIcon, color: 'bg-purple-500' },
    { label: 'قطع محتوى', value: totalContent, icon: FileText, color: 'bg-green-500' },
    { label: 'التخزين المستخدم', value: `${(storageKB / 1024).toFixed(1)} MB`, icon: HardDrive, color: 'bg-orange-500' },
  ]

  const recent = products.slice(0, 10)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 mr-60">
        <Header
          title="لوحة التحكم"
          subtitle="مرحباً بك في مقبض ستوديو"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/studio/upload')}>
                <Upload className="w-3.5 h-3.5 ml-1.5" />
                رفع دفعة
              </Button>
              <Button variant="gold" size="sm" onClick={() => router.push('/studio/upload')}>
                <Plus className="w-3.5 h-3.5 ml-1.5" />
                منتج جديد
              </Button>
            </div>
          }
        />

        <main className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${s.color} p-2 rounded-xl`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent products */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">آخر المشاريع</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
                عرض الكل
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              </Button>
            </div>

            {recent.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">لا توجد منتجات بعد</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">ارفع أول صورة منتج وابدأ التوليد</p>
                  <Button variant="gold" onClick={() => router.push('/studio/upload')}>
                    <Plus className="w-4 h-4 ml-2" />
                    أضف أول منتج
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recent.map((p) => {
                  const { label, color, Icon } = STATUS_MAP[p.status] ?? STATUS_MAP.complete
                  const imgCount = images[p.id]?.length ?? 0
                  return (
                    <Card
                      key={p.id}
                      className="cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => {
                        useProductStore.getState().setCurrentProduct(p.id)
                        router.push(`/studio/${p.id}/images`)
                      }}
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
                              <Package className="w-10 h-10 text-muted-foreground/40" />
                            </div>
                          )}
                          <Badge variant={color as never} className="absolute top-2 right-2 text-[10px] gap-1">
                            <Icon className="w-2.5 h-2.5" />
                            {label}
                          </Badge>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-sm font-semibold truncate">{p.name || 'منتج غير مسمى'}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              {imgCount} صورة
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
          </div>

          {/* Quick start banner */}
          {products.length === 0 && (
            <Card className="bg-gradient-to-l from-studio-gold/10 to-blue-500/5 border-studio-gold/20">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="w-14 h-14 bg-studio-gold rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base">ابدأ في دقيقة واحدة</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ارفع صورة مقبض → احصل على خلفية بيضاء احترافية + 5 بيئات واقعية + 8 صور إعلانية + محتوى تسويقي كامل
                  </p>
                </div>
                <Button variant="gold" onClick={() => router.push('/studio/upload')}>
                  ابدأ الآن
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
