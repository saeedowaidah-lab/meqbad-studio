'use client'
import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react'
import type { GenerationStep } from '@/types/image'

interface GenerationStepsProps {
  steps: GenerationStep[]
}

const ICONS = {
  pending: Circle,
  active: Loader2,
  done: CheckCircle,
  error: XCircle,
}
const COLORS = {
  pending: 'text-muted-foreground',
  active: 'text-primary animate-spin',
  done: 'text-green-500',
  error: 'text-destructive',
}

export function GenerationSteps({ steps }: GenerationStepsProps) {
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const Icon = ICONS[step.status]
        const color = COLORS[step.status]
        return (
          <div key={i} className="flex items-center gap-3">
            <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
            <span className={cn(
              'text-sm',
              step.status === 'done' ? 'line-through text-muted-foreground' : '',
              step.status === 'active' ? 'font-semibold text-foreground' : 'text-muted-foreground',
              step.status === 'error' ? 'text-destructive' : '',
            )}>
              {step.labelAr}
            </span>
            {step.status === 'done' && (
              <span className="text-[10px] text-green-500 font-bold mr-auto">✓</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const DEFAULT_STEPS: GenerationStep[] = [
  { label: 'Analyzing image', labelAr: 'تحليل الصورة', status: 'pending' },
  { label: 'Removing background', labelAr: 'إزالة الخلفية', status: 'pending' },
  { label: 'Generating with FLUX', labelAr: 'توليد الصورة بـ FLUX', status: 'pending' },
  { label: 'Quality check', labelAr: 'فحص الجودة', status: 'pending' },
  { label: 'Saving', labelAr: 'الحفظ', status: 'pending' },
]
