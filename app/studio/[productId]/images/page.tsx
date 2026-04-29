'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ImageCard } from '@/components/image-studio/image-card'
import { GenerationTimer } from '@/components/image-studio/generation-timer'
import { GenerationSteps, DEFAULT_STEPS } from '@/components/image-studio/generation-steps'
import { useProductStore } from '@/store/product-store'
import { LIFESTYLE_ENVIRONMENTS, AD_SPECS } from '@/lib/salla-specs'
import { generateId } from '@/lib/utils'
import type { ProductImage, GenerationStep } from '@/types/image'
import {
  Sparkles, ImageIcon, Camera, Megaphone, BookOpen,
  Loader2, RefreshCw, Play,
} from 'lucide-react'

type TabKey = 'white_bg' | 'lifestyle' | 'ad_campaign' | 'catalog'

export default function ImagesPage() {
  const params = useParams()
  const productId = params.productId as string

  const { getProductImages, addImage, deleteImage, updateProduct, products } = useProductStore()
  const product = products.find(p => p.id === productId)
  const images = getProductImages(productId)

  const [activeTab, setActiveTab] = useState<TabKey>('white_bg')
  const [generating, setGenerating] = useState(false)
  const [steps, setSteps] = useState<GenerationStep[]>(DEFAULT_STEPS.map(s => ({ ...s })))
  const [genProgress, setGenProgress] = useState(0)
  const [customEnv, setCustomEnv] = useState('')
  const [selectedEnvs, setSelectedEnvs] = useState<Set<string>>(new Set(['luxury_wood', 'modern_glass']))
  const [adProgress, setAdProgress] = useState({ current: 0, total: 0 })

  const setStep = (idx: number, status: GenerationStep['status']) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status } : s))
  }

  const resetSteps = () => setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'pending' })))

  const callGenerate = async (type: TabKey, extra: Record<string, string> = {}): Promise<ProductImage | null> => {
    if (!product?.geminiAnalysis) return null
    try {
      resetSteps()
      setGenerating(true)
      setGenProgress(0)

      setStep(0, 'done')
      setGenProgress(20)
      setStep(1, 'active')
      await new Promise(r => setTimeout(r, 500))
      setStep(1, 'done')
      setStep(2, 'active')
      setGenProgress(40)

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          analysis: product.geminiAnalysis,
          productId,
          originalImageBase64: product.originalImageUrl?.replace(/^data:image\/\w+;base64,/, ''),
          ...extra,
        }),
      })

      setStep(2, 'done')
      setStep(3, 'active')
      setGenProgress(80)

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      setStep(3, 'done')
      setStep(4, 'active')
      setGenProgress(95)

      const img: ProductImage = {
        id: generateId(),
        productId,
        type,
        platform: extra.platform as never,
        environment: extra.environment,
        url: data.imageBase64 ? `data:image/jpeg;base64,${data.imageBase64}` : data.url,
        storagePath: data.url ?? '',
        dimensions: data.dimensions,
        fileSizeKB: data.sizeKB,
        qualityScore: data.qualityScore ?? 8,
        qualityIssues: data.qualityIssues ?? [],
        createdAt: new Date().toISOString(),
      }

      addImage(productId, img)
      updateProduct(productId, { imagesCount: images.length + 1 })
      setStep(4, 'done')
      setGenProgress(100)
      return img
    } catch (e) {
      toast.error('فشل التوليد: ' + (e instanceof Error ? e.message : 'خطأ'))
      setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s))
      return null
    } finally {
      setGenerating(false)
    }
  }

  const generateWhiteBg = async () => {
    const results = await Promise.all([
      callGenerate('white_bg'),
      callGenerate('white_bg'),
      callGenerate('white_bg'),
    ])
    const count = results.filter(Boolean).length
    if (count) toast.success(`تم توليد ${count} صور خلفية بيضاء ✓`)
  }

  const generateLifestyle = async (envId: string, prompt: string) => {
    const result = await callGenerate('lifestyle', { environment: prompt })
    if (result) toast.success(`تم توليد صورة ${envId} ✓`)
  }

  const generateAllLifestyle = async () => {
    for (const envId of Array.from(selectedEnvs)) {
      const env = LIFESTYLE_ENVIRONMENTS.find(e => e.id === envId)
      if (env) await callGenerate('lifestyle', { environment: env.prompt })
    }
    toast.success('تم توليد جميع البيئات الواقعية')
  }

  const generateAdCampaign = async () => {
    setAdProgress({ current: 0, total: AD_SPECS.length })
    for (let i = 0; i < AD_SPECS.length; i++) {
      const spec = AD_SPECS[i]
      setAdProgress({ current: i + 1, total: AD_SPECS.length })
      await callGenerate('ad_campaign', { platform: spec.platform })
    }
    toast.success('تم توليد جميع الصور الإعلانية ✓')
    setAdProgress({ current: 0, total: 0 })
  }

  const generateCatalog = async () => {
    const result = await callGenerate('catalog')
    if (result) toast.success('تم توليد الكتالوج ✓')
  }

  const whiteBgImages  = images.filter(i => i.type === 'white_bg')
  const lifestyleImages = images.filter(i => i.type === 'lifestyle')
  const adImages        = images.filter(i => i.type === 'ad_campaign')
  const catalogImages   = images.filter(i => i.type === 'catalog')

  if (!product) return <div className="p-8 text-center text-muted-foreground">المنتج غير موجود</div>

  return (
    <div className="flex min-h-screen">
      <Sidebar productId={productId} />
      <div className="flex-1 mr-60">
        <Header
          title={product.name || 'استوديو الصور'}
          subtitle={`${product.material} · ${product.style}`}
        />
        <main className="p-6">
          <div className="grid grid-cols-[1fr_280px] gap-6 items-start">
            {/* Main content */}
            <div>
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabKey)}>
                <TabsList className="mb-5 w-full">
                  <TabsTrigger value="white_bg" className="flex-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    الخلفية البيضاء
                    {whiteBgImages.length > 0 && <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 ml-1">{whiteBgImages.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="lifestyle" className="flex-1">
                    <Camera className="w-3.5 h-3.5" />
                    واقعية
                    {lifestyleImages.length > 0 && <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 ml-1">{lifestyleImages.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="ad_campaign" className="flex-1">
                    <Megaphone className="w-3.5 h-3.5" />
                    الحملات
                    {adImages.length > 0 && <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 ml-1">{adImages.length}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="catalog" className="flex-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    كتالوج
                  </TabsTrigger>
                </TabsList>

                {/* White Background */}
                <TabsContent value="white_bg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">3 تنويعات بخلفية بيضاء نقية — مواصفات سلة 1200×1200</p>
                      <Button variant="gold" size="sm" onClick={generateWhiteBg} disabled={generating}>
                        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1.5" /> : <Sparkles className="w-3.5 h-3.5 ml-1.5" />}
                        توليد 3 تنويعات
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {whiteBgImages.map(img => (
                        <ImageCard key={img.id} image={img} onDelete={id => deleteImage(productId, id)} />
                      ))}
                      {whiteBgImages.length === 0 && !generating && (
                        <div className="col-span-3 py-16 text-center text-muted-foreground">
                          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">اضغط "توليد 3 تنويعات" لبدء التوليد</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Lifestyle */}
                <TabsContent value="lifestyle">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">اختر البيئات واضغط توليد</p>
                      <Button variant="gold" size="sm" onClick={generateAllLifestyle} disabled={generating}>
                        <Play className="w-3.5 h-3.5 ml-1.5" />
                        توليد المحددة
                      </Button>
                    </div>

                    {/* Environment selector */}
                    <div className="grid grid-cols-2 gap-2">
                      {LIFESTYLE_ENVIRONMENTS.map(env => (
                        <button
                          key={env.id}
                          onClick={() => {
                            const next = new Set(selectedEnvs)
                            next.has(env.id) ? next.delete(env.id) : next.add(env.id)
                            setSelectedEnvs(next)
                          }}
                          className={`text-right p-3 rounded-xl border text-sm transition-all ${
                            selectedEnvs.has(env.id)
                              ? 'border-studio-gold bg-studio-gold/10 text-foreground font-medium'
                              : 'border-border text-muted-foreground hover:border-studio-gold/40'
                          }`}
                        >
                          {env.labelAr}
                        </button>
                      ))}
                      {/* Custom */}
                      <div className="col-span-2 flex gap-2">
                        <input
                          value={customEnv}
                          onChange={e => setCustomEnv(e.target.value)}
                          placeholder="بيئة مخصصة بالإنجليزية..."
                          className="flex-1 text-sm bg-muted rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button
                          variant="outline" size="sm"
                          disabled={!customEnv.trim() || generating}
                          onClick={() => callGenerate('lifestyle', { environment: customEnv })}
                        >
                          توليد
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {lifestyleImages.map(img => (
                        <ImageCard key={img.id} image={img} onDelete={id => deleteImage(productId, id)} />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Ad Campaigns */}
                <TabsContent value="ad_campaign">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">8 منصات إعلانية دفعة واحدة</p>
                        {adProgress.total > 0 && (
                          <div className="mt-2 space-y-1">
                            <Progress value={(adProgress.current / adProgress.total) * 100} className="h-1.5 w-48" />
                            <p className="text-xs text-muted-foreground">جارٍ توليد {adProgress.current} من {adProgress.total} صورة...</p>
                          </div>
                        )}
                      </div>
                      <Button variant="gold" size="sm" onClick={generateAdCampaign} disabled={generating}>
                        <Megaphone className="w-3.5 h-3.5 ml-1.5" />
                        توليد 8 صور إعلانية
                      </Button>
                    </div>

                    {/* Platform specs preview */}
                    <div className="grid grid-cols-4 gap-2">
                      {AD_SPECS.map(spec => {
                        const existing = adImages.find(i => i.platform === spec.platform)
                        return (
                          <div key={spec.platform} className={`rounded-xl border p-3 text-center ${existing ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : 'border-border'}`}>
                            <div className="text-xs font-bold text-foreground">{spec.labelAr}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{spec.width}×{spec.height}</div>
                            {existing && <div className="text-[10px] text-green-500 mt-1 font-bold">✓ جاهز</div>}
                          </div>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {adImages.map(img => (
                        <ImageCard key={img.id} image={img} onDelete={id => deleteImage(productId, id)} />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Catalog */}
                <TabsContent value="catalog">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">كتالوج A4 بدقة 300dpi — 2480×3508px</p>
                      <Button variant="gold" size="sm" onClick={generateCatalog} disabled={generating}>
                        <BookOpen className="w-3.5 h-3.5 ml-1.5" />
                        توليد الكتالوج
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {catalogImages.map(img => (
                        <ImageCard key={img.id} image={img} onDelete={id => deleteImage(productId, id)} />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right sidebar: timer + steps */}
            <div className="space-y-4 sticky top-20">
              {generating && (
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <GenerationTimer running={generating} durationSeconds={120} />
                    <div className="border-t pt-4">
                      <GenerationSteps steps={steps} />
                    </div>
                    {genProgress > 0 && <Progress value={genProgress} className="h-1" />}
                  </CardContent>
                </Card>
              )}

              {/* Product original */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">الصورة الأصلية</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.originalImageUrl}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-xl border"
                  />
                  {product.geminiAnalysis && (
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>المادة</span><span className="font-semibold text-foreground">{product.material}</span></div>
                      <div className="flex justify-between"><span>الأسلوب</span><span className="font-semibold text-foreground">{product.style}</span></div>
                      <div className="flex justify-between"><span>التشطيب</span><span className="font-semibold text-foreground">{product.finish}</span></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ملخص الصور</div>
                  {[
                    { label: 'خلفية بيضاء', count: whiteBgImages.length, max: 3 },
                    { label: 'واقعية', count: lifestyleImages.length, max: 10 },
                    { label: 'إعلانية', count: adImages.length, max: 8 },
                    { label: 'كتالوج', count: catalogImages.length, max: 1 },
                  ].map(({ label, count, max }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={count === max ? 'text-green-500 font-bold' : 'font-semibold'}>{count}/{max}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
