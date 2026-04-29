export type ContentLanguage = 'ar' | 'en'
export type ContentType =
  | 'title'
  | 'short_desc'
  | 'long_desc'
  | 'bullets'
  | 'instagram'
  | 'snapchat'
  | 'facebook_ad'
  | 'whatsapp'
  | 'meta_desc'
  | 'seo_keywords'
  | 'technical_sheet'

export interface ContentPiece {
  id: string
  productId: string
  language: ContentLanguage
  type: ContentType
  content: string
  charCount: number
  createdAt: string
}

export interface TechnicalSheet {
  material: string
  finish: string
  dimensions: string
  weightEstimate: string
  compatibleDoors: string[]
  installationNotes: string
  warrantySuggestion: string
}

export interface ProductContent {
  ar: Partial<Record<ContentType, string>>
  en: Partial<Record<ContentType, string>>
  technicalSheet: TechnicalSheet
}
