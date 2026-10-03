import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach Bearer token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ────────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { token, user }
}

export async function registerUser(nameOrEmail, emailOrPassword, passwordOrRole, maybeRole) {
  let payload;
  if (typeof nameOrEmail === 'object') {
    payload = nameOrEmail;
  } else if (maybeRole !== undefined) {
    payload = {
      name: nameOrEmail,
      email: emailOrPassword,
      password: passwordOrRole,
      role: maybeRole,
    };
  } else {
    // Legacy (email, password, role)
    payload = {
      name: nameOrEmail ? nameOrEmail.split('@')[0] : 'User',
      email: nameOrEmail,
      password: emailOrPassword,
      role: passwordOrRole || 'EMPLOYEE',
    };
  }
  const { data } = await api.post('/auth/register', payload);
  return data; // { token, user }
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data; // { user }
}

// ── Documents ───────────────────────────────────────────────────────────────────

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getDocuments() {
  const { data } = await api.get('/documents');
  return data;
}

export async function deleteDocument(id) {
  const { data } = await api.delete(`/documents/${id}`);
  return data;
}

// ── Chat ────────────────────────────────────────────────────────────────────────

export async function askQuestion(question) {
  const { data } = await api.post('/chat/ask', { question });
  return data; // { answer, sources }
}

export async function getChatHistory() {
  const { data } = await api.get('/chat/history');
  return data;
}

export default api;
