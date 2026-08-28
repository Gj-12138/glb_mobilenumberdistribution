import { create } from 'zustand'
import type { UserInfo } from '@/types'

type PageKey = 'data-manage' | 'my-data' | 'account' | 'log' | 'settings'

interface AuthState {
  token: string | null
  user: UserInfo | null
  setAuth: (token: string, user: UserInfo) => void
  logout: () => void
}

interface AppState {
  currentPage: PageKey
  setCurrentPage: (page: PageKey) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('phone_data_token') : null,
  user: null,
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('phone_data_token', token)
    }
    set({ token, user })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phone_data_token')
    }
    set({ token: null, user: null })
  },
}))

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'data-manage',
  setCurrentPage: (page) => set({ currentPage: page }),
}))
