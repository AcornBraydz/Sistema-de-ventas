import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL } from '../config';

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'cashier';
  hourly_rate?: number;
}

export interface LicenseInfo {
  createdAt: number;
  expiresAt: number;
  token: string;
}

interface AuthState {
  user: User | null;
  requireSetup: boolean;
  isCheckingStatus: boolean;
  licenseValid: boolean;
  licenseInfo: LicenseInfo | null;
  checkSystemStatus: () => Promise<void>;
  checkLicense: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      requireSetup: false,
      isCheckingStatus: true,
      licenseValid: true,
      licenseInfo: null,
      checkSystemStatus: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/system/status`);
          if (res.ok) {
            const data = await res.json();
            set({ requireSetup: data.requireSetup });
          }
        } catch (error) {
          console.error('Error checking system status:', error);
        }
        await get().checkLicense();
        set({ isCheckingStatus: false });
      },
      checkLicense: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/license/status`);
          if (res.ok) {
            const data = await res.json();
            set({ 
              licenseValid: data.valid,
              licenseInfo: data.valid ? {
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                token: data.token
              } : null
            });
          } else {
            set({ licenseValid: false, licenseInfo: null });
          }
        } catch (error) {
          set({ licenseValid: false, licenseInfo: null });
        }
      },
      login: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user });
            return true;
          }
        } catch (error) {
          console.error('Error in login:', error);
        }
        return false;
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'pos-auth-storage',
    }
  )
);
