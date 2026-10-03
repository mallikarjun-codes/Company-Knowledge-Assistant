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

// On 401 responses, clear auth state and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location to force a full redirect outside of React Router context
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

// ── Chat (Legacy) ───────────────────────────────────────────────────────────────

export async function askQuestion(question) {
  const { data } = await api.post('/chat/ask', { question });
  return data; // { answer, sources }
}

export async function getChatHistory() {
  const { data } = await api.get('/chat/history');
  return data;
}

// ── Conversations ───────────────────────────────────────────────────────────────

export async function getConversations() {
  const { data } = await api.get('/conversations');
  return data;
}

export async function createConversation() {
  const { data } = await api.post('/conversations');
  return data;
}

export async function getConversationMessages(id) {
  const { data } = await api.get(`/conversations/${id}`);
  return data;
}

export async function deleteConversation(id) {
  const { data } = await api.delete(`/conversations/${id}`);
  return data;
}

export async function askQuestionInConversation(id, question) {
  const { data } = await api.post(`/conversations/${id}/messages`, { question });
  return data;
}

export default api;
