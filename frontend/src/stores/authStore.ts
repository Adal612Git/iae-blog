import { defineStore } from 'pinia';
import { login as apiLogin } from '../services/api.js';

interface User {
  [key: string]: unknown;
}

interface AuthState {
  token: string;
  user: User | null;
  loading: boolean;
  error: string;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('auth_token') || '',
    user: null,
    loading: false,
    error: '',
  }),
  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = '';
      try {
        const data = await apiLogin({ email, password });
        const token = (data as { token?: string }).token;
        if (token) {
          this.token = token;
          localStorage.setItem('auth_token', token);
        } else {
          this.error = 'Respuesta inválida de login';
        }
      } catch (e: unknown) {
        let message = 'Error al iniciar sesión';
        if (typeof e === 'object' && e && 'response' in e) {
          const r = (e as { response?: { data?: { message?: unknown } } }).response;
          const m = r?.data?.message;
          message = typeof m === 'string' ? m : message;
        } else if (e instanceof Error) {
          message = e.message;
        }
        this.error = message;
        throw e;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('auth_token');
    },
  },
});
