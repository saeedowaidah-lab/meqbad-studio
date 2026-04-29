import JSZip from 'jszip'
import type { ProductImage } from '@/types/image'
import type { ProductContent } from '@/types/content'

async function fetchImageAsBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  return res.arrayBuffer()
}

export async function exportSallaPackage(
  images: ProductImage[],
  content: ProductContent,
  productName: string
): Promise<Blob> {
  const zip = new JSZip()
  const sallaFolder = zip.folder('salla-ready')!
  const contentFolder = zip.folder('content')!

  // Images
  const whiteBg = images.filter(i => i.type === 'white_bg')
  for (let idx = 0; idx < whiteBg.length; idx++) {
    const img = whiteBg[idx]
    const label = idx === 0 ? `main-product-${img.dimensions}` : `additional-${idx}-${img.dimensions}`
    const buf = await fetchImageAsBuffer(img.url)
    sallaFolder.file(`${label}.jpg`, buf)
  }

  // Content files
  const arContent = buildTextContent(content.ar, 'ar')
  const enContent = buildTextContent(content.en, 'en')
  contentFolder.file('arabic-content.txt', arContent)
  contentFolder.file('english-content.txt', enContent)
  contentFolder.file('seo-keywords.txt', (content.ar.seo_keywords ?? ''))
  contentFolder.file('meta-description.txt', content.ar.meta_desc ?? '')

  if (content.technicalSheet) {
    const techSheet = formatTechnicalSheet(content.technicalSheet as unknown as Record<string, string | string[]>)
    contentFolder.file('technical-sheet.txt', techSheet)
  }

  // README
  sallaFolder.file('README-salla-upload-guide.txt', SALLA_GUIDE)

  return zip.generateAsync({ type: 'blob' })
}

export async function exportCampaignPackage(
  images: ProductImage[],
  content: ProductContent
): Promise<Blob> {
  const zip = new JSZip()
  const campaigns = zip.folder('campaigns')!

  const adImages = images.filter(i => i.type === 'ad_campaign')
  const platformFolders: Record<string, JSZip> = {}

  for (const img of adImages) {
    const platform = img.platform ?? 'general'
    if (!platformFolders[platform]) {
      platformFolders[platform] = campaigns.folder(platform)!
    }
    const buf = await fetchImageAsBuffer(img.url)
    platformFolders[platform].file(`${platform}-${img.dimensions}.jpg`, buf)
  }

  const contentFolder = zip.folder('content')!
  contentFolder.file('ad-copy-arabic.txt', buildAdContent(content.ar))
  contentFolder.file('ad-copy-english.txt', buildAdContent(content.en))

  return zip.generateAsync({ type: 'blob' })
}

function buildTextContent(content: Partial<Record<string, string>>, lang: string): string {
  return `
=== ${lang === 'ar' ? 'المحتوى العربي' : 'English Content'} ===

${lang === 'ar' ? 'العنوان' : 'Title'}:
${content.title ?? ''}

${lang === 'ar' ? 'الوصف القصير' : 'Short Description'}:
${content.short_desc ?? ''}

${lang === 'ar' ? 'الوصف التفصيلي' : 'Long Description'}:
${content.long_desc ?? ''}

${lang === 'ar' ? 'نقاط المميزات' : 'Feature Bullets'}:
${content.bullets ?? ''}

${lang === 'ar' ? 'ميتا ديسكريبشن' : 'Meta Description'}:
${content.meta_desc ?? ''}
`.trim()
}

function buildAdContent(content: Partial<Record<string, string>>): string {
  return `
=== Instagram ===
${content.instagram ?? ''}

=== Snapchat ===
${content.snapchat ?? ''}

=== Facebook Ad ===
${content.facebook_ad ?? ''}

=== WhatsApp Message ===
${content.whatsapp ?? ''}
`.trim()
}

function formatTechnicalSheet(sheet: Record<string, string | string[]>): string {
  return Object.entries(sheet)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n')
}

const SALLA_GUIDE = `
دليل رفع الصور على منصة سلة
================================

1. سجّل دخولك على dashboard.salla.sa
2. انتقل إلى المنتجات ← إضافة منتج
3. في قسم الصور:
   - ارفع main-product-1200x1200.jpg كصورة رئيسية
   - ارفع additional-*.jpg كصور إضافية
4. في قسم البانرات:
   - ارفع banner-desktop-1920x600.jpg للديسكتوب
   - ارفع banner-mobile-768x300.jpg للموبايل
5. انسخ المحتوى من مجلد /content
6. احفظ المنتج

ملاحظة: جميع الصور مضغوطة وبالمواصفات الصحيحة لسلة.
`.trim()
