'use client'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useProductStore } from '@/store/product-store'
import { useBrandStore } from '@/store/brand-store'
import { Loader2, Sparkles, Copy, RefreshCw, Check, Globe } from 'lucide-react'

const AR_SECTIONS = [
  { key: 'title', label: 'عنوان المنتج', maxChars: 60, multiline: false },
  { key: 'short_desc', label: 'وصف قصير', maxChars: 200, multiline: true },
  { key: 'long_desc', label: 'وصف تفصيلي', maxChars: 1000, multiline: true },
  { key: 'bullets', label: 'نقاط المميزات', maxChars: 500, multiline: true },
  { key: 'instagram', label: 'كابشن إنستقرام', maxChars: 600, multiline: true },
  { key: 'snapchat', label: 'كابشن سناب شات', maxChars: 200, multiline: true },
  { key: 'facebook_ad', label: 'إعلان فيسبوك', maxChars: 400, multiline: true },
  { key: 'whatsapp', label: 'رسالة واتساب', maxChars: 300, multiline: true },
  { key: 'meta_desc', label: 'ميتا ديسكريبشن', maxChars: 155, multiline: false },
  { key: 'seo_keywords', label: 'كلمات مفتاحية SEO', maxChars: 300, multiline: false },
] as const

export default function ContentPage() {
  const params = useParams()
  const productId = params.productId as string

  const { products, getProductContent, updateContentField, setContent } = useProductStore()
  const { brand } = useBrandStore()
  const product = products.find(p => p.id === productId)
  const content = getProductContent(productId)

  const [generating, setGenerating] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [lang, setLang] = useState<'ar' | 'en'>('ar')

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast.success('تم النسخ')
  }

  const generateAll = async (targetLang: 'ar' | 'en') => {
    if (!product?.geminiAnalysis) { toast.error('لا يوجد تحليل للمنتج'); return }
    setGenerating('all')
    setStreaming(true)
    setStreamText('')

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: product.geminiAnalysis,
          brand,
          lang: targetLang,
          stream: true,
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              buffer += text
              setStreamText(buffer)
            } catch {}
          }
        }
      }

      // Parse the accumulated JSON
      const cleaned = buffer.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)

      // Save all fields
      const existing = content ?? { ar: {}, en: {}, technicalSheet: {} as never }
      setContent(productId, {
        ...existing,
        [targetLang]: { ...(existing[targetLang] ?? {}), ...parsed },
      })
      toast.success(`تم توليد المحتوى ${targetLang === 'ar' ? 'العربي' : 'الإنجليزي'} ✓`)
    } catch (e) {
      toast.error('فشل التوليد: ' + (e instanceof Error ? e.message : 'خطأ'))
    } finally {
      setGenerating(null)
      setStreaming(false)
      setStreamText('')
    }
  }

  const regenerateSection = async (key: string, targetLang: 'ar' | 'en') => {
    if (!product?.geminiAnalysis) return
    setGenerating(key)
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: product.geminiAnalysis, brand, lang: targetLang }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const value = data.content?.[key]
      if (value) {
        updateContentField(productId, targetLang, key, Array.isArray(value) ? value.join('\n') : value)
        toast.success('تم التحديث')
      }
    } catch (e) {
      toast.error('فشل: ' + (e instanceof Error ? e.message : 'خطأ'))
    } finally {
      setGenerating(null)
    }
  }

  const generateTechnical = async () => {
    if (!product?.geminiAnalysis) return
    setGenerating('technical')
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: product.geminiAnalysis, brand, lang, type: 'technical' }),
      })
      const data = await res.json()
      const existing = content ?? { ar: {}, en: {}, technicalSheet: {} as never }
      setContent(productId, { ...existing, technicalSheet: data.technicalSheet })
      toast.success('تم توليد الجدول التقني')
    } catch {
      toast.error('فشل توليد الجدول التقني')
    } finally {
      setGenerating(null)
    }
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">المنتج غير موجود</div>

  const currentContent = content?.[lang] ?? {}

  return (
    <div className="flex min-h-screen">
      <Sidebar productId={productId} />
      <div className="flex-1 mr-60">
        <Header
          title="استوديو المحتوى"
          subtitle="توليد المحتوى التسويقي الكامل"
          actions={
            <div className="flex gap-2">
              <Button
                variant={lang === 'ar' ? 'default' : 'outline'} size="sm"
                onClick={() => setLang('ar')}
              >🇸🇦 عربي</Button>
              <Button
                variant={lang === 'en' ? 'default' : 'outline'} size="sm"
                onClick={() => setLang('en')}
              >🇬🇧 English</Button>
            </div>
          }
        />

        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Generate all button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">المحتوى {lang === 'ar' ? 'العربي' : 'الإنجليزي'}</h2>
                <p className="text-sm text-muted-foreground">توليد كامل بـ Claude Haiku — streaming مباشر</p>
              </div>
              <Button
                variant="gold"
                onClick={() => generateAll(lang)}
                disabled={generating !== null}
              >
                {generating === 'all' ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Sparkles className="w-4 h-4 ml-2" />}
                توليد المحتوى الكامل
              </Button>
            </div>

            {/* Streaming preview */}
            {streaming && streamText && (
              <Card className="border-studio-gold/30 bg-studio-gold/5">
                <CardContent className="p-4">
                  <div className="text-xs font-bold text-studio-gold mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    جارٍ التوليد...
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {streamText}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Content sections */}
            {AR_SECTIONS.map(section => {
              const value = currentContent[section.key]
              const displayValue = Array.isArray(value) ? value.join('\n') : (value ?? '')
              const charCount = displayValue.length
              const isOverLimit = charCount > section.maxChars

              return (
                <Card key={section.key}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{section.label}</h3>
                        <Badge variant={isOverLimit ? 'destructive' : 'secondary'} className="text-[10px]">
                          {charCount}/{section.maxChars}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost" size="sm"
                          disabled={generating !== null}
                          onClick={() => regenerateSection(section.key, lang)}
                        >
                          {generating === section.key
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RefreshCw className="w-3.5 h-3.5" />
                          }
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => copyToClipboard(displayValue, section.key)}
                          disabled={!displayValue}
                        >
                          {copied === section.key
                            ? <Check className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </div>
                    </div>

                    {section.multiline ? (
                      <textarea
                        value={displayValue}
                        onChange={e => updateContentField(productId, lang, section.key, e.target.value)}
                        rows={section.key === 'long_desc' ? 6 : 3}
                        className="w-full text-sm bg-muted rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring font-arabic"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        placeholder={`${section.label}...`}
                      />
                    ) : (
                      <input
                        value={displayValue}
                        onChange={e => updateContentField(productId, lang, section.key, e.target.value)}
                        className="w-full text-sm bg-muted rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        placeholder={`${section.label}...`}
                      />
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Technical Sheet */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">الجدول التقني</h3>
                  <Button variant="outline" size="sm" onClick={generateTechnical} disabled={generating !== null}>
                    {generating === 'technical'
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1.5" />
                      : <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                    }
                    توليد
                  </Button>
                </div>
                {content?.technicalSheet ? (
                  <div className="space-y-2 text-sm">
                    {Object.entries(content.technicalSheet).map(([k, v]) => (
                      <div key={k} className="flex gap-3 py-2 border-b last:border-0">
                        <span className="text-muted-foreground w-32 flex-shrink-0 font-medium">{k}</span>
                        <span>{Array.isArray(v) ? v.join('، ') : String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">اضغط "توليد" لإنشاء الجدول التقني تلقائياً</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
