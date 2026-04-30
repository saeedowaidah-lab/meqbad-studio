import Anthropic from '@anthropic-ai/sdk'
import type { GeminiAnalysis } from '@/types/product'
import type { QualityCheckResult } from '@/types/image'

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  return new Anthropic({ apiKey: key })
}

export async function analyzeProductImage(imageBase64: string, mimeType: string): Promise<GeminiAnalysis> {
  const client = getClient()

  const validMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ? (mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg'

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: validMime, data: imageBase64 },
          },
          {
            type: 'text',
            text: `You are an expert product photographer and e-commerce specialist for door handles.
Analyze this door handle image and return ONLY valid JSON with this exact structure:
{
  "material": "brass|chrome|matte_black|gold|stainless_steel|other",
  "style": "modern|classic|industrial|luxury|minimalist|other",
  "finish": "polished|brushed|painted|other",
  "estimatedDimensions": "e.g. 15cm x 3cm",
  "suggestedLighting": "warm|cool|neutral|dramatic",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "qualityScore": 7,
  "recommendations": ["tip1", "tip2"],
  "rawDescription": "detailed description of the door handle"
}
Be precise. Return only JSON, no markdown.`,
          },
        ],
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as GeminiAnalysis
}

export async function qualityCheckImage(imageBase64: string, mimeType: string, context: string): Promise<QualityCheckResult> {
  const client = getClient()

  const validMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ? (mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg'

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: validMime, data: imageBase64 },
          },
          {
            type: 'text',
            text: `You are a product photography quality inspector for e-commerce.
Context: ${context}
Rate this product image quality. Return ONLY valid JSON:
{
  "score": 8,
  "issues": ["issue1 if any"],
  "passed": true
}
Score 1-10. passed=true if score >= 7. Return only JSON.`,
          },
        ],
      },
    ],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as QualityCheckResult
}

export async function translateToFluxPrompt(userRequest: string, analysis: GeminiAnalysis): Promise<string> {
  const client = getClient()

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are an expert at writing prompts for FLUX.1-dev image generation model.
Product: ${analysis.material} door handle, ${analysis.style} style, ${analysis.finish} finish.
User request (may be in Arabic or English): "${userRequest}"
Write an optimized FLUX.1-dev English prompt to achieve this edit.
Return ONLY the prompt text, no explanation.`,
      },
    ],
  })

  return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
}
