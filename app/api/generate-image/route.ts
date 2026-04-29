export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import {
  generateImage,
  buildWhiteBgPrompt,
  buildLifestylePrompt,
  buildAdCampaignPrompt,
  buildCatalogPrompt,
} from '@/lib/huggingface'
import { qualityCheckImage } from '@/lib/gemini'
import { resizeAndCompress, bufferToBase64, addWhiteBackground } from '@/lib/image-utils'
import { removeBackground } from '@/lib/rembg'
import { uploadImageToStorage } from '@/lib/supabase'
import { SALLA_SPECS, AD_SPECS } from '@/lib/salla-specs'
import type { GeminiAnalysis } from '@/types/product'

const MAX_QUALITY_ATTEMPTS = 3

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type: 'white_bg' | 'lifestyle' | 'ad_campaign' | 'catalog'
      analysis: GeminiAnalysis
      productId: string
      environment?: string
      platform?: string
      originalImageBase64?: string
      customPrompt?: string
    }

    const { type, analysis, productId, environment, platform, originalImageBase64 } = body

    let prompt: string
    let targetWidth = 1200
    let targetHeight = 1200

    switch (type) {
      case 'white_bg':
        prompt = buildWhiteBgPrompt(analysis)
        targetWidth = 1200; targetHeight = 1200
        break
      case 'lifestyle':
        prompt = buildLifestylePrompt(analysis, environment ?? 'modern interior door')
        targetWidth = 800; targetHeight = 800
        break
      case 'ad_campaign': {
        prompt = buildAdCampaignPrompt(analysis, platform ?? 'social media')
        const adSpec = AD_SPECS.find(s => s.platform === platform)
        if (adSpec) { targetWidth = adSpec.width; targetHeight = adSpec.height }
        break
      }
      case 'catalog':
        prompt = buildCatalogPrompt(analysis)
        targetWidth = 2480; targetHeight = 3508
        break
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    let finalBuffer: Buffer | null = null
    let qualityResult = { score: 0, issues: [] as string[], passed: false }
    let attempts = 0

    while (attempts < MAX_QUALITY_ATTEMPTS && !qualityResult.passed) {
      attempts++

      let genBuffer = await generateImage(
        attempts > 1 ? `${prompt}, high quality, professional, detailed` : prompt,
        Math.min(targetWidth, 1024),
        Math.min(targetHeight, 1024)
      )

      // For white_bg: remove background from original then composite
      if (type === 'white_bg' && originalImageBase64) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const origBuffer = Buffer.from(originalImageBase64 as any, 'base64')
          const noBgBuffer = await removeBackground(origBuffer, 'product.png')
          genBuffer = await addWhiteBackground(noBgBuffer, 1200, 1200)
        } catch (e) {
          console.warn('Rembg failed, using generated image:', e)
        }
      }

      const maxKB = type === 'catalog' ? 4096 : SALLA_SPECS.main.maxSizeKB
      const { buffer: resized } = await resizeAndCompress(genBuffer, {
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      }, maxKB)

      const base64 = await bufferToBase64(resized)
      qualityResult = await qualityCheckImage(base64, 'image/jpeg', `${type} product image`)

      finalBuffer = resized
      if (qualityResult.passed) break
    }

    if (!finalBuffer) return NextResponse.json({ error: 'Generation failed' }, { status: 500 })

    const filename = `${type}-${Date.now()}.jpg`
    let url = ''
    try {
      url = await uploadImageToStorage(productId, type, filename, finalBuffer)
    } catch {
      // Storage optional — return base64 only
    }

    const base64Final = await bufferToBase64(finalBuffer)

    return NextResponse.json({
      url,
      imageBase64: base64Final,
      dimensions: `${targetWidth}x${targetHeight}`,
      sizeKB: Math.round(finalBuffer.length / 1024),
      qualityScore: qualityResult.score,
      qualityIssues: qualityResult.issues,
      attempts,
    })
  } catch (error) {
    console.error('Generate image error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
