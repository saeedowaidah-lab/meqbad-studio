import Anthropic from '@anthropic-ai/sdk'
import type { GeminiAnalysis } from '@/types/product'
import type { BrandKit } from '@/types/product'

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY not set')
  return new Anthropic({ apiKey: key })
}

const TONE_MAP = {
  luxury: 'فاخر ومميز، يخاطب العملاء الراقيين',
  professional: 'احترافي وموثوق، يبرز الجودة والضمان',
  friendly: 'ودي وقريب، يتحدث بلغة العميل اليومية',
  technical: 'تقني ودقيق، يهتم بالمواصفات والتفاصيل',
}

export function buildContentPrompt(analysis: GeminiAnalysis, brand: BrandKit, lang: 'ar' | 'en'): string {
  const tone = TONE_MAP[brand.tone] || TONE_MAP.professional
  const langInst = lang === 'ar'
    ? `اكتب جميع المحتوى باللغة العربية الفصحى المبسطة. الأسلوب: ${tone}.`
    : `Write all content in professional English. Style: ${brand.tone}.`

  return `You are an expert e-commerce content writer for ${brand.storeName}, a Saudi door handle store.
${langInst}

Product Analysis:
- Material: ${analysis.material}
- Style: ${analysis.style}
- Finish: ${analysis.finish}
- Description: ${analysis.rawDescription}
- Color palette: ${analysis.colorPalette?.join(', ')}

Generate the following content and return as valid JSON only:
{
  "title": "SEO title max 60 chars",
  "short_desc": "50 words description",
  "long_desc": "200 words description",
  "bullets": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "instagram": "Instagram caption with 15 relevant ${lang === 'ar' ? 'Arabic' : 'English'} hashtags",
  "snapchat": "Snapchat ad caption, short and punchy",
  "facebook_ad": "Facebook ad: headline | body text | CTA",
  "whatsapp": "WhatsApp marketing message",
  "meta_desc": "Meta description max 155 chars",
  "seo_keywords": ["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8","kw9","kw10"]
}
Return ONLY valid JSON, no markdown.`
}

export async function* streamContent(prompt: string): AsyncGenerator<string> {
  const client = getClient()

  const stream = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text
    }
  }
}

export async function generateContent(prompt: string): Promise<string> {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = msg.content[0]
  if (block.type === 'text') return block.text
  return ''
}

export function buildTechnicalSheetPrompt(analysis: GeminiAnalysis): string {
  return `Based on this door handle analysis, generate a technical specification sheet as JSON:
Analysis: ${JSON.stringify(analysis)}

Return ONLY valid JSON:
{
  "material": "full material description",
  "finish": "finish description",
  "dimensions": "estimated dimensions",
  "weightEstimate": "estimated weight",
  "compatibleDoors": ["door type 1", "door type 2", "door type 3"],
  "installationNotes": "installation instructions",
  "warrantySuggestion": "warranty recommendation"
}`
}
