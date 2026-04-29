export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { removeBackground } from '@/lib/rembg'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))
    const result = await removeBackground(buffer, file.name)

    return new NextResponse(result as unknown as BodyInit, {
      headers: { 'Content-Type': 'image/png', 'Content-Length': result.length.toString() },
    })
  } catch (error) {
    console.error('Remove bg error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Background removal failed' },
      { status: 500 }
    )
  }
}
