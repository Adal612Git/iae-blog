import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:5000/api' });

function headers(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token }
}

export async function getPosts(token) {
  const { data } = await api.get('/posts', { headers: headers(token) });
  return data;
}

export async function createPost(token, payload) {
  let body = payload;
  let hdrs = headers(token);
  if (!(payload instanceof FormData)) {
    const { title, content, file } = payload || {};
    if (file) {
      body = new FormData();
      if (title) body.append('title', title);
      if (content) body.append('content', content);
      body.append('file', file);
    } else {
      body = { title, content };
      hdrs['Content-Type'] = 'application/json';
    }
  }
  const { data } = await api.post('/posts', body, { headers: hdrs });
  return data;
}

export async function updatePost(token, id, payload) {
  let body = payload;
  let hdrs = headers(token);
  if (!(payload instanceof FormData)) {
    const { title, content, file } = payload || {};
    if (file) {
      body = new FormData();
      if (title != null) body.append('title', title);
      if (content != null) body.append('content', content);
      body.append('file', file);
    } else {
      body = { ...(title != null ? { title } : {}), ...(content != null ? { content } : {}) };
      hdrs['Content-Type'] = 'application/json';
    }
  }
  const { data } = await api.put(`/posts/${id}`, body, { headers: hdrs });
  return data;
}

export async function deletePost(token, id) {
  const { data } = await api.delete(`/posts/${id}`, { headers: headers(token) });
  return data;
}

export default { api, login, getPosts, createPost, updatePost, deletePost };

