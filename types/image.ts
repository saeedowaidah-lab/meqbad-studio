export type ImageType = 'white_bg' | 'lifestyle' | 'ad_campaign' | 'catalog'
export type AdPlatform =
  | 'instagram_post'
  | 'instagram_story'
  | 'snapchat'
  | 'twitter'
  | 'facebook'
  | 'google_large'
  | 'google_medium'
  | 'tiktok'

export type LifestyleEnvironment =
  | 'luxury_wood'
  | 'modern_glass'
  | 'industrial_metal'
  | 'hotel_marble'
  | 'white_interior'
  | 'custom'

export interface SallaSpec {
  label: string
  width: number
  height: number
  maxSizeKB: number
}

export interface AdSpec {
  platform: AdPlatform
  label: string
  labelAr: string
  width: number
  height: number
}

export interface ProductImage {
  id: string
  productId: string
  type: ImageType
  platform?: AdPlatform
  environment?: string
  storagePath: string
  url: string
  dimensions: string
  fileSizeKB: number
  qualityScore: number
  qualityIssues: string[]
  createdAt: string
}

export interface QualityCheckResult {
  score: number
  issues: string[]
  passed: boolean
}

export interface GenerationJob {
  id: string
  productId: string
  type: ImageType
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  currentStep: number
  steps: GenerationStep[]
  result?: ProductImage
  error?: string
}

export interface GenerationStep {
  label: string
  labelAr: string
  status: 'pending' | 'active' | 'done' | 'error'
}
