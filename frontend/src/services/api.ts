import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:5000/api' });

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  views?: number;
  likes?: number;
  image?: string;
  video?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function getPosts(): Promise<PostDto[]> {
  const { data } = await api.get<PostDto[]>('/posts');
  return data;
}

export async function createPost(
  data: { title: string; content: string; file?: File },
  token: string
): Promise<PostDto> {
  const headers = { ...authHeaders(token) } as Record<string, string>;

  let body: FormData | { title: string; content: string };
  if (data.file) {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('content', data.content);
    fd.append('file', data.file);
    body = fd; // No seteamos Content-Type manualmente
  } else {
    body = { title: data.title, content: data.content };
    headers['Content-Type'] = 'application/json';
  }

  const res = await api.post<PostDto>('/posts', body, { headers });
  return res.data;
}

export async function updatePost(
  id: string,
  data: { title?: string; content?: string; file?: File },
  token: string
): Promise<PostDto> {
  const headers = { ...authHeaders(token) } as Record<string, string>;

  let body: FormData | { title?: string; content?: string };
  if (data.file) {
    const fd = new FormData();
    if (data.title != null) fd.append('title', data.title);
    if (data.content != null) fd.append('content', data.content);
    fd.append('file', data.file);
    body = fd;
  } else {
    body = {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.content != null ? { content: data.content } : {}),
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
