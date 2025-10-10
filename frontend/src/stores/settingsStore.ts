import { defineStore } from 'pinia';
import { getSettings as apiGetSettings, updateSettingsApi, type SettingsDto } from '../services/api';
import { setCssVar } from 'quasar';
import { useAuthStore } from './authStore';

export interface SettingsState {
  featuredLayout: 1 | 2 | 4;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  infoText: string;
  logoUrl: string;
  backgroundUrl: string;
}

const DEFAULTS: SettingsState = {
  featuredLayout: 2,
  colors: {
    primary: '#1976d2',
    secondary: '#26a69a',
    accent: '#9c27b0',
  },
  infoText: '',
  logoUrl: '',
  backgroundUrl: '',
};

function applyColors(colors: SettingsDto['colors']) {
  for (const [k, v] of Object.entries(colors)) {
    if (typeof v === 'string' && v.trim()) setCssVar(k, v);
  }
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({ ...DEFAULTS }),
  actions: {
    async load() {
      const data = await apiGetSettings();
      this.featuredLayout = data.featuredLayout;
      this.colors = { ...this.colors, ...data.colors };
      if (typeof data.infoText === 'string') this.infoText = data.infoText;
      if (typeof data.logoUrl === 'string') this.logoUrl = data.logoUrl;
      if (typeof data.backgroundUrl === 'string') this.backgroundUrl = data.backgroundUrl;
      applyColors(this.colors);
    },
    async update(payload: Partial<SettingsDto>) {
      const token = useAuthStore().token;
      const data = await updateSettingsApi(payload, token);
      this.featuredLayout = data.featuredLayout ?? this.featuredLayout;
      this.colors = { ...this.colors, ...(data.colors || {}) };
      if (typeof data.infoText === 'string') this.infoText = data.infoText;
      if (typeof data.logoUrl === 'string') this.logoUrl = data.logoUrl;
      if (typeof data.backgroundUrl === 'string') this.backgroundUrl = data.backgroundUrl;
      applyColors(this.colors);
    },
    applyColors() { applyColors(this.colors); },
  },
});
