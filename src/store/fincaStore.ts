// ─── Store de Finca activa ────────────────────────────────────────────────────
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Finca } from '@/types'

interface FincaState {
  fincas: Finca[]
  fincaActiva: Finca | null
  setFincas: (fincas: Finca[]) => void
  setFincaActiva: (finca: Finca) => void
  clearFincas: () => void
}

export const useFincaStore = create<FincaState>()(
  persist(
    (set) => ({
      fincas: [],
      fincaActiva: null,
      setFincas: (fincas) => set({ fincas }),
      setFincaActiva: (fincaActiva) => set({ fincaActiva }),
      clearFincas: () => set({ fincas: [], fincaActiva: null }),
    }),
    { name: 'agro_finca' }
  )
)