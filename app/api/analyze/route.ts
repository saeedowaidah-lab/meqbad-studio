export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/gemini'
import { convertToPng, bufferToBase64 } from '@/lib/image-utils'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer = Buffer.from(arrayBuffer as any)

    // Convert any format to PNG
    buffer = await convertToPng(buffer)
    const base64 = await bufferToBase64(buffer)

    const analysis = await analyzeProductImage(base64, 'image/png')
    return NextResponse.json({ analysis, imageBase64: base64 })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
