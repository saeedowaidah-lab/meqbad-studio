export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const analysis = await analyzeProductImage(base64, mimeType)
    return NextResponse.json({ analysis, imageBase64: base64 })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
