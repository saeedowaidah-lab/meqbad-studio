'use client'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ImageCard } from '@/components/image-studio/image-card'
import { GenerationTimer } from '@/components/image-studio/generation-timer'
import { useProductStore } from '@/store/product-store'
import { generateId } from '@/lib/utils'
import type { ProductImage } from '@/types/image'
import {
  Send, Loader2, Bot, User, Sparkles, Eye,
  ArrowRight, ArrowLeft, History, Wand2,
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  image?: ProductImage
  timestamp: string
}

const QUICK_EDITS = [
  'اجعل الخلفية ذهبية اللون',
  'أضف ظل ناعم تحت المقبض',
  'اجعل الإضاءة أكثر دراما',
  'غير زاوية التصوير لـ 45 درجة',
  'اجعل الصورة مناسبة لإعلان سناب',
  'أضف خلفية رخامية فاخرة',
  'اجعل الألوان أكثر حيوية',
  'ركز على تفاصيل المقبض',
]

export default function ChatPage() {
  const params = useParams()
  const productId = params.productId as string

  const { products, getProductImages, addImage } = useProductStore()
  const product = products.find(p => p.id === productId)
  const allImages = getProductImages(productId)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'مرحباً! أنا مساعدك الذكي لتحرير الصور. أخبرني ماذا تريد تعديل وسأقوم بتوليد صورة جديدة فوراً. يمكنك الكتابة بالعربية أو الإنجليزية.',
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(allImages[0] ?? null)
  const [generating, setGenerating] = useState(false)
  const [historyIdx, setHistoryIdx] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (allImages.length && !selectedImage) setSelectedImage(allImages[0])
  }, [allImages, selectedImage])

  const generatedImages = messages.filter(m => m.image).map(m => m.image!)

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim()
    if (!userText || generating || !product?.geminiAnalysis) return

    setInput('')
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setGenerating(true)

    try {
      // Step 1: Translate request to FLUX prompt via Gemini
      const translateRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'translate',
          request: userText,
          analysis: product.geminiAnalysis,
        }),
      })

      // Step 2: Generate image with the translated prompt
      const genRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'white_bg',
          analysis: product.geminiAnalysis,
          productId,
          customPrompt: userText,
          originalImageBase64: selectedImage?.url?.replace(/^data:image\/\w+;base64,/, '') ?? product.originalImageUrl?.replace(/^data:image\/\w+;base64,/, ''),
        }),
      })

      if (!genRes.ok) throw new Error(await genRes.text())
      const data = await genRes.json()

      const newImage: ProductImage = {
        id: generateId(),
        productId,
        type: 'white_bg',
        url: data.imageBase64 ? `data:image/jpeg;base64,${data.imageBase64}` : data.url,
        storagePath: data.url ?? '',
        dimensions: data.dimensions,
        fileSizeKB: data.sizeKB,
        qualityScore: data.qualityScore ?? 8,
        qualityIssues: data.qualityIssues ?? [],
        createdAt: new Date().toISOString(),
      }

      addImage(productId, newImage)
      setSelectedImage(newImage)

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        text: `تم توليد الصورة بناءً على طلبك: "${userText}"\nجودة الصورة: ${data.qualityScore ?? 8}/10`,
        image: newImage,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      const errMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        text: 'عذراً، فشل التوليد. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
      toast.error('فشل التوليد')
    } finally {
      setGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">المنتج غير موجود</div>

  return (
    <div className="flex min-h-screen">
      <Sidebar productId={productId} />
      <div className="flex-1 mr-60 flex flex-col">
        <Header title="المحرر الذكي" subtitle="حرّر الصور بالكلام — عربي أو إنجليزي" />

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Image preview */}
          <div className="w-[420px] flex-shrink-0 border-l bg-muted/30 flex flex-col">
            {/* Current image */}
            <div className="p-4 flex-1">
              {selectedImage ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage.url}
                    alt="current"
                    className="w-full rounded-2xl border shadow-sm"
                  />
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="bg-background border rounded-full px-2 py-0.5">{selectedImage.dimensions}</span>
                    <span className="bg-background border rounded-full px-2 py-0.5">{selectedImage.fileSizeKB} KB</span>
                    <span className="bg-background border rounded-full px-2 py-0.5">⭐ {selectedImage.qualityScore}/10</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  اختر صورة أو ولّد واحدة أولاً
                </div>
              )}

              {/* Generation timer */}
              {generating && (
                <div className="mt-4 flex justify-center">
                  <GenerationTimer running={generating} durationSeconds={120} />
                </div>
              )}
            </div>

            {/* Image history thumbnails */}
            {generatedImages.length > 0 && (
              <div className="border-t p-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  سجل التعديلات ({generatedImages.length})
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {generatedImages.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage?.id === img.id ? 'border-studio-gold' : 'border-border'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-studio-gold' : 'bg-primary'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-primary-foreground" />
                    }
                  </div>
                  <div className={`max-w-sm space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-studio-gold text-white rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.image && (
                      <button
                        onClick={() => setSelectedImage(msg.image!)}
                        className="w-32 h-32 rounded-xl overflow-hidden border hover:border-studio-gold transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.image.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>
                </div>
              ))}

              {generating && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">جارٍ التوليد...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick edit suggestions */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK_EDITS.map(edit => (
                  <button
                    key={edit}
                    onClick={() => sendMessage(edit)}
                    disabled={generating}
                    className="flex-shrink-0 text-xs bg-muted hover:bg-accent border border-border rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3 inline ml-1 text-studio-gold" />
                    {edit}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={generating}
                  placeholder="اكتب تعديلك... (Enter للإرسال، Shift+Enter لسطر جديد)"
                  rows={2}
                  className="flex-1 text-sm bg-muted rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  dir="auto"
                />
                <Button
                  variant="gold"
                  size="icon"
                  className="h-12 w-12 flex-shrink-0"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || generating}
                >
                  {generating
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Send className="w-5 h-5" />
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
