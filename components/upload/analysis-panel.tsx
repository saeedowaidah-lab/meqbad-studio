'use client'
import { useState } from 'react'
import type { GeminiAnalysis } from '@/types/product'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Star, Palette, Lightbulb, Ruler, Wand2 } from 'lucide-react'

const MATERIAL_LABELS: Record<string, string> = {
  brass: 'نحاس أصفر', chrome: 'كروم', matte_black: 'أسود مطفي',
  gold: 'ذهبي', stainless_steel: 'ستانلس ستيل', other: 'أخرى',
}
const STYLE_LABELS: Record<string, string> = {
  modern: 'عصري', classic: 'كلاسيكي', industrial: 'صناعي',
  luxury: 'فاخر', minimalist: 'بسيط', other: 'أخرى',
}
const FINISH_LABELS: Record<string, string> = {
  polished: 'لامع', brushed: 'مصنفر', painted: 'مطلي', other: 'أخرى',
}
const LIGHTING_LABELS: Record<string, string> = {
  warm: 'دافئ', cool: 'بارد', neutral: 'محايد', dramatic: 'دراماتيكي',
}

interface AnalysisPanelProps {
  analysis: GeminiAnalysis
  onChange: (updated: GeminiAnalysis) => void
}

export function AnalysisPanel({ analysis, onChange }: AnalysisPanelProps) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(analysis)

  const update = (key: keyof GeminiAnalysis, value: unknown) => {
    const updated = { ...local, [key]: value }
    setLocal(updated)
    onChange(updated)
  }

  const scoreColor = local.qualityScore >= 8 ? 'text-green-500' : local.qualityScore >= 6 ? 'text-yellow-500' : 'text-red-500'

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-studio-gold" />
            تحليل Gemini AI
          </h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-dashed rounded-lg px-2 py-1"
          >
            {editing ? '✓ حفظ' : '✏ تعديل'}
          </button>
        </div>

        {/* Quality Score */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
          <Star className={cn('w-5 h-5', scoreColor)} />
          <div>
            <div className="text-xs text-muted-foreground">جودة الصورة الأصلية</div>
            <div className={cn('text-lg font-bold', scoreColor)}>{local.qualityScore}/10</div>
          </div>
          <div className="mr-auto flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full',
                  i < local.qualityScore
                    ? local.qualityScore >= 8 ? 'bg-green-500' : local.qualityScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    : 'bg-border'
                )}
              />
            ))}
          </div>
        </div>

        {/* Attributes grid */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="المادة" editing={editing}>
            {editing ? (
              <select
                value={local.material}
                onChange={e => update('material', e.target.value as GeminiAnalysis['material'])}
                className="w-full text-sm bg-background border border-input rounded-lg px-2 py-1.5"
              >
                {Object.entries(MATERIAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <Badge variant="secondary">{MATERIAL_LABELS[local.material] ?? local.material}</Badge>
            )}
          </Field>

          <Field label="الأسلوب" editing={editing}>
            {editing ? (
              <select
                value={local.style}
                onChange={e => update('style', e.target.value as GeminiAnalysis['style'])}
                className="w-full text-sm bg-background border border-input rounded-lg px-2 py-1.5"
              >
                {Object.entries(STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <Badge variant="secondary">{STYLE_LABELS[local.style] ?? local.style}</Badge>
            )}
          </Field>

          <Field label="التشطيب" editing={editing}>
            {editing ? (
              <select
                value={local.finish}
                onChange={e => update('finish', e.target.value as GeminiAnalysis['finish'])}
                className="w-full text-sm bg-background border border-input rounded-lg px-2 py-1.5"
              >
                {Object.entries(FINISH_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <Badge variant="secondary">{FINISH_LABELS[local.finish] ?? local.finish}</Badge>
            )}
          </Field>

          <Field label="الإضاءة المقترحة" editing={editing}>
            {editing ? (
              <select
                value={local.suggestedLighting}
                onChange={e => update('suggestedLighting', e.target.value as GeminiAnalysis['suggestedLighting'])}
                className="w-full text-sm bg-background border border-input rounded-lg px-2 py-1.5"
              >
                {Object.entries(LIGHTING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <Badge variant="secondary">
                <Lightbulb className="w-3 h-3 ml-1" />
                {LIGHTING_LABELS[local.suggestedLighting] ?? local.suggestedLighting}
              </Badge>
            )}
          </Field>
        </div>

        {/* Dimensions */}
        <Field label="الأبعاد المقدرة" editing={editing}>
          {editing ? (
            <input
              value={local.estimatedDimensions}
              onChange={e => update('estimatedDimensions', e.target.value)}
              className="w-full text-sm bg-background border border-input rounded-lg px-3 py-1.5"
            />
          ) : (
            <span className="text-sm flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
              {local.estimatedDimensions}
            </span>
          )}
        </Field>

        {/* Color Palette */}
        {local.colorPalette?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              لوحة الألوان
            </div>
            <div className="flex gap-2">
              {local.colorPalette.map((hex) => (
                <div key={hex} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-lg border border-border shadow-sm"
                    style={{ background: hex }}
                    title={hex}
                  />
                  <span className="text-[9px] text-muted-foreground font-mono">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {local.recommendations?.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">توصيات التحسين</div>
            {local.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                <span className="text-studio-gold mt-0.5">•</span>
                {rec}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, children, editing }: { label: string; children: React.ReactNode; editing: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}
