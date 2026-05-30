import { create } from 'zustand';
import api from '../lib/api';

export interface GroceryItem {
  _id: string;
  itemName: string;
  image: string;
  brand?: string;
  category: 'Dairy & Eggs' | 'Fruits & Vegetables' | 'Bakery' | 'Meat & Fish' | 'Pantry' | 'Beverages' | 'Snacks' | 'Others';
  quantity: string;
  purchaseDate: string;
  expiryDate: string;
  notes?: string;
  status: 'Expired' | 'Expiring Soon' | 'Fresh';
  archived: boolean;
  createdAt: string;
}

interface GroceryState {
  groceries: GroceryItem[];
  archivedGroceries: GroceryItem[];
  totalCount: number;
  loading: boolean;
  
  // Expiry overview counters
  expiredCount: number;
  expiringSoonCount: number;
  goodCount: number;
  
  fetchGroceries: (filters?: {
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
    archived?: boolean;
  }) => Promise<void>;
  
  addGrocery: (formData: FormData) => Promise<boolean>;
  updateGrocery: (id: string, formData: FormData) => Promise<boolean>;
  deleteGrocery: (id: string) => Promise<boolean>;
  archiveGrocery: (id: string) => Promise<boolean>;
  restoreGrocery: (id: string) => Promise<boolean>;
  
  // Helper to recompute local metrics on changes
  recalculateMetrics: (list: GroceryItem[]) => void;
}

export const useGroceryStore = create<GroceryState>((set, get) => ({
  groceries: [],
  archivedGroceries: [],
  totalCount: 0,
  loading: false,
  expiredCount: 0,
  expiringSoonCount: 0,
  goodCount: 0,

  recalculateMetrics: (list) => {
    let expired = 0;
    let soon = 0;
    let fresh = 0;

    list.forEach(item => {
      if (item.status === 'Expired') expired++;
      else if (item.status === 'Expiring Soon') soon++;
      else if (item.status === 'Fresh') fresh++;
    });

    set({
      expiredCount: expired,
      expiringSoonCount: soon,
      goodCount: fresh
    });
  },

  fetchGroceries: async (filters = {}) => {
    set({ loading: true });
    try {
      const isArchived = filters.archived || false;
      const response = await api.get('/groceries', { 
        params: { ...filters, limit: 150 } 
      });

      const list = response.data.data.groceries || [];
      if (isArchived) {
        set({ archivedGroceries: list, loading: false });
      } else {
        set({ 
          groceries: list, 
          totalCount: response.data.data.totalCount || 0,
          loading: false 
        });
        // Recalculate expired/expiring soon/good status metrics
        get().recalculateMetrics(list);
      }
    } catch (err) {
      console.error('Error fetching groceries:', err);
      set({ loading: false });
    }
  },

  addGrocery: async (formData) => {
    set({ loading: true });
    try {
      await api.post('/groceries', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await get().fetchGroceries();
      return true;
    } catch (err) {
      console.error('Error adding grocery:', err);
      set({ loading: false });
      return false;
    }
  },

  updateGrocery: async (id, formData) => {
    set({ loading: true });
    try {
      await api.put(`/groceries/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await get().fetchGroceries();
      return true;
    } catch (err) {
      console.error('Error updating grocery:', err);
      set({ loading: false });
      return false;
    }
  },

  deleteGrocery: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/groceries/${id}`);
      await get().fetchGroceries();
      return true;
    } catch (err) {
      console.error('Error deleting grocery:', err);
      set({ loading: false });
      return false;
    }
  },

  archiveGrocery: async (id) => {
    set({ loading: true });
    try {
      await api.put(`/groceries/${id}/archive`);
      await get().fetchGroceries();
      return true;
    } catch (err) {
      console.error('Error archiving grocery:', err);
      set({ loading: false });
      return false;
    }
  },

  restoreGrocery: async (id) => {
    set({ loading: true });
    try {
      await api.put(`/groceries/${id}/restore`);
      // Refresh both active and archived lists
      await get().fetchGroceries();
      await get().fetchGroceries({ archived: true });
      return true;
    } catch (err) {
      console.error('Error restoring grocery:', err);
      set({ loading: false });
      return false;
    }
  }
}));
