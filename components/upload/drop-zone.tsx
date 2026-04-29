'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Upload, ImageIcon, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/avif': ['.avif'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
  'image/svg+xml': ['.svg'],
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  loading?: boolean
}

export function DropZone({ onFilesSelected, maxFiles = 15, loading }: DropZoneProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    setError('')
    if (accepted.length > maxFiles) {
      setError(`الحد الأقصى ${maxFiles} صورة`)
      return
    }
    const newPreviews = accepted.map(f => ({ file: f, url: URL.createObjectURL(f) }))
    setPreviews(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.url))
      return newPreviews
    })
    onFilesSelected(accepted)
  }, [maxFiles, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles,
    disabled: loading,
    onDropRejected: (rej) => {
      if (rej[0]?.errors[0]?.code === 'too-many-files')
        setError(`الحد الأقصى ${maxFiles} صورة في المرة الواحدة`)
      else
        setError('صيغة الملف غير مدعومة')
    },
  })

  const removeFile = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].url)
      const next = prev.filter((_, i) => i !== idx)
      onFilesSelected(next.map(p => p.file))
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-studio-gold bg-studio-gold/5 scale-[1.01]'
            : 'border-border hover:border-studio-gold/50 hover:bg-muted/50',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-studio-gold text-white' : 'bg-muted text-muted-foreground'
          )}>
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="font-bold text-base">
              {isDragActive ? 'أفلت الصور هنا...' : 'اسحب وأفلت صور المنتج هنا'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">أو اضغط للاختيار من جهازك</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {['JPG', 'PNG', 'WEBP', 'HEIC', 'AVIF', 'TIFF', 'BMP', 'SVG'].map(fmt => (
              <span key={fmt} className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">
                {fmt}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">حتى {maxFiles} صورة في المرة</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {previews.map(({ url }, idx) => (
            <div key={url} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover rounded-xl border" />
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-1 left-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full">
                <ImageIcon className="w-2.5 h-2.5 inline ml-0.5" />
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
