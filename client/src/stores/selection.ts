import { create } from 'zustand'

interface SelectionStore {
  selectedJobId: string | null
  setSelectedJobId: (id: string | null) => void
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedJobId: null,
  setSelectedJobId: (id) => set({ selectedJobId: id }),
}))
