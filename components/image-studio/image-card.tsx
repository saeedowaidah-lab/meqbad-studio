'use client'
import { useState } from 'react'
import { cn, qualityBadgeClass, qualityColor } from '@/lib/utils'
import { Download, Trash2, Star, Maximize2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProductImage } from '@/types/image'
import { toast } from 'sonner'

interface ImageCardProps {
  image: ProductImage
  onDelete?: (id: string) => void
  className?: string
}

export function ImageCard({ image, onDelete, className }: ImageCardProps) {
  const [fullscreen, setFullscreen] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = `meqbad-${image.type}-${image.dimensions}-${image.id}.jpg`
    link.click()
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(image.url)
    toast.success('تم نسخ رابط الصورة')
  }

  return (
    <>
      <div className={cn('group relative rounded-2xl overflow-hidden border bg-card', className, qualityBadgeClass(image.qualityScore))}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.type}
          className="w-full aspect-square object-cover cursor-zoom-in"
          onClick={() => setFullscreen(true)}
        />

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="icon" variant="secondary" onClick={() => setFullscreen(true)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleCopyUrl}>
            <Copy className="w-4 h-4" />
          </Button>
          {onDelete && (
            <Button size="icon" variant="destructive" onClick={() => onDelete(image.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
          <Badge variant="secondary" className={cn('text-[10px] font-bold gap-0.5', qualityColor(image.qualityScore))}>
            <Star className="w-2.5 h-2.5" />
            {image.qualityScore}/10
          </Badge>
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur">
            {image.dimensions}
          </Badge>
          <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur">
            {image.fileSizeKB} KB
          </Badge>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.type}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 left-4"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  )
}
