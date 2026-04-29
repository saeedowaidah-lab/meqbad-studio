'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useProductStore } from '@/store/product-store'
import { exportSallaPackage, exportCampaignPackage } from '@/lib/export'
import {
  Download, Package, Megaphone, Check, FileArchive,
  ImageIcon, FileText, Loader2, ExternalLink,
} from 'lucide-react'

export default function ExportPage() {
  const params = useParams()
  const productId = params.productId as string

  const { products, getProductImages, getProductContent } = useProductStore()
  const product = products.find(p => p.id === productId)
  const images = getProductImages(productId)
  const content = getProductContent(productId)

  const [exporting, setExporting] = useState<'salla' | 'campaign' | null>(null)
  const [progress, setProgress] = useState(0)

  const whiteBgImages   = images.filter(i => i.type === 'white_bg')
  const lifestyleImages = images.filter(i => i.type === 'lifestyle')
  const adImages        = images.filter(i => i.type === 'ad_campaign')
  const hasContent      = !!(content?.ar?.title || content?.en?.title)

  const SALLA_FILES = [
    { label: 'صورة رئيسية 1200×1200', ready: whiteBgImages.length > 0, count: whiteBgImages.length },
    { label: 'صور إضافية 800×800', ready: lifestyleImages.length > 0, count: lifestyleImages.length },
    { label: 'المحتوى العربي', ready: !!content?.ar?.title, count: hasContent ? 1 : 0 },
    { label: 'المحتوى الإنجليزي', ready: !!content?.en?.title, count: content?.en?.title ? 1 : 0 },
    { label: 'الجدول التقني', ready: !!content?.technicalSheet, count: content?.technicalSheet ? 1 : 0 },
    { label: 'دليل الرفع على سلة', ready: true, count: 1 },
  ]

  const CAMPAIGN_FILES = [
    { label: 'إنستقرام (بوست + ستوري)', ready: adImages.some(i => i.platform?.includes('instagram')), count: adImages.filter(i => i.platform?.includes('instagram')).length },
    { label: 'سناب شات', ready: adImages.some(i => i.platform === 'snapchat'), count: 1 },
    { label: 'تويتر/X', ready: adImages.some(i => i.platform === 'twitter'), count: 1 },
    { label: 'فيسبوك', ready: adImages.some(i => i.platform === 'facebook'), count: 1 },
    { label: 'جوجل ديسبلاي', ready: adImages.some(i => i.platform?.includes('google')), count: adImages.filter(i => i.platform?.includes('google')).length },
    { label: 'تيك توك', ready: adImages.some(i => i.platform === 'tiktok'), count: 1 },
    { label: 'نصوص الإعلانات', ready: hasContent, count: hasContent ? 1 : 0 },
  ]

  const doExportSalla = async () => {
    setExporting('salla')
    setProgress(10)
    try {
      const blob = await exportSallaPackage(
        images,
        content ?? { ar: {}, en: {}, technicalSheet: {} as never },
        product?.name ?? 'product'
      )
      setProgress(90)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salla-${product?.name ?? 'product'}-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
      setProgress(100)
      toast.success('تم تصدير حزمة سلة بنجاح ✓')
    } catch (e) {
      toast.error('فشل التصدير: ' + (e instanceof Error ? e.message : 'خطأ'))
    } finally {
      setExporting(null)
      setProgress(0)
    }
  }

  const doExportCampaign = async () => {
    setExporting('campaign')
    setProgress(10)
    try {
      const blob = await exportCampaignPackage(
        images,
        content ?? { ar: {}, en: {}, technicalSheet: {} as never }
      )
      setProgress(90)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaigns-${product?.name ?? 'product'}-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
      setProgress(100)
      toast.success('تم تصدير حزمة الحملات بنجاح ✓')
    } catch (e) {
      toast.error('فشل التصدير: ' + (e instanceof Error ? e.message : 'خطأ'))
    } finally {
      setExporting(null)
      setProgress(0)
    }
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">المنتج غير موجود</div>

  return (
    <div className="flex min-h-screen">
      <Sidebar productId={productId} />
      <div className="flex-1 mr-60">
        <Header title="تصدير المشروع" subtitle="حزّم كل شيء وصدّره جاهزاً" />

        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'خلفية بيضاء', count: whiteBgImages.length, icon: ImageIcon, color: 'text-blue-500' },
                { label: 'واقعية', count: lifestyleImages.length, icon: ImageIcon, color: 'text-purple-500' },
                { label: 'إعلانية', count: adImages.length, icon: Megaphone, color: 'text-orange-500' },
                { label: 'محتوى', count: hasContent ? 2 : 0, icon: FileText, color: 'text-green-500' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${s.color}`} />
                      <div>
                        <div className="text-lg font-bold">{s.count}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Progress bar */}
            {exporting && (
              <Card className="border-studio-gold/30">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>جارٍ إنشاء الملف المضغوط...</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Option A: Salla */}
              <Card className="border-2 hover:border-studio-gold/50 transition-colors">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">تصدير سلة</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">حزمة جاهزة للرفع مباشرة على منصة سلة</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {SALLA_FILES.map(f => (
                      <div key={f.label} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${f.ready ? 'bg-green-500' : 'bg-muted'}`}>
                          {f.ready && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={f.ready ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                        {f.count > 0 && <Badge variant="secondary" className="text-[9px] mr-auto">{f.count}</Badge>}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t text-[10px] text-muted-foreground font-mono space-y-0.5">
                    <div>📁 /salla-ready/main-product-1200x1200.jpg</div>
                    <div>📁 /salla-ready/additional-*.jpg</div>
                    <div>📁 /content/arabic-content.txt</div>
                    <div>📁 /content/english-content.txt</div>
                    <div>📁 README-salla-upload-guide.txt</div>
                  </div>

                  <Button
                    variant="gold"
                    className="w-full"
                    onClick={doExportSalla}
                    disabled={exporting !== null || whiteBgImages.length === 0}
                  >
                    {exporting === 'salla'
                      ? <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      : <Download className="w-4 h-4 ml-2" />
                    }
                    تصدير حزمة سلة
                  </Button>
                  {whiteBgImages.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center">ولّد الصور أولاً من تبويب الصور</p>
                  )}
                </CardContent>
              </Card>

              {/* Option B: Campaigns */}
              <Card className="border-2 hover:border-orange-400/50 transition-colors">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-orange-500/10 rounded-2xl flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">تصدير الحملات</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">8 منصات إعلانية + النصوص التسويقية</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {CAMPAIGN_FILES.map(f => (
                      <div key={f.label} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${f.ready ? 'bg-green-500' : 'bg-muted'}`}>
                          {f.ready && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={f.ready ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                        {f.count > 0 && <Badge variant="secondary" className="text-[9px] mr-auto">{f.count}</Badge>}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t text-[10px] text-muted-foreground font-mono space-y-0.5">
                    <div>📁 /campaigns/instagram/</div>
                    <div>📁 /campaigns/snapchat/</div>
                    <div>📁 /campaigns/facebook/</div>
                    <div>📁 /campaigns/tiktok/</div>
                    <div>📁 /content/ad-copy-*.txt</div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                    onClick={doExportCampaign}
                    disabled={exporting !== null || adImages.length === 0}
                  >
                    {exporting === 'campaign'
                      ? <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      : <FileArchive className="w-4 h-4 ml-2" />
                    }
                    تصدير حزمة الحملات
                  </Button>
                  {adImages.length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center">ولّد الصور الإعلانية أولاً</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
