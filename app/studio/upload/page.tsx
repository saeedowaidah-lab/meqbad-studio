'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DropZone } from '@/components/upload/drop-zone'
import { AnalysisPanel } from '@/components/upload/analysis-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProductStore } from '@/store/product-store'
import { generateId } from '@/lib/utils'
import type { GeminiAnalysis } from '@/types/product'
import { Loader2, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react'

type UploadStep = 'idle' | 'analyzing' | 'ready' | 'saving' | string

export default function UploadPage() {
  const router = useRouter()
  const { addProduct, setCurrentProduct } = useProductStore()

  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<UploadStep>('idle')
  const [progress, setProgress] = useState(0)
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null)
  const [imageBase64, setImageBase64] = useState('')
  const [productName, setProductName] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [batchResults, setBatchResults] = useState<{ file: string; done: boolean }[]>([])

  const handleFilesSelected = useCallback((selected: File[]) => {
    setFiles(selected)
    setStep('idle')
    setAnalysis(null)
    setBatchMode(selected.length > 1)
  }, [])

  const analyzeImage = async (file: File) => {
    setStep('analyzing')
    setProgress(20)
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/analyze', { method: 'POST', body: fd })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setProgress(100)
    return data
  }

  const handleAnalyze = async () => {
    if (!files.length) return

    if (batchMode) {
      await handleBatchProcess()
      return
    }

    try {
      const data = await analyzeImage(files[0])
      setAnalysis(data.analysis)
      setImageBase64(data.imageBase64)
      setProductName(`مقبض ${data.analysis.material} ${data.analysis.style}`)
      setStep('ready')
    } catch (e) {
      toast.error('فشل التحليل: ' + (e instanceof Error ? e.message : 'خطأ غير معروف'))
      setStep('idle')
    }
  }

  const handleBatchProcess = async () => {
    const results = files.map(f => ({ file: f.name, done: false }))
    setBatchResults(results)
    setStep('analyzing')

    for (let i = 0; i < files.length; i++) {
      try {
        const data = await analyzeImage(files[i])
        const id = generateId()
        const product = {
          id,
          name: `مقبض ${data.analysis.material} ${data.analysis.style} ${i + 1}`,
          material: data.analysis.material,
          style: data.analysis.style,
          finish: data.analysis.finish,
          originalImageUrl: `data:image/png;base64,${data.imageBase64}`,
          geminiAnalysis: data.analysis,
          status: 'complete' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imagesCount: 0,
          contentCount: 0,
        }
        addProduct(product)
        setBatchResults(prev => prev.map((r, j) => j === i ? { ...r, done: true } : r))
        setProgress(Math.round(((i + 1) / files.length) * 100))
      } catch (e) {
        toast.error(`فشل تحليل ${files[i].name}`)
      }
    }

    toast.success(`تم معالجة ${files.length} منتج بنجاح`)
    router.push('/history')
  }

  const handleProceed = async () => {
    if (!analysis) return
    setStep('saving' as UploadStep)
    try {
      const id = generateId()
      const product = {
        id,
        name: productName || `مقبض ${analysis.material}`,
        material: analysis.material,
        style: analysis.style,
        finish: analysis.finish,
        originalImageUrl: `data:image/png;base64,${imageBase64}`,
        geminiAnalysis: analysis,
        status: 'complete' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imagesCount: 0,
        contentCount: 0,
      }
      addProduct(product)
      setCurrentProduct(id)
      toast.success('تم حفظ المنتج، انتقل إلى الاستوديو')
      router.push(`/studio/${id}/images`)
    } catch (e) {
      toast.error('خطأ في الحفظ')
      setStep('ready')
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 mr-60">
        <Header title="رفع منتج جديد" subtitle="ارفع صورة المقبض وابدأ التوليد الذكي" />

        <main className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className={`grid gap-6 ${analysis ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
              {/* Left: Upload zone */}
              <div className="space-y-5">
                <Card>
                  <CardContent className="p-5">
                    <DropZone
                      onFilesSelected={handleFilesSelected}
                      maxFiles={15}
                      loading={step === 'analyzing'}
                    />

                    {/* Product name */}
                    {step === 'ready' && (
                      <div className="mt-4">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          اسم المنتج
                        </label>
                        <input
                          value={productName}
                          onChange={e => setProductName(e.target.value)}
                          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="أدخل اسم المنتج..."
                        />
                      </div>
                    )}

                    {/* Progress */}
                    {step === 'analyzing' && (
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {batchMode ? `تحليل الدفعة... ${batchResults.filter(r=>r.done).length}/${files.length}` : 'جارٍ التحليل بـ Gemini AI...'}
                          </span>
                          <span className="font-mono text-xs">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                        {batchMode && (
                          <div className="grid grid-cols-2 gap-1.5 mt-3">
                            {batchResults.map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {r.done
                                  ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  : i === batchResults.filter(x=>x.done).length
                                    ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                    : <div className="w-3 h-3 rounded-full border border-border flex-shrink-0" />
                                }
                                <span className="truncate">{r.file}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {step === 'idle' && files.length > 0 && (
                    <Button variant="gold" onClick={handleAnalyze} className="flex-1 h-11">
                      <Sparkles className="w-4 h-4 ml-2" />
                      {batchMode ? `تحليل ${files.length} صور` : 'تحليل بـ Gemini AI'}
                    </Button>
                  )}
                  {step === 'ready' && (
                    <>
                      <Button variant="outline" onClick={() => setStep('idle')} size="lg">
                        إعادة
                      </Button>
                      <Button variant="gold" onClick={handleProceed} className="flex-1 h-11">
                        {(step as string) === 'saving' && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                        <ArrowLeft className="w-4 h-4 ml-2" />
                        ابدأ التوليد في الاستوديو
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Analysis panel */}
              {analysis && (
                <div>
                  <AnalysisPanel
                    analysis={analysis}
                    onChange={updated => setAnalysis(updated)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
