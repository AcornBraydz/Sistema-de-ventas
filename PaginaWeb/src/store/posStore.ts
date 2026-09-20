import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  isBulk?: boolean;
  imageUrl?: string;
  minStock?: number;
}

export interface CartItem extends Product {
  quantity: number;
  weight?: number; // Used if isBulk is true
}

export interface HoldAccount {
  id: string;
  timestamp: number;
  items: CartItem[];
}

export interface Category {
  id: number;
  name: string;
}

interface PosState {
  // Cart State
  cart: CartItem[];
  addItem: (product: Product, weight?: number) => void;
  removeItem: (sku: string) => void;
  updateItemQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  
  // Hold Accounts
  holdAccounts: HoldAccount[];
  holdCurrentCart: () => void;
  restoreHoldAccount: (id: string) => void;
  
  // Inventory
  products: Product[];
  fetchProducts: () => Promise<void>;
  
  // Categories
  categories: Category[];
  fetchCategories: () => Promise<void>;
}

export const usePosStore = create<PosState>((set) => ({
  cart: [],
  products: [],
  categories: [],
  holdAccounts: [],

  fetchProducts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        // Format to map DB fields to TS Interface
        const formatted = data.map((item: any) => ({
          ...item,
          isBulk: item.is_bulk === 1,
          imageUrl: item.image_url ? `${API_BASE_URL}${item.image_url}` : undefined
        }));
        set({ products: formatted });
      }
    } catch (error) {
      console.error('Error fetching products from local DB:', error);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        set({ categories: data });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  addItem: (product, weight) => set((state) => {
    const existing = state.cart.find((item) => item.sku === product.sku);
    if (existing && !product.isBulk) {
      return {
        cart: state.cart.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return {
      cart: [...state.cart, { ...product, quantity: product.isBulk ? 1 : 1, weight }],
    };
  }),

  removeItem: (sku) => set((state) => ({
    cart: state.cart.filter((item) => item.sku !== sku),
  })),

  updateItemQuantity: (sku, quantity) => set((state) => ({
    cart: state.cart.map((item) => 
      item.sku === sku ? { ...item, quantity: Math.max(1, quantity) } : item
    ),
  })),

  clearCart: () => set({ cart: [] }),

  holdCurrentCart: () => set((state) => {
    if (state.cart.length === 0) return state;
    const newHold: HoldAccount = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      items: [...state.cart],
    };
    return {
      holdAccounts: [...state.holdAccounts, newHold],
      cart: [],
    };
  }),

  restoreHoldAccount: (id) => set((state) => {
    const hold = state.holdAccounts.find(h => h.id === id);
    if (!hold) return state;
    return {
      cart: hold.items,
      holdAccounts: state.holdAccounts.filter(h => h.id !== id)
    };
  })
}));
