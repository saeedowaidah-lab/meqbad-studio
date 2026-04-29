export type ProductStatus = 'analyzing' | 'generating' | 'complete' | 'error'
export type ProductMaterial = 'brass' | 'chrome' | 'matte_black' | 'gold' | 'stainless_steel' | 'other'
export type ProductStyle = 'modern' | 'classic' | 'industrial' | 'luxury' | 'minimalist' | 'other'
export type ProductFinish = 'polished' | 'brushed' | 'painted' | 'other'
export type SuggestedLighting = 'warm' | 'cool' | 'neutral' | 'dramatic'

export interface GeminiAnalysis {
  material: ProductMaterial
  style: ProductStyle
  finish: ProductFinish
  estimatedDimensions: string
  suggestedLighting: SuggestedLighting
  colorPalette: string[]
  qualityScore: number
  recommendations: string[]
  rawDescription: string
}

export interface Product {
  id: string
  name: string
  material: string
  style: string
  finish: string
  originalImageUrl: string
  geminiAnalysis: GeminiAnalysis | null
  status: ProductStatus
  createdAt: string
  updatedAt: string
  imagesCount: number
  contentCount: number
}

export interface BrandKit {
  storeName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  tone: 'luxury' | 'professional' | 'friendly' | 'technical'
  sallaStoreUrl: string
}
