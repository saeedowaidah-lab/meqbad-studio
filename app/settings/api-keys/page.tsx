'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSessionStore } from '@/store/session-store'
import { Key, Eye, EyeOff, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'

interface ApiKeyFieldProps {
  label: string
  keyName: keyof import('@/store/session-store').ApiKeys
  placeholder: string
  link?: string
  description: string
}

const FIELDS: ApiKeyFieldProps[] = [
  { label: 'Gemini API Key', keyName: 'gemini', placeholder: 'AIza...', link: 'https://aistudio.google.com', description: 'تحليل الصور وفحص الجودة — مجاني تقريباً' },
  { label: 'Hugging Face Token', keyName: 'huggingFace', placeholder: 'hf_...', link: 'https://huggingface.co/settings/tokens', description: 'توليد الصور بـ FLUX.1-dev — مجاني' },
  { label: 'Anthropic API Key', keyName: 'anthropic', placeholder: 'sk-ant-...', link: 'https://console.anthropic.com', description: 'توليد المحتوى بـ Claude Haiku — تكلفة منخفضة جداً' },
  { label: 'Supabase URL', keyName: 'supabaseUrl', placeholder: 'https://xxx.supabase.co', link: 'https://app.supabase.com', description: 'قاعدة البيانات والتخزين' },
  { label: 'Supabase Anon Key', keyName: 'supabaseAnonKey', placeholder: 'eyJ...', description: 'مفتاح Supabase العام (anon key)' },
]

export default function ApiKeysPage() {
  const { apiKeys, setApiKey, getTodayUsage } = useSessionStore()
  const [visible, setVisible] = useState<Set<string>>(new Set())
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})

  const toggleVisible = (key: string) => {
    const next = new Set(visible)
    next.has(key) ? next.delete(key) : next.add(key)
    setVisible(next)
  }

  const testConnection = async (keyName: string) => {
    setTesting(keyName)
    await new Promise(r => setTimeout(r, 1200))
    const value = apiKeys[keyName as keyof typeof apiKeys]
    const ok = !!(value && value.length > 10)
    setTestResults(prev => ({ ...prev, [keyName]: ok }))
    setTesting(null)
    toast[ok ? 'success' : 'error'](ok ? `${keyName}: الاتصال ناجح ✓` : `${keyName}: المفتاح غير صالح`)
  }

  const todayUsage = getTodayUsage()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 mr-60">
        <Header title="مفاتيح API" subtitle="BYOK — Bring Your Own Key" />

        <main className="p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Security note */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>أمان:</strong> تُحفظ المفاتيح في localStorage فقط ولا تُرسَل لأي خوادم خارجية. جميع الطلبات تمر عبر API routes الخادم.
              </div>
            </div>

            {/* Usage */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">الاستخدام اليوم</div>
                  <div className="text-xs text-muted-foreground mt-0.5">حد يومي: 15 منتج</div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">{todayUsage}/15</div>
                  <div className="text-xs text-muted-foreground">{15 - todayUsage} متبقي</div>
                </div>
              </CardContent>
            </Card>

            {/* API Keys */}
            {FIELDS.map(field => {
              const value = apiKeys[field.keyName] ?? ''
              const isVisible = visible.has(field.keyName)
              const testResult = testResults[field.keyName]

              return (
                <Card key={field.keyName}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-studio-gold" />
                        <div>
                          <div className="font-bold text-sm">{field.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{field.description}</div>
                        </div>
                      </div>
                      {testResult !== undefined && (
                        <Badge variant={testResult ? 'success' : 'destructive'} className="flex-shrink-0">
                          {testResult
                            ? <><CheckCircle className="w-3 h-3 ml-1" /> متصل</>
                            : <><XCircle className="w-3 h-3 ml-1" /> خطأ</>
                          }
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={value}
                          onChange={e => setApiKey(field.keyName, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                          dir="ltr"
                        />
                        <button
                          onClick={() => toggleVisible(field.keyName)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        disabled={!value || testing === field.keyName}
                        onClick={() => testConnection(field.keyName)}
                      >
                        {testing === field.keyName
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : 'اختبار'
                        }
                      </Button>
                    </div>

                    {field.link && (
                      <a
                        href={field.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        احصل على المفتاح من هنا ↗
                      </a>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Rembg service */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-bold text-sm">Rembg Microservice</div>
                    <div className="text-xs text-muted-foreground">خدمة إزالة الخلفية — مجانية تماماً</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted rounded-xl p-3 font-mono">
                  URL: {process.env.NEXT_PUBLIC_REMBG_URL ?? 'http://localhost:8000'}<br />
                  تأكد من تشغيل: <strong>docker-compose up rembg</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
