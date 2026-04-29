import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiAnalysis } from '@/types/product'
import type { QualityCheckResult } from '@/types/image'

function getClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  return new GoogleGenerativeAI(key)
}

export async function analyzeProductImage(imageBase64: string, mimeType: string): Promise<GeminiAnalysis> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' })

  const prompt = `You are an expert product photographer and e-commerce specialist for door handles.
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
Be precise. Return only JSON, no markdown.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ])

  const text = result.response.text().trim()
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as GeminiAnalysis
}

export async function qualityCheckImage(imageBase64: string, mimeType: string, context: string): Promise<QualityCheckResult> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' })

  const prompt = `You are a product photography quality inspector for e-commerce.
Context: ${context}
Rate this product image quality. Return ONLY valid JSON:
{
  "score": 8,
  "issues": ["issue1 if any"],
  "passed": true
}
Check:
- Is the door handle clearly visible and sharp? (worth 3 points)
- Is background clean white or realistic lifestyle? (worth 3 points)
- Is lighting professional? (worth 2 points)
- Is it suitable for e-commerce? (worth 2 points)
Score 1-10. passed=true if score >= 7. Return only JSON.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ])

  const text = result.response.text().trim()
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as QualityCheckResult
}

export async function translateToFluxPrompt(userRequest: string, analysis: GeminiAnalysis): Promise<string> {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' })

  const prompt = `You are an expert at writing prompts for FLUX.1-dev image generation model.
Product: ${analysis.material} door handle, ${analysis.style} style, ${analysis.finish} finish.
User request (may be in Arabic or English): "${userRequest}"
Write an optimized FLUX.1-dev English prompt to achieve this edit.
Return ONLY the prompt text, no explanation.`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
