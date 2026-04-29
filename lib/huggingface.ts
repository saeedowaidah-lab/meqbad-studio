import type { GeminiAnalysis } from '@/types/product'

const HF_API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev'
const MAX_RETRIES = 5
const INITIAL_DELAY = 10000

function getToken() {
  const token = process.env.HUGGING_FACE_TOKEN
  if (!token) throw new Error('HUGGING_FACE_TOKEN not set')
  return token
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateImage(prompt: string, width = 1024, height = 1024): Promise<Buffer> {
  const token = getToken()
  let delay = INITIAL_DELAY

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-use-cache': 'false',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { width, height, num_inference_steps: 28, guidance_scale: 3.5 },
        options: { wait_for_model: true },
      }),
    })

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer())
      return buffer
    }

    const errorText = await res.text()
    if (res.status === 503 || errorText.includes('loading')) {
      console.log(`HF model loading, waiting ${delay}ms... (attempt ${attempt + 1})`)
      await sleep(delay)
      delay = Math.min(delay * 2, 60000)
      continue
    }

    throw new Error(`HuggingFace API error ${res.status}: ${errorText}`)
  }

  throw new Error('HuggingFace: max retries exceeded')
}

export function buildWhiteBgPrompt(analysis: GeminiAnalysis): string {
  return `Professional product photography of ${analysis.material} door handle with ${analysis.finish} finish, \
pure white background, studio lighting, ${analysis.suggestedLighting} light, razor sharp details, \
photorealistic, 8k quality, product catalog photo, no shadows on background, centered composition`
}

export function buildLifestylePrompt(analysis: GeminiAnalysis, environment: string): string {
  return `Photorealistic ${analysis.material} ${analysis.style} door handle with ${analysis.finish} finish \
mounted on ${environment}, professional interior photography, perfect lighting, \
ultra detailed, 8k, architectural photography style, realistic depth of field`
}

export function buildAdCampaignPrompt(analysis: GeminiAnalysis, platform: string): string {
  return `Professional advertising photo of ${analysis.material} door handle, ${analysis.style} design, \
${analysis.finish} finish, elegant gradient background, luxury brand aesthetic, \
high-end product advertisement, ${platform} ad format, cinematic lighting, \
negative space for text overlay, ultra HD quality`
}

export function buildCatalogPrompt(analysis: GeminiAnalysis): string {
  return `${analysis.material} door handle product catalog image, \
pure white background, perfectly centered, professional studio photography, \
sharp focus, color accurate, e-commerce ready, printable quality`
}
