import { create } from 'zustand'

interface AdminAuthStore {
  token: string
  login: (token: string) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthStore>((set) => ({
  token: (() => {
    try { return localStorage.getItem('admin_token') ?? '' } catch { return '' }
  })(),

  login: (token) => {
    try { localStorage.setItem('admin_token', token) } catch { /* ignore */ }
    set({ token })
  },

  logout: () => {
    try { localStorage.removeItem('admin_token') } catch { /* ignore */ }
    set({ token: '' })
  },
}))