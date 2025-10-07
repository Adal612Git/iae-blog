import { defineStore } from 'pinia';
import { login as apiLogin, register as apiRegister } from '../services/api';

interface AuthUser {
  id: string;
  role?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string;
  user: AuthUser | null;
  loading: boolean;
  error: string;
}

const globalScope = globalThis as unknown as {
  atob?: (data: string) => string;
  Buffer?: { from(input: string, encoding?: string): { toString(encoding?: string): string } };
};

function decodeUserFromToken(token?: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadPart = parts[1];
    if (!payloadPart) return null;
    const safePart = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = safePart.padEnd(safePart.length + ((4 - (safePart.length % 4)) % 4), '=');
    let decoded = '';
    if (typeof globalScope.atob === 'function') {
      decoded = globalScope.atob(padded);
    } else if (globalScope.Buffer) {
      decoded = globalScope.Buffer.from(padded, 'base64').toString('utf-8');
    } else {
      return null;
    }
    const payload = JSON.parse(decoded) as Record<string, unknown>;
    const rawIdCandidate = (payload['id'] ?? payload['_id'] ?? payload['sub']);
    const id = typeof rawIdCandidate === 'string' || typeof rawIdCandidate === 'number' ? String(rawIdCandidate) : '';
    const roleValue = payload['role'];
    const role = typeof roleValue === 'string' ? roleValue : undefined;
    if (!id) return null;
    return { id, ...(role ? { role } : {}) };
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    const storedToken =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('auth_token')
        : '';
    const token = storedToken || '';
    return {
      token,
      user: decodeUserFromToken(token),
      loading: false,
      error: '',
    };
  },
  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = '';
      try {
        const { token } = await apiLogin(email, password);
        if (token) {
          this.token = token;
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('auth_token', token);
          }
          this.user = decodeUserFromToken(token);
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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('auth_token');
      }
    },
    async register(email: string, password: string) {
      this.loading = true;
      this.error = '';
      try {
        const { token } = await apiRegister(email, password);
        if (token) {
          this.token = token;
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('auth_token', token);
          }
          this.user = decodeUserFromToken(token);
        } else {
          this.error = 'Registro completado pero no se recibió token';
        }
      } catch (e: unknown) {
        let message = 'No se pudo registrar';
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
  },
});
