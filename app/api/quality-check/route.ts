export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { qualityCheckImage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg', context = 'product image' } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image data' }, { status: 400 })

    const result = await qualityCheckImage(imageBase64, mimeType, context)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quality check failed' },
      { status: 500 }
    )
  }
}
