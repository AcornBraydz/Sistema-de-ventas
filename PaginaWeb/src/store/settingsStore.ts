import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export interface SystemSettings {
  // General
  branch_name: string;
  branch_id: string;
  address: string;
  phone: string;
  currency: string;
  timezone: string;
  tax_id: string;
  store_logo?: string;

  // Bank Info for Transfers (SPEI / Abonos)
  bank_name?: string;
  bank_beneficiary?: string;
  bank_clabe?: string;

  // POS
  digital_ticket: boolean;
  auto_logout: boolean;
  allow_credit_in_pos: boolean;
  confirm_before_charge: boolean;
  sound_effects: boolean;

  // Security
  require_nip_for_delete_item: boolean;
  require_nip_for_shift: boolean;
  require_nip_for_discounts: boolean;
  nip_block_time: string;
  logout_after_each_sale: boolean;

  // Devices - Printer
  printer_type: string;
  printer_name: string;
  paper_width: string;
  auto_open_cash_drawer: boolean;
  auto_cut_paper: boolean;

  // Devices - Scanner
  scanner_mode: string;
  scanner_auto_enter: boolean;
  scanner_beep: boolean;

  // Devices - Scale
  scale_model: string;
  scale_port: string;
  scale_auto_tare: boolean;

  // Payroll & Rates
  default_hourly_rate?: number;
}

export const defaultSettings: SystemSettings = {
  branch_name: 'Drip POS',
  branch_id: 'SUC-001',
  address: '',
  phone: '',
  currency: 'MXN - Peso Mexicano',
  timezone: 'America/Mexico_City (GMT-6)',
  tax_id: '',
  store_logo: '',

  bank_name: '',
  bank_beneficiary: '',
  bank_clabe: '',

  digital_ticket: true,
  auto_logout: true,
  allow_credit_in_pos: true,
  confirm_before_charge: false,
  sound_effects: true,

  require_nip_for_delete_item: true,
  require_nip_for_shift: true,
  require_nip_for_discounts: true,
  nip_block_time: '5 minutos',
  logout_after_each_sale: false,

  printer_type: 'Térmica USB / Windows',
  printer_name: '',
  paper_width: '80mm',
  auto_open_cash_drawer: true,
  auto_cut_paper: true,

  scanner_mode: 'USB Emulación Teclado (HID)',
  scanner_auto_enter: true,
  scanner_beep: true,

  scale_model: 'Torrey L-EQ / LPCR',
  scale_port: 'COM1',
  scale_auto_tare: true,
  default_hourly_rate: 50.0
};

interface SettingsState {
  settings: SystemSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: SystemSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  isLoading: true,
  fetchSettings: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${API_BASE_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        set({ settings: { ...defaultSettings, ...data }, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ isLoading: false });
    }
  },
  updateSettings: async (newSettings) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        set({ settings: newSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }
}));
