import type { SallaSpec, AdSpec, AdPlatform } from '@/types/image'

export const SALLA_SPECS: Record<string, SallaSpec> = {
  main: { label: 'الصورة الرئيسية', width: 1200, height: 1200, maxSizeKB: 2048 },
  additional: { label: 'صور إضافية', width: 800, height: 800, maxSizeKB: 2048 },
  banner_desktop: { label: 'بانر الرئيسية (ديسكتوب)', width: 1920, height: 600, maxSizeKB: 2048 },
  banner_mobile: { label: 'بانر الرئيسية (موبايل)', width: 768, height: 300, maxSizeKB: 2048 },
  category: { label: 'بانر التصنيف', width: 1200, height: 400, maxSizeKB: 2048 },
}

export const AD_SPECS: AdSpec[] = [
  { platform: 'instagram_post', label: 'Instagram Post', labelAr: 'إنستقرام بوست', width: 1080, height: 1080 },
  { platform: 'instagram_story', label: 'Instagram Story', labelAr: 'إنستقرام ستوري', width: 1080, height: 1920 },
  { platform: 'snapchat', label: 'Snapchat Ad', labelAr: 'سناب شات', width: 1080, height: 1920 },
  { platform: 'twitter', label: 'Twitter/X Post', labelAr: 'تويتر/X', width: 1200, height: 675 },
  { platform: 'facebook', label: 'Facebook Ad', labelAr: 'فيسبوك', width: 1200, height: 628 },
  { platform: 'google_large', label: 'Google Display Large', labelAr: 'جوجل كبير', width: 728, height: 90 },
  { platform: 'google_medium', label: 'Google Display Medium', labelAr: 'جوجل متوسط', width: 300, height: 250 },
  { platform: 'tiktok', label: 'TikTok Thumbnail', labelAr: 'تيك توك', width: 1080, height: 1920 },
]

export const LIFESTYLE_ENVIRONMENTS = [
  { id: 'luxury_wood', labelAr: 'باب خشبي فاخر — إضاءة دافئة', prompt: 'luxury wooden door with warm golden lighting, elegant interior' },
  { id: 'modern_glass', labelAr: 'باب زجاجي حديث — إضاءة باردة', prompt: 'modern glass door with cool blue lighting, contemporary office' },
  { id: 'industrial_metal', labelAr: 'باب معدني صناعي — أسود', prompt: 'black metal industrial door, urban loft style' },
  { id: 'hotel_marble', labelAr: 'مدخل فندقي — جدار رخامي', prompt: 'hotel entrance with marble wall, luxury hospitality setting' },
  { id: 'white_interior', labelAr: 'باب داخلي أبيض — حديث', prompt: 'white modern interior door, clean minimalist home' },
]

export function getAdSpec(platform: AdPlatform): AdSpec {
  return AD_SPECS.find(s => s.platform === platform) ?? AD_SPECS[0]
}
