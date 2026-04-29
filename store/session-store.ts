import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ApiKeys {
  gemini: string
  huggingFace: string
  anthropic: string
  canva: string
  supabaseUrl: string
  supabaseAnonKey: string
}

interface SessionStore {
  apiKeys: Partial<ApiKeys>
  language: 'ar' | 'en'
  darkMode: boolean
  dailyUsage: { date: string; count: number }

  setApiKey: (key: keyof ApiKeys, value: string) => void
  setLanguage: (lang: 'ar' | 'en') => void
  setDarkMode: (dark: boolean) => void
  incrementDailyUsage: () => void
  getTodayUsage: () => number
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      language: 'ar',
      darkMode: false,
      dailyUsage: { date: '', count: 0 },

      setApiKey: (key, value) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [key]: value } })),

      setLanguage: (lang) => set({ language: lang }),

      setDarkMode: (dark) => set({ darkMode: dark }),

      incrementDailyUsage: () => {
        const today = new Date().toISOString().split('T')[0]
        set((s) => ({
          dailyUsage: {
            date: today,
            count: s.dailyUsage.date === today ? s.dailyUsage.count + 1 : 1,
          },
        }))
      },

      getTodayUsage: () => {
        const { dailyUsage } = get()
        const today = new Date().toISOString().split('T')[0]
        return dailyUsage.date === today ? dailyUsage.count : 0
      },
    }),
    { name: 'meqbad-studio-session' }
  )
)
