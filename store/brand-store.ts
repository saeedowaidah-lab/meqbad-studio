import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BrandKit } from '@/types/product'

interface BrandStore {
  brand: BrandKit
  updateBrand: (updates: Partial<BrandKit>) => void
}

const DEFAULT_BRAND: BrandKit = {
  storeName: 'مقبض',
  logoUrl: null,
  primaryColor: '#1E293B',
  secondaryColor: '#F59E0B',
  tone: 'professional',
  sallaStoreUrl: '',
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      brand: DEFAULT_BRAND,
      updateBrand: (updates) => set((s) => ({ brand: { ...s.brand, ...updates } })),
    }),
    { name: 'meqbad-studio-brand' }
  )
)
