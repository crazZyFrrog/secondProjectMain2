import { create } from 'zustand'

interface ForbiddenState {
  message: string | null
  setForbidden: (message: string | null) => void
}

export const useForbiddenStore = create<ForbiddenState>((set) => ({
  message: null,
  setForbidden: (message) => set({ message })
}))
