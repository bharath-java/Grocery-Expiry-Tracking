import { create } from 'zustand';

interface UIState {
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  
  isAIOpen: boolean;
  openAIModal: () => void;
  closeAIModal: () => void;
  
  activeTab: 'home' | 'categories' | 'reminders' | 'profile' | 'admin' | null;
  setActiveTab: (tab: 'home' | 'categories' | 'reminders' | 'profile' | 'admin' | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddModalOpen: false,
  openAddModal: () => set({ isAddModalOpen: true }),
  closeAddModal: () => set({ isAddModalOpen: false }),

  isAIOpen: false,
  openAIModal: () => set({ isAIOpen: true }),
  closeAIModal: () => set({ isAIOpen: false }),

  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab })
}));
