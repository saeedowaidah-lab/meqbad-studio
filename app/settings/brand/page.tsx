'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBrandStore } from '@/store/brand-store'
import { Save, Palette, Store } from 'lucide-react'

const TONES = [
  { value: 'luxury', label: 'فاخر', desc: 'يخاطب الفئة الراقية بأسلوب رفيع' },
  { value: 'professional', label: 'احترافي', desc: 'موثوق وجدي يبرز الجودة' },
  { value: 'friendly', label: 'ودي', desc: 'دافئ وقريب من العميل' },
  { value: 'technical', label: 'تقني', desc: 'دقيق يهتم بالمواصفات' },
] as const

export default function BrandPage() {
  const { brand, updateBrand } = useBrandStore()
  const [local, setLocal] = useState(brand)

  const save = () => {
    updateBrand(local)
    toast.success('تم حفظ هوية المتجر ✓')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 mr-60">
        <Header title="هوية المتجر" subtitle="تُطبَّق تلقائياً على كل المحتوى المولَّد" />

        <main className="p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Store info */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Store className="w-4 h-4 text-studio-gold" />
                  معلومات المتجر
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">اسم المتجر</label>
                    <input
                      value={local.storeName}
                      onChange={e => setLocal({ ...local, storeName: e.target.value })}
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">رابط متجر سلة</label>
                    <input
                      value={local.sallaStoreUrl}
                      onChange={e => setLocal({ ...local, sallaStoreUrl: e.target.value })}
                      placeholder="https://yourstore.salla.sa"
                      className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-studio-gold" />
                  ألوان المتجر
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">اللون الرئيسي</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={local.primaryColor}
                        onChange={e => setLocal({ ...local, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border cursor-pointer"
                      />
                      <input
                        value={local.primaryColor}
                        onChange={e => setLocal({ ...local, primaryColor: e.target.value })}
                        className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">اللون الثانوي</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={local.secondaryColor}
                        onChange={e => setLocal({ ...local, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border cursor-pointer"
                      />
                      <input
                        value={local.secondaryColor}
                        onChange={e => setLocal({ ...local, secondaryColor: e.target.value })}
                        className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Writing tone */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold">أسلوب الكتابة</h3>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setLocal({ ...local, tone: t.value })}
                      className={`text-right p-4 rounded-xl border transition-all ${
                        local.tone === t.value
                          ? 'border-studio-gold bg-studio-gold/10'
                          : 'border-border hover:border-studio-gold/40'
                      }`}
                    >
                      <div className="font-bold text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="gold" className="w-full h-11" onClick={save}>
              <Save className="w-4 h-4 ml-2" />
              حفظ الإعدادات
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
