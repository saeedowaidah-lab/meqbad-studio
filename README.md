# مقبض ستوديو — AI Product Studio

استوديو AI احترافي لتوليد صور وتسويق مقابض الأبواب على منصة سلة.

## البدء السريع

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد المتغيرات البيئية
```bash
cp .env.example .env.local
```
ثم أضف مفاتيح API في `.env.local`

### 3. تشغيل خدمة Rembg (Docker)
```bash
docker-compose up rembg -d
```

### 4. تشغيل التطبيق
```bash
npm run dev
```
افتح http://localhost:3000

---

## الميزات

| الميزة | الوصف |
|--------|-------|
| 🖼️ خلفية بيضاء | 3 تنويعات احترافية بـ FLUX.1-dev + Rembg |
| 🏠 صور واقعية | 5 بيئات مختلفة + بيئة مخصصة |
| 📣 حملات إعلانية | 8 منصات: إنستقرام، سناب، تويتر، فيسبوك... |
| 📖 كتالوج | A4 بدقة 300dpi جاهز للطباعة |
| ✍️ محتوى | عربي + إنجليزي + تقني + SEO بـ Claude Haiku |
| 💬 محرر ذكي | تعديل الصور بالكلام العربي أو الإنجليزي |
| 📦 تصدير | حزمة سلة + حزمة الحملات |

## المكدس التقني

- **Next.js 14** — App Router + TypeScript
- **Tailwind CSS** — RTL + Dark mode
- **Zustand** — إدارة الحالة
- **Supabase** — قاعدة البيانات + تخزين الصور
- **Gemini 2.5 Flash** — تحليل الصور وفحص الجودة
- **FLUX.1-dev** (Hugging Face) — توليد الصور (مجاني)
- **Rembg** (Python/Docker) — إزالة الخلفية (مجاني)
- **Claude Haiku** — توليد المحتوى

## إعداد Supabase

1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com)
2. شغّل `supabase/schema.sql` في SQL Editor
3. أضف URL و Anon Key في `.env.local`

## البنية
```
app/
  dashboard/          ← لوحة التحكم
  studio/upload/      ← رفع وتحليل المنتج
  studio/[id]/images/ ← استوديو الصور (4 تبويبات)
  studio/[id]/content/ ← استوديو المحتوى
  studio/[id]/chat/   ← المحرر الذكي
  studio/[id]/export/ ← التصدير
  history/            ← سجل المشاريع
  settings/brand/     ← هوية المتجر
  settings/api-keys/  ← مفاتيح API
rembg-service/        ← Python FastAPI microservice
supabase/schema.sql   ← مخطط قاعدة البيانات
docker-compose.yml    ← Next.js + Rembg
```
