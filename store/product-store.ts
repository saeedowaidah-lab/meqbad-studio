import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/product'
import type { ProductImage, GenerationJob } from '@/types/image'
import type { ProductContent } from '@/types/content'

interface ProductStore {
  products: Product[]
  currentProductId: string | null
  images: Record<string, ProductImage[]>
  content: Record<string, ProductContent>
  jobs: GenerationJob[]

  setCurrentProduct: (id: string) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void

  addImage: (productId: string, image: ProductImage) => void
  setImages: (productId: string, images: ProductImage[]) => void
  deleteImage: (productId: string, imageId: string) => void

  setContent: (productId: string, content: ProductContent) => void
  updateContentField: (productId: string, lang: 'ar' | 'en', type: string, value: string) => void

  addJob: (job: GenerationJob) => void
  updateJob: (jobId: string, updates: Partial<GenerationJob>) => void
  removeJob: (jobId: string) => void

  getCurrentProduct: () => Product | undefined
  getProductImages: (productId: string) => ProductImage[]
  getProductContent: (productId: string) => ProductContent | undefined
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      currentProductId: null,
      images: {},
      content: {},
      jobs: [],

      setCurrentProduct: (id) => set({ currentProductId: id }),

      addProduct: (product) =>
        set((s) => ({ products: [product, ...s.products] })),

      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((s) => {
          const { [id]: _images, ...restImages } = s.images
          const { [id]: _content, ...restContent } = s.content
          return {
            products: s.products.filter((p) => p.id !== id),
            images: restImages,
            content: restContent,
          }
        }),

      addImage: (productId, image) =>
        set((s) => ({
          images: {
            ...s.images,
            [productId]: [image, ...(s.images[productId] ?? [])],
          },
        })),

      setImages: (productId, images) =>
        set((s) => ({ images: { ...s.images, [productId]: images } })),

      deleteImage: (productId, imageId) =>
        set((s) => ({
          images: {
            ...s.images,
            [productId]: (s.images[productId] ?? []).filter((i) => i.id !== imageId),
          },
        })),

      setContent: (productId, content) =>
        set((s) => ({ content: { ...s.content, [productId]: content } })),

      updateContentField: (productId, lang, type, value) =>
        set((s) => {
          const existing = s.content[productId] ?? { ar: {}, en: {}, technicalSheet: {} as never }
          return {
            content: {
              ...s.content,
              [productId]: {
                ...existing,
                [lang]: { ...existing[lang], [type]: value },
              },
            },
          }
        }),

      addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),

      updateJob: (jobId, updates) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
        })),

      removeJob: (jobId) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== jobId) })),

      getCurrentProduct: () => {
        const { products, currentProductId } = get()
        return products.find((p) => p.id === currentProductId)
      },

      getProductImages: (productId) => get().images[productId] ?? [],

      getProductContent: (productId) => get().content[productId],
    }),
    { name: 'meqbad-studio-products' }
  )
)
