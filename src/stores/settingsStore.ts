import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  businessName: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
  lowStockAlert: number;
  autoPrint: boolean;
  thermalPrintWidth: number;
}

interface SettingsState extends Settings {
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  businessName: 'FurniCraft Furniture',
  receiptHeader: 'Thank you for shopping with FurniCraft!',
  receiptFooter: 'Visit us at www.furnicraft.com',
  currency: 'PKR',
  lowStockAlert: 10,
  autoPrint: true,
  thermalPrintWidth: 80,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSetting: (key, value) =>
        set((state) => ({ ...state, [key]: value })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'furnicraft-settings',
    }
  )
);
