export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { buildContentPrompt, streamContent, generateContent, buildTechnicalSheetPrompt } from '@/lib/claude'
import type { GeminiAnalysis } from '@/types/product'
import type { BrandKit } from '@/types/product'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      analysis: GeminiAnalysis
      brand: BrandKit
      lang: 'ar' | 'en'
      stream?: boolean
      type?: 'content' | 'technical'
    }

    const { analysis, brand, lang, stream: doStream, type = 'content' } = body

    if (type === 'technical') {
      const prompt = buildTechnicalSheetPrompt(analysis)
      const text = await generateContent(prompt)
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const sheet = JSON.parse(cleaned)
      return NextResponse.json({ technicalSheet: sheet })
    }

    const prompt = buildContentPrompt(analysis, brand, lang)

    if (doStream) {
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamContent(prompt)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (e) {
            controller.error(e)
          }
        },
      })
      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const text = await generateContent(prompt)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const content = JSON.parse(cleaned)
    return NextResponse.json({ content })
  } catch (error) {
    console.error('Content error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content generation failed' },
      { status: 500 }
    )
  }
}
