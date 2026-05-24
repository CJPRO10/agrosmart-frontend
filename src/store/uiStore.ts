// ------- Store de UI (sidebar, notificaciones, offline) -------
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  isOnline: boolean
  notificacionesCount: number
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setOnline: (online: boolean) => void
  setNotificacionesCount: (count: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  isOnline: true,
  notificacionesCount: 0,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setOnline: (isOnline) => set({ isOnline }),
  setNotificacionesCount: (notificacionesCount) => set({ notificacionesCount }),
}))