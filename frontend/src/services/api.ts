import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
export const api = axios.create({ baseURL });

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type PostSize = 'large' | 'medium' | 'small';

export interface LoginResponse {
  token: string;
}

export interface PostDto {
  _id?: string;
  id?: string | number;
  title: string;
  content: string;
  filePath?: string;
  createdAt?: string;
  urgent?: boolean;
  expiresAt?: string;
  views?: number;
  likes?: number;
  likedBy?: string[];
  image?: string;
  video?: string;
  size?: PostSize;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export interface RegisterResponse {
  token?: string;
  user?: { id: string; email: string; role: string };
  message?: string;
}

export async function register(email: string, password: string): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', { email, password });
  return data;
}

// Admin: crear usuario (requiere token de admin)
export async function adminCreateUser(
  email: string,
  password: string,
  token: string
): Promise<{ user?: { id: string; email: string; role: string }; message?: string }> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.post('/auth/register', { email, password }, { headers });
  return data as { user?: { id: string; email: string; role: string }; message?: string };
}

export async function getPosts(): Promise<PostDto[]> {
  const { data } = await api.get<PostDto[]>('/posts');
  return data;
}

export async function createPost(
  data: { title: string; content: string; size?: PostSize; urgent?: boolean; expiresAt?: string; file?: File },
  token: string
): Promise<PostDto> {
  const headers = { ...authHeaders(token) } as Record<string, string>;

  let body: FormData | { title: string; content: string; size?: PostSize; urgent?: boolean; expiresAt?: string };
  if (data.file) {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('content', data.content);
    if (data.size) fd.append('size', data.size);
    if (typeof data.urgent === 'boolean') fd.append('urgent', String(data.urgent));
    if (data.expiresAt) fd.append('expiresAt', data.expiresAt);
    fd.append('file', data.file);
    body = fd; // No seteamos Content-Type manualmente
  } else {
    body = {
      title: data.title,
      content: data.content,
      ...(data.size ? { size: data.size } : {}),
      ...(typeof data.urgent === 'boolean' ? { urgent: data.urgent } : {}),
      ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
    };
    headers['Content-Type'] = 'application/json';
  }

  const res = await api.post<PostDto>('/posts', body, { headers });
  return res.data;
}

export async function updatePost(
  id: string,
  data: { title?: string; content?: string; size?: PostSize; urgent?: boolean; expiresAt?: string; file?: File },
  token: string
): Promise<PostDto> {
  const headers = { ...authHeaders(token) } as Record<string, string>;

  let body: FormData | { title?: string; content?: string; size?: PostSize; urgent?: boolean; expiresAt?: string };
  if (data.file) {
    const fd = new FormData();
    if (data.title != null) fd.append('title', data.title);
    if (data.content != null) fd.append('content', data.content);
    if (data.size) fd.append('size', data.size);
    if (typeof data.urgent === 'boolean') fd.append('urgent', String(data.urgent));
    if (data.expiresAt) fd.append('expiresAt', data.expiresAt);
    fd.append('file', data.file);
    body = fd;
  } else {
    body = {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.content != null ? { content: data.content } : {}),
      ...(data.size ? { size: data.size } : {}),
      ...(typeof data.urgent === 'boolean' ? { urgent: data.urgent } : {}),
      ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
    };
    headers['Content-Type'] = 'application/json';
  }

  const res = await api.put<PostDto>(`/posts/${id}`, body, { headers });
  return res.data;
}

export async function deletePost(id: string, token: string): Promise<unknown> {
  const { data } = await api.delete(`/posts/${id}`, {
    headers: { ...authHeaders(token) },
  });
  return data as unknown;
}

export default { api, login, getPosts, createPost, updatePost, deletePost };
export async function incrementView(id: string): Promise<{ id: string; views: number }> {
  const { data } = await api.post<{ id: string; views: number }>(`/posts/${id}/view`);
  return data;
}

export async function likePost(
  id: string,
  token?: string
): Promise<{ id: string; likes: number; likedBy?: string[] }> {
  const headers = token ? { ...authHeaders(token) } : {};
  const { data } = await api.post<{ id: string; likes: number; likedBy?: string[] }>(
    `/posts/${id}/like`,
    undefined,
    { headers }
  );
  return data;
}

export { };

// Settings
export interface SettingsDto {
  featuredLayout: 1 | 2 | 4;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  infoText?: string;
  logoUrl?: string;
  backgroundUrl?: string;
}

export async function getSettings(): Promise<SettingsDto> {
  const { data } = await api.get<SettingsDto>('/settings');
  return data;
}

export async function updateSettingsApi(payload: Partial<SettingsDto>, token: string): Promise<SettingsDto> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.put<SettingsDto>('/settings', payload, { headers });
  return data;
}

// Auth helpers
export async function getAuthStatus(): Promise<{ hasAdmin: boolean }> {
  const { data } = await api.get<{ hasAdmin: boolean }>('/auth/status');
  return data;
}

export async function bootstrapAdmin(email: string, password: string, masterKey: string): Promise<{ token: string; user: { id: string; email: string; role: string } }> {
  const { data } = await api.post('/auth/bootstrap', { email, password, masterKey });
  return data as { token: string; user: { id: string; email: string; role: string } };
}

// Media uploads for settings
export async function uploadLogo(file: File, token: string): Promise<SettingsDto> {
  const fd = new FormData();
  fd.append('file', file);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.put<SettingsDto>('/settings/logo', fd, { headers });
  return data;
}

export async function uploadBackground(file: File, token: string): Promise<SettingsDto> {
  const fd = new FormData();
  fd.append('file', file);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.put<SettingsDto>('/settings/background', fd, { headers });
  return data;
}
